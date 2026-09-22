import crypto from 'crypto';
import dns from 'dns';
import nodemailer from 'nodemailer';
import { SmtpConfig, EmailLogEntry, DEFAULT_SMTP_CONFIG } from '../src/types/index.js';

// Enforce IPv4 lookups first on environments without IPv6 internet egress (such as Render containers)
if (typeof (dns as any).setDefaultResultOrder === 'function') {
  (dns as any).setDefaultResultOrder('ipv4first');
}

export interface PendingRegistration {
  email: string;
  name: string;
  passwordHash: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

export interface PendingPasswordReset {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

class EmailService {
  private pendingOtps: Map<string, PendingRegistration> = new Map();
  private pendingPasswordResets: Map<string, PendingPasswordReset> = new Map();
  private smtpConfigGetter?: () => SmtpConfig;
  private emailLogs: EmailLogEntry[] = [];

  constructor() {
    // Periodically clean expired OTPs every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [email, item] of this.pendingOtps.entries()) {
        if (item.expiresAt < now) {
          this.pendingOtps.delete(email);
        }
      }
      for (const [email, item] of this.pendingPasswordResets.entries()) {
        if (item.expiresAt < now) {
          this.pendingPasswordResets.delete(email);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Register a dynamic getter for SMTP config from PlatformManager
   */
  public setSmtpConfigGetter(getter: () => SmtpConfig): void {
    this.smtpConfigGetter = getter;
  }

  /**
   * Returns recent email dispatch & OTP logs (last 50)
   */
  public getEmailLogs(): EmailLogEntry[] {
    return [...this.emailLogs].reverse();
  }

  /**
   * Internal helper to record an email log entry
   */
  private addLog(entry: Omit<EmailLogEntry, 'id' | 'timestamp'>): void {
    const log: EmailLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.emailLogs.push(log);
    if (this.emailLogs.length > 50) {
      this.emailLogs.shift();
    }
  }

  /**
   * Resolve active SMTP / Resend config from manager or environment variables
   */
  public getEffectiveSmtpConfig(): SmtpConfig {
    if (this.smtpConfigGetter) {
      const stored = this.smtpConfigGetter();
      if (stored && (stored.host || stored.resendApiKey)) {
        return stored;
      }
    }

    // Fallback to process.env
    const envHost = process.env.SMTP_HOST || '';
    const envUser = process.env.SMTP_USER || '';
    const envPass = process.env.SMTP_PASS || '';
    const envResend = process.env.RESEND_API_KEY || '';
    const envPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const envSecure = envPort === 465 || process.env.SMTP_SECURE === 'true';

    return {
      enabled: !!(envResend || (envHost && envUser && envPass)),
      provider: envResend ? 'resend' : 'smtp',
      resendApiKey: envResend,
      host: envHost || DEFAULT_SMTP_CONFIG.host,
      port: envPort,
      secure: envSecure,
      user: envUser,
      pass: envPass,
      fromName: 'pleng.online 🎧',
      fromEmail: process.env.SMTP_FROM || envUser || 'admin@pleng.online',
    };
  }

  /**
   * Hash password securely using SHA-256 with a salt
   */
  public hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password.trim() + '_pleng_salt_2026').digest('hex');
  }

  /**
   * Universal email sender: Supports both modern Resend REST API (Port 443 HTTPS) and standard SMTP (IPv4 forced)
   */
  public async sendMail(
    to: string,
    subject: string,
    html: string,
    customConfig?: SmtpConfig
  ): Promise<{ success: boolean; error?: string }> {
    const config = customConfig || this.getEffectiveSmtpConfig();
    const isResend = config.provider === 'resend' || (!config.user && !!(config.resendApiKey || process.env.RESEND_API_KEY));

    // 1. Resend REST API (Bypasses Render SMTP port blocks completely via HTTPS Port 443!)
    if (isResend) {
      const apiKey = (config.resendApiKey || process.env.RESEND_API_KEY || '').trim();
      if (!apiKey) {
        return { success: false, error: 'ยังไม่ได้ระบุ Resend API Key' };
      }

      try {
        let fromAddress = 'onboarding@resend.dev';
        if (config.fromEmail && !config.fromEmail.includes('@gmail.com') && !config.fromEmail.includes('@yahoo.com') && !config.fromEmail.includes('@hotmail.com')) {
          fromAddress = `${config.fromName || 'pleng.online'} <${config.fromEmail}>`;
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [to],
            subject,
            html,
          }),
        });

        const data = await res.json();
        if (res.ok && data.id) {
          return { success: true };
        }
        return { success: false, error: data.message || JSON.stringify(data) };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    }

    // 2. Traditional SMTP transport with IPv4 enforcement
    if (config.host && config.user && config.pass) {
      try {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure || config.port === 465,
          auth: {
            user: config.user,
            pass: config.pass,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          tls: {
            rejectUnauthorized: false,
          },
          family: 4, // Enforce IPv4 socket connection
        } as any);

        const fromAddress = config.fromEmail.includes('<')
          ? config.fromEmail
          : `"${config.fromName || 'pleng.online'}" <${config.fromEmail || config.user}>`;

        await transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html,
        });

        return { success: true };
      } catch (err: any) {
        let msg = err.message || 'SMTP Connection Error';
        if (msg.includes('ENETUNREACH') || msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
          msg += ' (Render Free Tier บล็อกพอร์ต SMTP ขาออก 25, 465, 587 แนะนำให้สลับไปใช้ Resend API ซึ่งส่งผ่านพอร์ต 443 ได้ 100% ฟรี 3,000 ฉบับ/เดือน)';
        }
        return { success: false, error: msg };
      }
    }

    return { success: false, error: 'ยังไม่ได้ตั้งค่าผู้ให้บริการส่งอีเมล (กรุณาตั้งค่า Resend API หรือ SMTP)' };
  }

  /**
   * Generates a 6-digit OTP code and stores pending registration
   */
  public async createRegistrationOtp(
    email: string,
    name: string,
    password: string
  ): Promise<{ code: string; expiresAt: number }> {
    const cleanEmail = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    const passwordHash = this.hashPassword(password);

    this.pendingOtps.set(cleanEmail, {
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
      code,
      expiresAt,
      attempts: 0,
    });

    await this.sendOtpEmail(cleanEmail, name.trim(), code);

    return { code, expiresAt };
  }

  /**
   * Sends the OTP email (Resend / SMTP if configured, otherwise server console log)
   */
  private async sendOtpEmail(email: string, name: string, code: string): Promise<boolean> {
    const config = this.getEffectiveSmtpConfig();
    const isConfigured = (config.provider === 'resend' && (config.resendApiKey || process.env.RESEND_API_KEY)) ||
      (config.enabled && config.host && config.user && config.pass);

    console.log(`\n======================================================`);
    console.log(`📩 [EMAIL SERVICE] ส่งรหัสยืนยันการสมัครสมาชิก pleng.online`);
    console.log(`👤 ถึง: ${name} <${email}>`);
    console.log(`🔑 รหัสยืนยัน OTP: ${code}`);
    console.log(`⏱️ หมดอายุใน: 10 นาที`);
    console.log(`🌐 สถานะการส่ง: ${isConfigured ? 'เปิดใช้งาน (' + (config.provider === 'resend' ? 'Resend API' : config.host) + ')' : 'ปิด/ยังไม่ตั้งค่า (โหมดจำลอง/บันทึก Log)'}`);
    console.log(`======================================================\n`);

    const otpHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0075de; margin-top: 0;">ยืนยันการสมัครสมาชิก pleng.online 🎧</h2>
        <p style="font-size: 14px; color: #333333;">สวัสดีคุณ <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #555555;">ขอบคุณที่ร่วมเป็นส่วนหนึ่งของ pleng.online โปรดใช้รหัสยืนยันด้านล่างนี้เพื่อเปิดใช้งานบัญชีของคุณ:</p>
        <div style="background: #f4f7fa; border: 2px dashed #0075de; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0075de;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #888888; margin-bottom: 0;">* รหัสยืนยันนี้มีอายุการใช้งาน 10 นาที หากคุณไม่ได้ทำรายการนี้ สามารถเพิกเฉยต่ออีเมลนี้ได้</p>
      </div>
    `;

    if (isConfigured) {
      const res = await this.sendMail(email, `[pleng.online] รหัสยืนยันการสมัครสมาชิกของคุณคือ ${code}`, otpHtml, config);
      if (res.success) {
        this.addLog({
          type: 'register_otp',
          email,
          code,
          status: 'sent_smtp',
        });
        return true;
      } else {
        console.error('Failed to send registration OTP:', res.error);
        this.addLog({
          type: 'register_otp',
          email,
          code,
          status: 'failed',
          errorMessage: res.error,
        });
        return false;
      }
    }

    // In console fallback mode
    this.addLog({
      type: 'register_otp',
      email,
      code,
      status: 'console_fallback',
    });
    return true;
  }

  /**
   * Verifies the OTP code for an email
   */
  public verifyOtp(
    email: string,
    inputCode: string
  ): { success: boolean; data?: PendingRegistration; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const pending = this.pendingOtps.get(cleanEmail);

    if (!pending) {
      return { success: false, message: 'ไม่พบคำขอสมัครสมาชิกหรือรหัสหมดอายุแล้ว กรุณาขอรหัสใหม่อีกครั้ง' };
    }

    if (Date.now() > pending.expiresAt) {
      this.pendingOtps.delete(cleanEmail);
      return { success: false, message: 'รหัสยืนยันหมดอายุแล้ว กรุณากดขอรหัสใหม่' };
    }

    if (pending.attempts >= 5) {
      this.pendingOtps.delete(cleanEmail);
      return { success: false, message: 'กรอกรหัสผิดเกินจำนวนที่กำหนด กรุณาสมัครใหม่อีกครั้ง' };
    }

    if (pending.code !== inputCode.trim()) {
      pending.attempts += 1;
      return { success: false, message: `รหัสยืนยันไม่ถูกต้อง (เหลือโอกาสอีก ${5 - pending.attempts} ครั้ง)` };
    }

    // Success! Remove from pending
    this.pendingOtps.delete(cleanEmail);
    return { success: true, data: pending };
  }

  /**
   * Generates a 6-digit OTP code for password reset
   */
  public async createPasswordResetOtp(email: string): Promise<{ code: string; expiresAt: number }> {
    const cleanEmail = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    this.pendingPasswordResets.set(cleanEmail, {
      email: cleanEmail,
      code,
      expiresAt,
      attempts: 0,
    });

    await this.sendPasswordResetEmail(cleanEmail, code);

    return { code, expiresAt };
  }

  /**
   * Sends the password reset OTP email
   */
  private async sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
    const config = this.getEffectiveSmtpConfig();
    const isConfigured = (config.provider === 'resend' && (config.resendApiKey || process.env.RESEND_API_KEY)) ||
      (config.enabled && config.host && config.user && config.pass);

    console.log(`\n======================================================`);
    console.log(`🔑 [EMAIL SERVICE] ส่งรหัสรีเซ็ตรหัสผ่าน pleng.online`);
    console.log(`👤 ถึง: ${email}`);
    console.log(`🔑 รหัสยืนยัน OTP: ${code}`);
    console.log(`⏱️ หมดอายุใน: 10 นาที`);
    console.log(`🌐 สถานะการส่ง: ${isConfigured ? 'เปิดใช้งาน (' + (config.provider === 'resend' ? 'Resend API' : config.host) + ')' : 'ปิด/ยังไม่ตั้งค่า (โหมดจำลอง/บันทึก Log)'}`);
    console.log(`======================================================\n`);

    const resetHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0075de; margin-top: 0;">คำขอรีเซ็ตรหัสผ่าน pleng.online 🔐</h2>
        <p style="font-size: 14px; color: #333333;">มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชี: <strong>${email}</strong></p>
        <p style="font-size: 14px; color: #555555;">โปรดใช้รหัสยืนยันด้านล่างนี้เพื่อตั้งรหัสผ่านใหม่ของคุณ:</p>
        <div style="background: #f4f7fa; border: 2px dashed #0075de; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0075de;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #888888; margin-bottom: 0;">* รหัสยืนยันนี้มีอายุ 10 นาที หากคุณไม่ได้ทำรายการนี้ สามารถเพิกเฉยต่ออีเมลนี้ได้</p>
      </div>
    `;

    if (isConfigured) {
      const res = await this.sendMail(email, `[pleng.online] รหัสรีเซ็ตรหัสผ่านของคุณคือ ${code}`, resetHtml, config);
      if (res.success) {
        this.addLog({
          type: 'reset_password_otp',
          email,
          code,
          status: 'sent_smtp',
        });
        return true;
      } else {
        console.error('Failed to send reset email:', res.error);
        this.addLog({
          type: 'reset_password_otp',
          email,
          code,
          status: 'failed',
          errorMessage: res.error,
        });
        return false;
      }
    }

    this.addLog({
      type: 'reset_password_otp',
      email,
      code,
      status: 'console_fallback',
    });
    return true;
  }

  /**
   * Verifies the OTP code for password reset
   */
  public verifyPasswordResetOtp(
    email: string,
    inputCode: string
  ): { success: boolean; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const pending = this.pendingPasswordResets.get(cleanEmail);

    if (!pending) {
      return { success: false, message: 'ไม่พบคำขอรีเซ็ตรหัสผ่านหรือรหัสหมดอายุแล้ว กรุณาขอรหัสใหม่อีกครั้ง' };
    }

    if (Date.now() > pending.expiresAt) {
      this.pendingPasswordResets.delete(cleanEmail);
      return { success: false, message: 'รหัสยืนยันหมดอายุแล้ว กรุณากดขอรหัสใหม่' };
    }

    if (pending.attempts >= 5) {
      this.pendingPasswordResets.delete(cleanEmail);
      return { success: false, message: 'กรอกรหัสผิดเกินจำนวนที่กำหนด กรุณาขอรหัสใหม่อีกครั้ง' };
    }

    if (pending.code !== inputCode.trim()) {
      pending.attempts += 1;
      return { success: false, message: `รหัสยืนยันไม่ถูกต้อง (เหลือโอกาสอีก ${5 - pending.attempts} ครั้ง)` };
    }

    // Success! Remove from pending
    this.pendingPasswordResets.delete(cleanEmail);
    return { success: true };
  }

  /**
   * Sends a test email to verify SMTP / Resend configuration
   */
  public async sendTestEmail(
    toEmail: string,
    customConfig?: SmtpConfig
  ): Promise<{ success: boolean; message: string }> {
    const config = customConfig || this.getEffectiveSmtpConfig();
    const isResend = config.provider === 'resend' || (!config.user && !!config.resendApiKey);

    if (isResend && !config.resendApiKey && !process.env.RESEND_API_KEY) {
      return {
        success: false,
        message: 'กรุณากรอก Resend API Key ก่อนกดส่งทดสอบ',
      };
    }

    if (!isResend && (!config.host || !config.user || !config.pass)) {
      return {
        success: false,
        message: 'กรุณากรอกข้อมูล SMTP Server, Username และ Password ให้ครบถ้วนก่อนทดสอบ',
      };
    }

    const testHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #10b981; margin-top: 0;">🎉 ทดสอบการส่งอีเมลสำเร็จ!</h2>
        <p style="font-size: 14px; color: #333333;">สวัสดีครับผู้ดูแลระบบ pleng.online,</p>
        <p style="font-size: 14px; color: #555555;">นี่คืออีเมลทดสอบยืนยันว่าการตั้งค่า <strong>${isResend ? 'Resend API Gateway' : 'SMTP Gateway'}</strong> ของคุณทำงานได้อย่างสมบูรณ์แบบแล้ว!</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #166534;">
            <strong>เวลาที่ส่ง:</strong> ${new Date().toLocaleString('th-TH')}<br/>
            <strong>ส่งไปยัง:</strong> ${toEmail}<br/>
            <strong>ช่องทาง:</strong> ${isResend ? 'Resend REST API (HTTPS Port 443)' : `SMTP (${config.host}:${config.port})`}
          </p>
        </div>
        <p style="font-size: 12px; color: #888888; margin-bottom: 0;">ระบบ WatchParty & Voice Stage พร้อมสำหรับการส่งอีเมลยืนยันสมาชิกและรหัส OTP แล้ว</p>
      </div>
    `;

    const res = await this.sendMail(toEmail, '[pleng.online] ทดสอบการส่งอีเมลสำเร็จ! 🎉', testHtml, config);
    if (res.success) {
      this.addLog({
        type: 'test',
        email: toEmail,
        status: 'sent_smtp',
      });
      return {
        success: true,
        message: `ส่งอีเมลทดสอบไปยัง ${toEmail} สำเร็จเรียบร้อย! 🎉 กรุณาตรวจสอบในกล่องจดหมายของคุณ (Inbox หรือ Spam)`,
      };
    } else {
      this.addLog({
        type: 'test',
        email: toEmail,
        status: 'failed',
        errorMessage: res.error,
      });
      return {
        success: false,
        message: `การทดสอบล้มเหลว: ${res.error}`,
      };
    }
  }

  /**
   * Send notification to user when admin replies or updates status of a support ticket
   */
  public async sendTicketUpdateEmail(
    toEmail: string,
    userName: string,
    ticketTitle: string,
    status: string,
    adminReply?: string
  ): Promise<boolean> {
    const cleanEmail = toEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return false;

    const statusText =
      status === 'resolved'
        ? 'แก้ไขเสร็จสิ้นเรียบร้อยแล้ว (Resolved) ✅'
        : status === 'in_progress'
        ? 'ผู้ดูแลระบบกำลังตรวจสอบและดำเนินการ (In Progress) 🔍'
        : 'ได้รับเรื่องแล้ว รอดำเนินการ (Pending) ⏳';

    const statusBadgeColor =
      status === 'resolved' ? '#10b981' : status === 'in_progress' ? '#0075de' : '#f59e0b';

    const subject =
      status === 'resolved'
        ? `[pleng.online] ✅ แจ้งผล: ปัญหาได้รับการแก้ไขแล้ว ("${ticketTitle}")`
        : `[pleng.online] 📩 มีข้อความตอบกลับเกี่ยวกับ: "${ticketTitle}"`;

    const config = this.getEffectiveSmtpConfig();
    const isConfigured = (config.provider === 'resend' && (config.resendApiKey || process.env.RESEND_API_KEY)) ||
      (config.enabled && config.host && config.user && config.pass);

    console.log(`\n======================================================`);
    console.log(`📩 [EMAIL SERVICE] ส่งอีเมลแจ้งเตือนสถานะ Ticket ไปยังผู้ใช้`);
    console.log(`👤 ถึง: ${userName} <${cleanEmail}>`);
    console.log(`📋 หัวข้อ: ${ticketTitle}`);
    console.log(`🚦 สถานะ: ${statusText}`);
    if (adminReply) console.log(`💬 ข้อความแอดมิน: ${adminReply}`);
    console.log(`======================================================\n`);

    const ticketHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0075de; margin-top: 0;">อัปเดตปัญหาที่คุณแจ้ง (Support Ticket) 🎫</h2>
        <p style="font-size: 14px; color: #333333;">สวัสดีคุณ <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; color: #555555;">ทีมงาน pleng.online ได้อัปเดตสถานะปัญหาที่คุณแจ้งไว้เรียบร้อยแล้วครับ:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">หัวข้อปัญหา:</span>
            <div style="font-size: 15px; font-weight: bold; color: #1e293b; margin-top: 2px;">${ticketTitle}</div>
          </div>
          <div style="margin-bottom: ${adminReply ? '12px' : '0'};">
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">สถานะล่าสุด:</span>
            <div style="margin-top: 4px;">
              <span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #ffffff; background-color: ${statusBadgeColor};">
                ${statusText}
              </span>
            </div>
          </div>
          ${
            adminReply
              ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ข้อความจากผู้ดูแลระบบ:</span>
              <div style="font-size: 14px; color: #334155; margin-top: 4px; line-height: 1.5; white-space: pre-wrap; background: #ffffff; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${adminReply}</div>
            </div>
          `
              : ''
          }
        </div>
        <p style="font-size: 13px; color: #64748b;">คุณสามารถเข้าสู่ระบบ pleng.online เพื่อดูรายละเอียดเพิ่มเติมหรือติดตามสถานะได้ตลอดเวลา</p>
      </div>
    `;

    if (isConfigured) {
      const res = await this.sendMail(cleanEmail, subject, ticketHtml, config);
      if (res.success) {
        this.addLog({
          type: 'ticket_update',
          email: cleanEmail,
          status: 'sent_smtp',
        });
        return true;
      } else {
        this.addLog({
          type: 'ticket_update',
          email: cleanEmail,
          status: 'failed',
          errorMessage: res.error,
        });
        return false;
      }
    }

    this.addLog({
      type: 'ticket_update',
      email: cleanEmail,
      status: 'console_fallback',
    });
    return true;
  }
}

export const emailService = new EmailService();
