import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { SmtpConfig, EmailLogEntry, DEFAULT_SMTP_CONFIG } from '../src/types/index.js';

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
   * Resolve active SMTP config from manager or environment variables
   */
  public getEffectiveSmtpConfig(): SmtpConfig {
    if (this.smtpConfigGetter) {
      const stored = this.smtpConfigGetter();
      if (stored && stored.host) {
        return stored;
      }
    }

    // Fallback to process.env
    const envHost = process.env.SMTP_HOST || '';
    const envUser = process.env.SMTP_USER || '';
    const envPass = process.env.SMTP_PASS || '';
    const envPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const envSecure = envPort === 465 || process.env.SMTP_SECURE === 'true';

    return {
      enabled: !!(envHost && envUser && envPass),
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
   * Sends the OTP email (SMTP if configured, otherwise server console log)
   */
  private async sendOtpEmail(email: string, name: string, code: string): Promise<boolean> {
    const config = this.getEffectiveSmtpConfig();

    console.log(`\n======================================================`);
    console.log(`📩 [EMAIL SERVICE] ส่งรหัสยืนยันการสมัครสมาชิก pleng.online`);
    console.log(`👤 ถึง: ${name} <${email}>`);
    console.log(`🔑 รหัสยืนยัน OTP: ${code}`);
    console.log(`⏱️ หมดอายุใน: 10 นาที`);
    console.log(`🌐 สถานะ SMTP: ${config.enabled ? 'เปิดใช้งาน (' + config.host + ')' : 'ปิด/ยังไม่ตั้งค่า (โหมดจำลอง)'}`);
    console.log(`======================================================\n`);

    if (config.enabled && config.host && config.user && config.pass) {
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
          tls: {
            rejectUnauthorized: false,
          },
        });

        const fromAddress = config.fromEmail.includes('<')
          ? config.fromEmail
          : `"${config.fromName || 'pleng.online'}" <${config.fromEmail || config.user}>`;

        await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject: `[pleng.online] รหัสยืนยันการสมัครสมาชิกของคุณคือ ${code}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff;">
              <h2 style="color: #0075de; margin-top: 0;">ยืนยันการสมัครสมาชิก pleng.online 🎧</h2>
              <p style="font-size: 14px; color: #333333;">สวัสดีคุณ <strong>${name}</strong>,</p>
              <p style="font-size: 14px; color: #555555;">ขอบคุณที่ร่วมเป็นส่วนหนึ่งของ pleng.online โปรดใช้รหัสยืนยันด้านล่างนี้เพื่อเปิดใช้งานบัญชีของคุณ:</p>
              <div style="background: #f4f7fa; border: 2px dashed #0075de; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0075de;">${code}</span>
              </div>
              <p style="font-size: 12px; color: #888888; margin-bottom: 0;">* รหัสยืนยันนี้มีอายุการใช้งาน 10 นาที หากคุณไม่ได้ทำรายการนี้ สามารถเพิกเฉยต่ออีเมลนี้ได้</p>
            </div>
          `,
        });

        this.addLog({
          type: 'register_otp',
          email,
          code,
          status: 'sent_smtp',
        });
        return true;
      } catch (err: any) {
        console.error('Failed to send registration OTP via SMTP:', err);
        this.addLog({
          type: 'register_otp',
          email,
          code,
          status: 'failed',
          errorMessage: err.message || 'SMTP Error',
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
   * Creates a 6-digit OTP code for password reset
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

    console.log(`\n======================================================`);
    console.log(`🔐 [EMAIL SERVICE] รหัสรีเซ็ตรหัสผ่าน pleng.online`);
    console.log(`👤 ถึง: <${email}>`);
    console.log(`🔑 รหัสยืนยัน OTP: ${code}`);
    console.log(`⏱️ หมดอายุใน: 10 นาที`);
    console.log(`🌐 สถานะ SMTP: ${config.enabled ? 'เปิดใช้งาน (' + config.host + ')' : 'ปิด/ยังไม่ตั้งค่า (โหมดจำลอง)'}`);
    console.log(`======================================================\n`);

    if (config.enabled && config.host && config.user && config.pass) {
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
          tls: {
            rejectUnauthorized: false,
          },
        });

        const fromAddress = config.fromEmail.includes('<')
          ? config.fromEmail
          : `"${config.fromName || 'pleng.online'}" <${config.fromEmail || config.user}>`;

        await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject: `[pleng.online] รหัสรีเซ็ตรหัสผ่านของคุณคือ ${code}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff;">
              <h2 style="color: #0075de; margin-top: 0;">คำขอรีเซ็ตรหัสผ่าน pleng.online 🔐</h2>
              <p style="font-size: 14px; color: #333333;">มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชี: <strong>${email}</strong></p>
              <p style="font-size: 14px; color: #555555;">โปรดใช้รหัสยืนยันด้านล่างนี้เพื่อตั้งรหัสผ่านใหม่ของคุณ:</p>
              <div style="background: #f4f7fa; border: 2px dashed #0075de; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0075de;">${code}</span>
              </div>
              <p style="font-size: 12px; color: #888888; margin-bottom: 0;">* รหัสยืนยันนี้มีอายุ 10 นาที หากคุณไม่ได้ทำรายการนี้ สามารถเพิกเฉยต่ออีเมลนี้ได้</p>
            </div>
          `,
        });

        this.addLog({
          type: 'reset_password_otp',
          email,
          code,
          status: 'sent_smtp',
        });
        return true;
      } catch (err: any) {
        console.error('Failed to send reset email via SMTP transport:', err);
        this.addLog({
          type: 'reset_password_otp',
          email,
          code,
          status: 'failed',
          errorMessage: err.message || 'SMTP Error',
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
   * Sends a test email to verify SMTP configuration
   */
  public async sendTestEmail(
    toEmail: string,
    customConfig?: SmtpConfig
  ): Promise<{ success: boolean; message: string }> {
    const config = customConfig || this.getEffectiveSmtpConfig();

    if (!config.host || !config.user || !config.pass) {
      return {
        success: false,
        message: 'กรุณากรอกข้อมูล SMTP Server, Username และ Password ให้ครบถ้วนก่อนทดสอบ',
      };
    }

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
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify connection first
      await transporter.verify();

      const fromAddress = config.fromEmail.includes('<')
        ? config.fromEmail
        : `"${config.fromName || 'pleng.online'}" <${config.fromEmail || config.user}>`;

      await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: `[pleng.online] 🧪 ทดสอบระบบส่งอีเมลสำเร็จ! (${new Date().toLocaleTimeString('th-TH')})`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #10b981; margin: 0; font-size: 24px;">🎉 เชื่อมต่อระบบอีเมลสำเร็จ!</h1>
              <p style="color: #666666; font-size: 14px; margin-top: 6px;">ระบบส่งอีเมลของ pleng.online พร้อมใช้งานแล้ว</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>SMTP Host:</strong> ${config.host}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Port:</strong> ${config.port} (${config.secure ? 'SSL/TLS' : 'STARTTLS'})</p>
              <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Sender:</strong> ${fromAddress}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Recipient:</strong> ${toEmail}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Time:</strong> ${new Date().toLocaleString('th-TH')}</p>
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
              อีเมลฉบับนี้ส่งเพื่อทดสอบการเชื่อมต่อ SMTP หากคุณได้รับอีเมลนี้ แสดงว่าระบบ OTP สมัครสมาชิกและรีเซ็ตรหัสผ่านสามารถส่งถึงผู้ใช้งานได้จริง 100% แล้วครับ
            </p>
          </div>
        `,
      });

      this.addLog({
        type: 'test',
        email: toEmail,
        status: 'sent_smtp',
      });

      return {
        success: true,
        message: `ส่งอีเมลทดสอบไปยัง ${toEmail} สำเร็จเรียบร้อย! โปรดตรวจสอบในกล่องจดหมายของคุณ`,
      };
    } catch (err: any) {
      console.error('SMTP test error:', err);
      const errMsg = err.message || 'Unknown SMTP error';
      this.addLog({
        type: 'test',
        email: toEmail,
        status: 'failed',
        errorMessage: errMsg,
      });
      return {
        success: false,
        message: `การทดสอบล้มเหลว: ${errMsg}`,
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

    console.log(`\n======================================================`);
    console.log(`📩 [EMAIL SERVICE] ส่งอีเมลแจ้งเตือนสถานะ Ticket ไปยังผู้ใช้`);
    console.log(`👤 ถึง: ${userName} <${cleanEmail}>`);
    console.log(`📋 หัวข้อ: ${ticketTitle}`);
    console.log(`🚦 สถานะ: ${statusText}`);
    if (adminReply) console.log(`💬 ข้อความแอดมิน: ${adminReply}`);
    console.log(`======================================================\n`);

    if (config.enabled && config.host && config.user && config.pass) {
      try {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure || config.port === 465,
          auth: {
            user: config.user,
            pass: config.pass,
          },
          tls: { rejectUnauthorized: false },
        });

        const fromAddress = config.fromEmail.includes('<')
          ? config.fromEmail
          : `"${config.fromName || 'pleng.online'}" <${config.fromEmail || config.user}>`;

        await transporter.sendMail({
          from: fromAddress,
          to: cleanEmail,
          subject,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 14px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0075de; margin: 0; font-size: 22px;">pleng.online ศูนย์แจ้งปัญหา 🎧</h1>
                <p style="color: #64748b; font-size: 13px; margin-top: 6px;">แจ้งความคืบหน้าเรื่องที่คุณส่งเข้ามาในระบบ</p>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e293b;"><strong>เรื่องที่แจ้ง:</strong> ${ticketTitle}</p>
                <div style="display: inline-block; padding: 4px 10px; border-radius: 6px; background: ${statusBadgeColor}18; border: 1px solid ${statusBadgeColor}40; color: ${statusBadgeColor}; font-size: 12px; font-weight: bold;">
                  สถานะ: ${statusText}
                </div>
              </div>

              ${adminReply ? `
              <div style="background: #eff6ff; border-left: 4px solid #0075de; border-radius: 6px; padding: 14px; margin: 16px 0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #0075de;">👑 ข้อความตอบกลับจากผู้ดูแลระบบ:</p>
                <p style="margin: 0; font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${adminReply}</p>
              </div>
              ` : ''}

              <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-top: 16px;">
                สวัสดีครับคุณ <strong>${userName}</strong> ทีมงานได้ดำเนินการตรวจสอบและปรับปรุงตามที่ท่านแจ้งเข้ามาเรียบร้อยแล้ว ท่านสามารถเข้าใช้งานเว็บไซต์หรือตรวจสอบประวัติได้ที่:
              </p>

              <div style="text-align: center; margin: 24px 0;">
                <a href="https://pleng.online" style="display: inline-block; padding: 12px 28px; background: #0075de; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 8px;">
                  เข้าสู่เว็บไซต์ pleng.online
                </a>
              </div>

              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
                ขอขอบคุณที่ร่วมส่งข้อเสนอแนะเพื่อพัฒนา pleng.online 🎵
              </p>
            </div>
          `,
        });

        this.addLog({
          type: 'ticket_update',
          email: cleanEmail,
          status: 'sent_smtp',
        });
        return true;
      } catch (err: any) {
        console.error('Failed to send ticket email:', err);
        this.addLog({
          type: 'ticket_update',
          email: cleanEmail,
          status: 'failed',
          errorMessage: err.message,
        });
        return false;
      }
    } else {
      this.addLog({
        type: 'ticket_update',
        email: cleanEmail,
        status: 'simulated',
      });
      return true;
    }
  }
}

export const emailService = new EmailService();
