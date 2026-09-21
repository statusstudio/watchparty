import fs from 'fs';
import path from 'path';
import {
  PlatformUser,
  SupportTicket,
  TicketCategory,
  TicketStatus,
  TicketMessage,
  PlatformStats,
  UserProfile,
  PlatformConfig,
  DEFAULT_PLATFORM_CONFIG,
  TrackPlayStat,
  PlatformAnalytics,
  SmtpConfig,
  DEFAULT_SMTP_CONFIG,
} from '../src/types/index.js';
import type { RoomManager } from './roomManager.js';
import { emailService } from './emailService.js';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const STORE_FILE = path.join(DATA_DIR, 'platform_store.json');
export const MASTER_PASSCODE = process.env.ADMIN_MASTER_KEY || 'admin888';

export interface AdminCredentials {
  username: string;
  passwordHash: string;
  email: string;
  updatedAt: number;
}

export interface StoredUserAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar: string;
  color: string;
  createdAt: number;
  lastLoginAt: number;
}

interface StoreSchema {
  users: PlatformUser[];
  tickets: SupportTicket[];
  config?: PlatformConfig;
  topTracks?: TrackPlayStat[];
  adminCredentials?: AdminCredentials;
  userAccounts?: StoredUserAccount[];
  smtpConfig?: SmtpConfig;
}

export class PlatformManager {
  private users: Map<string, PlatformUser> = new Map();
  private userAccounts: Map<string, StoredUserAccount> = new Map();
  private adminCredentials: AdminCredentials = {
    username: 'admin',
    passwordHash: emailService.hashPassword('admin888'),
    email: 'admin@pleng.online',
    updatedAt: Date.now(),
  };
  private smtpConfig: SmtpConfig = {
    ...DEFAULT_SMTP_CONFIG,
    host: process.env.SMTP_HOST || DEFAULT_SMTP_CONFIG.host,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM || 'admin@pleng.online',
    enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  };
  private tickets: Map<string, SupportTicket> = new Map();
  private config: PlatformConfig = { ...DEFAULT_PLATFORM_CONFIG };
  private topTracks: Map<string, TrackPlayStat> = new Map();
  private startTime: number = Date.now();
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDataDir();
    this.loadStore();
    this.seedDefaults();
    emailService.setSmtpConfigGetter(() => this.getSmtpConfig());
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create server/data directory:', err);
      }
    }
  }

  private loadStore() {
    if (fs.existsSync(STORE_FILE)) {
      try {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const data: StoreSchema = JSON.parse(raw);

        // Load Admin Credentials
        if (data.adminCredentials && data.adminCredentials.username && data.adminCredentials.passwordHash) {
          this.adminCredentials = {
            username: data.adminCredentials.username,
            passwordHash: data.adminCredentials.passwordHash,
            email: data.adminCredentials.email || 'admin@pleng.online',
            updatedAt: data.adminCredentials.updatedAt || Date.now(),
          };
        }

        // Load Registered User Accounts
        if (Array.isArray(data.userAccounts)) {
          data.userAccounts.forEach((acc) => {
            this.userAccounts.set(acc.email.toLowerCase(), acc);
          });
        }

        // Load Users
        if (Array.isArray(data.users)) {
          data.users.forEach((u) => {
            // Map legacy admin if any to new admin ID
            if (u.id === 'usr-admin-system' || u.id === 'admin') {
              this.users.set('admin', {
                ...u,
                id: 'admin',
                name: this.adminCredentials.username,
                email: this.adminCredentials.email,
                isSuperAdmin: true,
              });
            } else {
              this.users.set(u.id, u);
            }
          });
        }

        if (Array.isArray(data.tickets)) {
          data.tickets.forEach((t) => this.tickets.set(t.id, t));
        }

        if (data.config) {
          this.config = {
            ...DEFAULT_PLATFORM_CONFIG,
            ...data.config,
            adPopup: data.config.adPopup
              ? {
                  enabled: !!data.config.adPopup.enabled,
                  title: String(data.config.adPopup.title || ''),
                  imageUrl: String(data.config.adPopup.imageUrl || ''),
                  linkUrl: String(data.config.adPopup.linkUrl || ''),
                  openInNewTab: data.config.adPopup.openInNewTab !== false,
                  updatedAt: data.config.adPopup.updatedAt || Date.now(),
                }
              : DEFAULT_PLATFORM_CONFIG.adPopup,
            globalWidgets: {
              ...DEFAULT_PLATFORM_CONFIG.globalWidgets,
              ...(data.config.globalWidgets || {}),
            },
            announcementBanner: data.config.announcementBanner
              ? {
                  enabled: !!data.config.announcementBanner.enabled,
                  text: String(data.config.announcementBanner.text || ''),
                  type: (data.config.announcementBanner.type as 'info' | 'warning' | 'alert') || 'info',
                }
              : DEFAULT_PLATFORM_CONFIG.announcementBanner,
          };
        }

        if (Array.isArray(data.topTracks)) {
          data.topTracks.forEach((tr) => this.topTracks.set(tr.videoId, tr));
        }

        if (data.smtpConfig) {
          this.smtpConfig = {
            ...DEFAULT_SMTP_CONFIG,
            ...data.smtpConfig,
          };
        }
      } catch (err) {
        console.error('Failed to parse platform_store.json:', err);
      }
    }
  }

  private scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        const data: StoreSchema = {
          users: Array.from(this.users.values()),
          userAccounts: Array.from(this.userAccounts.values()),
          adminCredentials: this.adminCredentials,
          tickets: Array.from(this.tickets.values()),
          config: this.config,
          topTracks: Array.from(this.topTracks.values()),
          smtpConfig: this.smtpConfig,
        };
        fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to save platform_store.json:', err);
      }
    }, 500);
  }

  private seedDefaults() {
    // Ensure Super Admin exists as user 'admin'
    if (!this.users.has('admin')) {
      this.users.set('admin', {
        id: 'admin',
        name: this.adminCredentials.username,
        email: this.adminCredentials.email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
        color: '#dd5b00',
        provider: 'email',
        isSuperAdmin: true,
        isSuspended: false,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
    }

    // Ensure at least one welcome ticket for showcase
    if (this.tickets.size === 0) {
      const sampleTicket: SupportTicket = {
        id: 'ticket-welcome',
        userId: 'admin',
        userName: 'admin',
        userEmail: this.adminCredentials.email,
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
        category: 'general',
        title: 'ยินดีต้อนรับสู่ระบบ Support & Feedback 🎉',
        description: 'ศูนย์ติดต่อเจ้าของเว็บ ยินดีรับฟังทุกปัญหาและข้อเสนอแนะเพื่อพัฒนาแพลตฟอร์มให้ดียิ่งขึ้นครับ',
        status: 'resolved',
        messages: [
          {
            id: 'msg-init',
            senderId: 'admin',
            senderName: `${this.adminCredentials.username} 👑`,
            senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
            isSuperAdmin: true,
            text: 'ยินดีต้อนรับสู่ระบบ pleng.online ผู้ใช้สามารถส่งข้อความมาหาเจ้าของเว็บได้ตลอด 24 ชั่วโมงครับ',
            timestamp: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.tickets.set(sampleTicket.id, sampleTicket);
    }

    this.scheduleSave();
  }

  // --- Admin Authentication & Management ---

  public verifyMasterPasscode(code: string): boolean {
    const trimmed = String(code).trim();
    return trimmed === MASTER_PASSCODE || emailService.hashPassword(trimmed) === this.adminCredentials.passwordHash;
  }

  public adminLogin(userOrEmail: string, pass: string): { success: boolean; user?: PlatformUser; message?: string } {
    const identifier = userOrEmail.trim().toLowerCase();
    const isUsernameMatch = identifier === this.adminCredentials.username.toLowerCase();
    const isEmailMatch = identifier === this.adminCredentials.email.toLowerCase();

    if (!isUsernameMatch && !isEmailMatch) {
      return { success: false, message: 'ชื่อผู้ใช้หรืออีเมลแอดมินไม่ถูกต้อง' };
    }

    const hashed = emailService.hashPassword(pass);
    if (hashed !== this.adminCredentials.passwordHash && pass.trim() !== MASTER_PASSCODE) {
      return { success: false, message: 'รหัสผ่านแอดมินไม่ถูกต้อง' };
    }

    // Refresh admin in users map
    const adminUser: PlatformUser = {
      id: 'admin',
      name: `${this.adminCredentials.username} 👑`,
      email: this.adminCredentials.email,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      color: '#dd5b00',
      provider: 'email',
      isSuperAdmin: true,
      isSuspended: false,
      createdAt: this.adminCredentials.updatedAt || Date.now(),
      lastActiveAt: Date.now(),
    };
    this.users.set('admin', adminUser);
    this.scheduleSave();

    return { success: true, user: adminUser };
  }

  public getAdminCredentials(): { username: string; email: string; updatedAt: number } {
    return {
      username: this.adminCredentials.username,
      email: this.adminCredentials.email,
      updatedAt: this.adminCredentials.updatedAt,
    };
  }

  public updateAdminCredentials(
    currentPass: string,
    newEmail?: string,
    newPass?: string
  ): { success: boolean; message: string; credentials?: { username: string; email: string } } {
    const hashed = emailService.hashPassword(currentPass);
    if (hashed !== this.adminCredentials.passwordHash && currentPass.trim() !== MASTER_PASSCODE) {
      return { success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };
    }

    if (newEmail && newEmail.trim()) {
      this.adminCredentials.email = newEmail.trim().toLowerCase();
    }

    if (newPass && newPass.trim()) {
      if (newPass.trim().length < 6) {
        return { success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
      }
      this.adminCredentials.passwordHash = emailService.hashPassword(newPass.trim());
    }

    this.adminCredentials.updatedAt = Date.now();

    // Update admin user profile
    const existingAdmin = this.users.get('admin');
    if (existingAdmin) {
      existingAdmin.email = this.adminCredentials.email;
      existingAdmin.lastActiveAt = Date.now();
    }

    this.scheduleSave();
    return {
      success: true,
      message: 'อัพเดทข้อมูลบัญชีแอดมินเรียบร้อยแล้ว',
      credentials: {
        username: this.adminCredentials.username,
        email: this.adminCredentials.email,
      },
    };
  }

  // --- SMTP Configuration ---

  public getSmtpConfig(): SmtpConfig {
    return { ...this.smtpConfig };
  }

  public getPublicSmtpConfig(): Omit<SmtpConfig, 'pass'> & { hasPass: boolean } {
    return {
      enabled: this.smtpConfig.enabled,
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure,
      user: this.smtpConfig.user,
      fromName: this.smtpConfig.fromName,
      fromEmail: this.smtpConfig.fromEmail,
      hasPass: !!(this.smtpConfig.pass && this.smtpConfig.pass.trim().length > 0),
    };
  }

  public updateSmtpConfig(newConfig: Partial<SmtpConfig>): SmtpConfig {
    const updated: SmtpConfig = {
      ...this.smtpConfig,
      ...newConfig,
    };

    // If new password is not provided or empty string, preserve existing password
    if (newConfig.pass === undefined || newConfig.pass === '') {
      updated.pass = this.smtpConfig.pass;
    } else {
      updated.pass = newConfig.pass.trim();
    }

    this.smtpConfig = updated;
    this.scheduleSave();
    return { ...this.smtpConfig };
  }

  // --- Member Registration & Login ---

  public registerMember(
    email: string,
    name: string,
    passwordHash: string
  ): { success: boolean; user?: PlatformUser; message?: string } {
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    if (this.userAccounts.has(cleanEmail)) {
      return { success: false, message: 'อีเมลนี้ได้ลงทะเบียนในระบบแล้ว กรุณาเข้าสู่ระบบ' };
    }

    const userId = 'usr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const now = Date.now();
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;
    const colors = ['#0075de', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const account: StoredUserAccount = {
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
      avatar,
      color: randomColor,
      createdAt: now,
      lastLoginAt: now,
    };

    const platformUser: PlatformUser = {
      id: userId,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      color: account.color,
      provider: 'email',
      isSuperAdmin: false,
      isSuspended: false,
      createdAt: now,
      lastActiveAt: now,
    };

    this.userAccounts.set(cleanEmail, account);
    this.users.set(userId, platformUser);
    this.scheduleSave();

    return { success: true, user: platformUser };
  }

  public loginMember(email: string, pass: string): { success: boolean; user?: PlatformUser; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const account = this.userAccounts.get(cleanEmail);

    if (!account) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิก' };
    }

    const hashed = emailService.hashPassword(pass);
    if (account.passwordHash !== hashed) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
    }

    const user = this.users.get(account.id);
    if (user && user.isSuspended) {
      return { success: false, message: 'บัญชีของคุณถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ' };
    }

    const now = Date.now();
    account.lastLoginAt = now;
    if (user) {
      user.lastActiveAt = now;
    }
    this.scheduleSave();

    return { success: true, user: user || {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      color: account.color,
      provider: 'email',
      isSuperAdmin: false,
      isSuspended: false,
      createdAt: account.createdAt,
      lastActiveAt: now,
    } };
  }

  public findUserByEmail(email: string): PlatformUser | undefined {
    const cleanEmail = email.trim().toLowerCase();
    return Array.from(this.users.values()).find((u) => u.email?.toLowerCase() === cleanEmail);
  }

  public isEmailRegistered(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    return this.userAccounts.has(cleanEmail) || cleanEmail === this.adminCredentials.email.toLowerCase();
  }

  public resetMemberPassword(
    email: string,
    newPassword: string
  ): { success: boolean; user?: PlatformUser; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const isAdminEmail = cleanEmail === this.adminCredentials.email.toLowerCase();
    const account = this.userAccounts.get(cleanEmail);

    if (!account && !isAdminEmail) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' };
    }

    if (newPassword.trim().length < 6) {
      return { success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
    }

    const newHash = emailService.hashPassword(newPassword.trim());

    if (account) {
      account.passwordHash = newHash;
      account.lastLoginAt = Date.now();
    }

    if (isAdminEmail) {
      this.adminCredentials.passwordHash = newHash;
      this.adminCredentials.updatedAt = Date.now();
    }

    this.scheduleSave();

    let user: PlatformUser | undefined;
    if (account) {
      user = this.users.get(account.id);
    } else if (isAdminEmail) {
      user = this.users.get('admin');
    }

    return {
      success: true,
      user,
      message: 'รีเซ็ตรหัสผ่านใหม่เรียบร้อยแล้ว',
    };
  }

  // --- General User Tracking ---

  public recordUser(user: UserProfile, currentRoomId?: string): PlatformUser {
    const existing = this.users.get(user.id);
    const now = Date.now();

    if (existing) {
      existing.name = user.name || existing.name;
      existing.avatar = user.avatar || existing.avatar;
      existing.color = user.color || existing.color;
      if (user.email) existing.email = user.email;
      if (user.provider) existing.provider = user.provider;
      existing.lastActiveAt = now;
      if (currentRoomId) existing.currentRoomId = currentRoomId;
      this.scheduleSave();
      return existing;
    }

    const newUser: PlatformUser = {
      id: user.id,
      name: user.name || 'Anonymous',
      email: user.email,
      avatar: user.avatar || '',
      color: user.color || '#8b5cf6',
      provider: user.provider || 'guest',
      isSuperAdmin: user.id === 'admin',
      isSuspended: false,
      createdAt: now,
      lastActiveAt: now,
      currentRoomId,
    };

    this.users.set(user.id, newUser);
    this.scheduleSave();
    return newUser;
  }

  public isSuspended(userId: string): boolean {
    const user = this.users.get(userId);
    return !!user?.isSuspended;
  }

  public isSuperAdmin(userId: string): boolean {
    const user = this.users.get(userId);
    return !!user?.isSuperAdmin;
  }

  public suspendUser(userId: string, isSuspended: boolean): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    if (user.id === 'admin') return false;

    user.isSuspended = isSuspended;
    this.scheduleSave();
    return true;
  }

  public setSuperAdmin(userId: string, isSuperAdmin: boolean): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.isSuperAdmin = isSuperAdmin;
    this.scheduleSave();
    return true;
  }

  public getAllUsers(): PlatformUser[] {
    return Array.from(this.users.values()).sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  }

  public createMemberAdmin(
    email: string,
    name: string,
    pass: string,
    isSuperAdmin: boolean = false
  ): { success: boolean; user?: PlatformUser; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'กรุณากรอกอีเมลให้ถูกต้อง' };
    }
    if (!name.trim()) {
      return { success: false, message: 'กรุณากรอกชื่อสมาชิก' };
    }
    if (this.userAccounts.has(cleanEmail)) {
      return { success: false, message: 'อีเมลนี้มีอยู่ในระบบแล้ว' };
    }
    if (pass.trim().length < 6) {
      return { success: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
    }

    const userId = 'usr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const now = Date.now();
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;
    const colors = ['#0075de', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const passwordHash = emailService.hashPassword(pass.trim());

    const account: StoredUserAccount = {
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
      avatar,
      color: randomColor,
      createdAt: now,
      lastLoginAt: now,
    };

    const platformUser: PlatformUser = {
      id: userId,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      color: account.color,
      provider: 'email',
      isSuperAdmin: !!isSuperAdmin,
      isSuspended: false,
      createdAt: now,
      lastActiveAt: now,
    };

    this.userAccounts.set(cleanEmail, account);
    this.users.set(userId, platformUser);
    this.scheduleSave();

    return { success: true, user: platformUser, message: 'เพิ่มสมาชิกใหม่สำเร็จ' };
  }

  public updateMemberAdmin(
    userId: string,
    data: {
      name?: string;
      email?: string;
      newPassword?: string;
      isSuperAdmin?: boolean;
      isSuspended?: boolean;
    }
  ): { success: boolean; user?: PlatformUser; message?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: 'ไม่พบผู้ใช้ในระบบ' };
    }

    // Protect main admin account from being suspended or stripped of admin
    if (user.id === 'admin') {
      if (data.isSuspended) {
        return { success: false, message: 'ไม่สามารถระงับบัญชีผู้ดูแลระบบหลักได้' };
      }
      if (data.isSuperAdmin === false) {
        return { success: false, message: 'ไม่สามารถปลดสิทธิ์ผู้ดูแลระบบหลักได้' };
      }
    }

    let account: StoredUserAccount | undefined;
    if (user.email) {
      account = this.userAccounts.get(user.email.toLowerCase());
    }

    // Check if email is changing
    if (data.email && data.email.trim().toLowerCase() !== user.email?.toLowerCase()) {
      const newEmailClean = data.email.trim().toLowerCase();
      if (!newEmailClean.includes('@')) {
        return { success: false, message: 'กรุณากรอกอีเมลให้ถูกต้อง' };
      }
      if (this.userAccounts.has(newEmailClean)) {
        return { success: false, message: 'อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว' };
      }
      if (account) {
        this.userAccounts.delete(account.email.toLowerCase());
        account.email = newEmailClean;
        this.userAccounts.set(newEmailClean, account);
      }
      user.email = newEmailClean;
    }

    if (data.name && data.name.trim()) {
      user.name = data.name.trim();
      if (account) account.name = data.name.trim();
    }

    if (data.newPassword && data.newPassword.trim()) {
      if (data.newPassword.trim().length < 6) {
        return { success: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
      }
      const newHash = emailService.hashPassword(data.newPassword.trim());
      if (account) {
        account.passwordHash = newHash;
      }
      if (user.id === 'admin') {
        this.adminCredentials.passwordHash = newHash;
      }
    }

    if (data.isSuperAdmin !== undefined && user.id !== 'admin') {
      user.isSuperAdmin = !!data.isSuperAdmin;
    }

    if (data.isSuspended !== undefined && user.id !== 'admin') {
      user.isSuspended = !!data.isSuspended;
    }

    this.scheduleSave();
    return { success: true, user, message: 'แก้ไขข้อมูลสมาชิกสำเร็จ' };
  }

  public deleteMemberAdmin(userId: string): { success: boolean; message?: string } {
    if (userId === 'admin') {
      return { success: false, message: 'ไม่สามารถลบบัญชีผู้ดูแลระบบสูงสุด (Super Admin) ได้' };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: 'ไม่พบผู้ใช้ในระบบ' };
    }

    if (user.email) {
      this.userAccounts.delete(user.email.toLowerCase());
    }
    this.users.delete(userId);
    this.scheduleSave();

    return { success: true, message: `ลบสมาชิก "${user.name}" ออกจากระบบเรียบร้อยแล้ว` };
  }

  public createTicket(
    userId: string,
    userName: string,
    userAvatar: string,
    category: TicketCategory,
    title: string,
    description: string,
    userEmail?: string
  ): SupportTicket {
    const id = 'ticket-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4);
    const now = Date.now();

    const newTicket: SupportTicket = {
      id,
      userId,
      userName,
      userEmail,
      userAvatar,
      category,
      title,
      description,
      status: 'pending',
      messages: [
        {
          id: 'msg-' + now,
          senderId: userId,
          senderName: userName,
          senderAvatar: userAvatar,
          isSuperAdmin: false,
          text: description,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.tickets.set(id, newTicket);
    this.scheduleSave();
    return newTicket;
  }

  public replyTicket(
    ticketId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    isSuperAdmin: boolean,
    text: string
  ): SupportTicket | null {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    const now = Date.now();
    const newMsg: TicketMessage = {
      id: 'msg-' + now + '-' + Math.random().toString(36).substr(2, 3),
      senderId,
      senderName,
      senderAvatar,
      isSuperAdmin,
      text: text.trim(),
      timestamp: now,
    };

    ticket.messages.push(newMsg);
    ticket.updatedAt = now;

    if (isSuperAdmin && ticket.status === 'pending') {
      ticket.status = 'in_progress';
    }

    this.scheduleSave();
    return ticket;
  }

  public updateTicketStatus(ticketId: string, status: TicketStatus): SupportTicket | null {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    ticket.status = status;
    ticket.updatedAt = Date.now();
    this.scheduleSave();
    return ticket;
  }

  public getAllTickets(): SupportTicket[] {
    return Array.from(this.tickets.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getUserTickets(userId: string): SupportTicket[] {
    return Array.from(this.tickets.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getTicketById(ticketId: string): SupportTicket | null {
    return this.tickets.get(ticketId) || null;
  }

  public getConfig(): PlatformConfig {
    return { ...this.config };
  }

  public updateConfig(patch: Partial<PlatformConfig>): PlatformConfig {
    this.config = {
      ...this.config,
      ...patch,
      adPopup: patch.adPopup !== undefined
        ? patch.adPopup
        : this.config.adPopup,
      globalWidgets: {
        ...this.config.globalWidgets,
        ...(patch.globalWidgets || {}),
      },
      announcementBanner: patch.announcementBanner !== undefined
        ? patch.announcementBanner
        : this.config.announcementBanner,
    };
    this.scheduleSave();
    return this.getConfig();
  }

  public recordTrackPlay(track: { videoId: string; title: string; channel?: string; thumbnail?: string }): void {
    if (!track.videoId) return;
    const existing = this.topTracks.get(track.videoId);
    const now = Date.now();
    if (existing) {
      existing.playCount += 1;
      existing.lastPlayedAt = now;
      if (track.title) existing.title = track.title;
      if (track.channel) existing.channel = track.channel;
      if (track.thumbnail) existing.thumbnail = track.thumbnail;
    } else {
      this.topTracks.set(track.videoId, {
        videoId: track.videoId,
        title: track.title || 'Untitled Video',
        channel: track.channel || '',
        thumbnail: track.thumbnail || `https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`,
        playCount: 1,
        lastPlayedAt: now,
      });
    }
    this.scheduleSave();
  }

  public getAnalytics(roomManager: RoomManager): PlatformAnalytics {
    let totalOnline = 0;
    const summaries = roomManager.getAllRoomSummaries();
    summaries.forEach((s) => {
      totalOnline += s.onlineCount;
    });

    const usersByProvider = {
      google: 0,
      facebook: 0,
      guest: 0,
      email: 0,
    };

    for (const u of this.users.values()) {
      if (u.provider === 'google') usersByProvider.google++;
      else if (u.provider === 'facebook') usersByProvider.facebook++;
      else if (u.provider === 'email') usersByProvider.email++;
      else usersByProvider.guest++;
    }

    const topTracks = Array.from(this.topTracks.values())
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);

    const memUsage = process.memoryUsage ? Math.round(process.memoryUsage().rss / 1024 / 1024) : 0;
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      onlineVisitors: totalOnline,
      totalUsers: this.users.size,
      usersByProvider,
      activeRooms: summaries.length,
      topTracks,
      serverUptimeSeconds: uptimeSeconds,
      memoryUsageMb: memUsage,
    };
  }

  public getStats(roomManager: RoomManager): PlatformStats {
    let totalOnline = 0;
    const summaries = roomManager.getAllRoomSummaries();
    summaries.forEach((s) => {
      totalOnline += s.onlineCount;
    });

    const openTickets = Array.from(this.tickets.values()).filter(
      (t) => t.status === 'pending' || t.status === 'in_progress'
    ).length;

    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      totalOnlineUsers: totalOnline,
      totalRooms: summaries.length,
      totalUsers: this.users.size,
      openTickets,
      serverUptimeSeconds: uptimeSeconds,
    };
  }
}

export const platformManager = new PlatformManager();
