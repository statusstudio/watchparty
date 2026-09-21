import crypto from 'crypto';

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
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

    console.log(`\n======================================================`);
    console.log(`📩 [EMAIL SERVICE] ส่งรหัสยืนยันการสมัครสมาชิก pleng.online`);
    console.log(`👤 ถึง: ${name} <${email}>`);
    console.log(`🔑 รหัสยืนยัน OTP: ${code}`);
    console.log(`⏱️ หมดอายุใน: 10 นาที`);
    console.log(`======================================================\n`);

    if (smtpHost && smtpUser && smtpPass) {
      try {
        // Optional dynamic nodemailer support
        const nodemailer = await import('nodemailer' as any).catch(() => null);
        if (nodemailer && nodemailer.createTransport) {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || `"pleng.online" <${smtpUser}>`,
            to: email,
            subject: `[pleng.online] รหัสยืนยันการสมัครสมาชิกของคุณคือ ${code}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff;">
                <h2 style="color: #0075de; margin-top: 0;">ยืนยันการสมัครสมาชิก pleng.online 🎧</h2>
                <p style="font-size: 14px; color: #333333;">สวัสดีคุณ <strong>${name}</strong>,</p>
                <p style="font-size: 14px; color: #555555;">ขอบคุณที่สมัครสมาชิกกับเรา โปรดใช้รหัสยืนยันด้านล่างนี้เพื่อเปิดใช้งานบัญชีของคุณ:</p>
                <div style="background: #f4f7fa; border: 2px dashed #0075de; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0075de;">${code}</span>
                </div>
                <p style="font-size: 12px; color: #888888; margin-bottom: 0;">* รหัสยืนยันนี้มีอายุการใช้งาน 10 นาที หากคุณไม่ได้ทำรายการนี้ สามารถเพิกเฉยต่ออีเมลนี้ได้</p>
              </div>
            `,
          });
          return true;
        }
      } catch (err) {
        console.error('Failed to send via SMTP transport:', err);
      }
    }

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
   * Check if an email has an active pending registration
   */
  public getPending(email: string): PendingRegistration | undefined {
    return this.pendingOtps.get(email.trim().toLowerCase());
  }

  /**
   * Generates a 6-digit OTP code for password reset
   */
  public async createPasswordResetOtp(
    email: string
  ): Promise<{ code: string; expiresAt: number }> {
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
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

    console.log(`\n======================================================`);
    console.log(`🔐 [EMAIL SERVICE] รหัสรีเซ็ตรหัสผ่าน pleng.online`);
    console.log(`👤 ถึง: <${email}>`);
    console.log(`🔑 รหัสยืนยัน OTP: ${code}`);
    console.log(`⏱️ หมดอายุใน: 10 นาที`);
    console.log(`======================================================\n`);

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const nodemailer = await import('nodemailer' as any).catch(() => null);
        if (nodemailer && nodemailer.createTransport) {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || `"pleng.online" <${smtpUser}>`,
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
          return true;
        }
      } catch (err) {
        console.error('Failed to send reset email via SMTP transport:', err);
      }
    }

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
}

export const emailService = new EmailService();
