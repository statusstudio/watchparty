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
  FavoriteSong,
  UserSocialLinks,
} from '../src/types/index.js';
import type { RoomManager } from './roomManager.js';
import { emailService } from './emailService.js';
import { serverSupabaseService } from './supabaseService.js';

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
  username?: string;
  passwordHash: string;
  avatar: string;
  bannerUrl?: string;
  color: string;
  bio?: string;
  favoriteGenres?: string[];
  socialLinks?: UserSocialLinks;
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
    this.initSupabaseSync();
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

  private hydrateFromStore(data: StoreSchema) {
    if (!data) return;

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
            username: 'admin',
            email: this.adminCredentials.email,
            avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
            bannerUrl: u.bannerUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
            bio: u.bio || 'ผู้ดูแลระบบสูงสุด pleng.online 👑 ยินดีต้อนรับทุกคนสู่คอมมูนิตี้คนรักเสียงเพลงครับ',
            favoriteGenres: u.favoriteGenres || ['Lofi', 'Pop', 'Acoustic'],
            isSuperAdmin: true,
          });
        } else {
          if (!u.username) {
            u.username = u.email ? u.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : u.id;
          }
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
  }

  private loadStore() {
    if (fs.existsSync(STORE_FILE)) {
      try {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const data: StoreSchema = JSON.parse(raw);
        this.hydrateFromStore(data);
      } catch (err) {
        console.error('Failed to parse platform_store.json:', err);
      }
    }
  }

  /**
   * Hydrate initial data from Supabase Cloud if available
   */
  private async initSupabaseSync() {
    if (!serverSupabaseService.isConfigured()) return;
    try {
      const cloudData = await serverSupabaseService.loadData<StoreSchema>('platform_store');
      if (cloudData && (cloudData.userAccounts?.length || cloudData.users?.length)) {
        this.hydrateFromStore(cloudData);
        this.seedDefaults();
        console.log(`✅ PlatformManager: Synced ${this.userAccounts.size} user accounts from Supabase Cloud!`);
      } else {
        // Seed initial data to Supabase if empty on cloud
        await this.syncToSupabase();
      }
    } catch (err) {
      console.error('❌ PlatformManager: Error during initial Supabase sync:', err);
    }
  }

  /**
   * Sync current platform state to Supabase Cloud
   */
  public async syncToSupabase(customData?: StoreSchema): Promise<boolean> {
    if (!serverSupabaseService.isConfigured()) return false;
    try {
      const data: StoreSchema = customData || {
        users: Array.from(this.users.values()),
        userAccounts: Array.from(this.userAccounts.values()),
        adminCredentials: this.adminCredentials,
        tickets: Array.from(this.tickets.values()),
        config: this.config,
        topTracks: Array.from(this.topTracks.values()),
        smtpConfig: this.smtpConfig,
      };
      return await serverSupabaseService.saveData('platform_store', data);
    } catch (err) {
      console.error('PlatformManager: syncToSupabase error:', err);
      return false;
    }
  }

  public async getSupabaseStatus() {
    return await serverSupabaseService.checkStatus();
  }

  public async flushSave(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
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
      if (serverSupabaseService.isConfigured()) {
        await this.syncToSupabase(data);
      }
    } catch (err) {
      console.error('Failed to flushSave in PlatformManager:', err);
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
        // Asynchronously persist to Supabase Cloud
        this.syncToSupabase(data).catch((e) => {
          console.error('Failed to sync to Supabase in scheduleSave:', e);
        });
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
        username: 'admin',
        email: this.adminCredentials.email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        color: '#dd5b00',
        provider: 'email',
        bio: 'ผู้ดูแลระบบสูงสุด pleng.online 👑 ยินดีต้อนรับทุกคนสู่คอมมูนิตี้คนรักเสียงเพลงครับ',
        favoriteGenres: ['Lofi', 'Pop', 'Acoustic'],
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
    const isRootUsernameMatch = identifier === this.adminCredentials.username.toLowerCase();
    const isRootEmailMatch = identifier === this.adminCredentials.email.toLowerCase();

    // 1. Check Root Super Admin credentials
    if (isRootUsernameMatch || isRootEmailMatch) {
      const hashed = emailService.hashPassword(pass);
      if (hashed === this.adminCredentials.passwordHash || pass.trim() === MASTER_PASSCODE) {
        // Refresh root admin in users map
        const adminUser: PlatformUser = {
          id: 'admin',
          name: `${this.adminCredentials.username} 👑`,
          username: 'admin',
          email: this.adminCredentials.email,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
          color: '#dd5b00',
          provider: 'email',
          bio: 'ผู้ดูแลระบบสูงสุด pleng.online 👑 ยินดีต้อนรับทุกคนสู่คอมมูนิตี้คนรักเสียงเพลงครับ',
          favoriteGenres: ['Lofi', 'Pop', 'Acoustic'],
          isSuperAdmin: true,
          isSuspended: false,
          createdAt: this.adminCredentials.updatedAt || Date.now(),
          lastActiveAt: Date.now(),
        };
        this.users.set('admin', adminUser);
        this.scheduleSave();

        return { success: true, user: adminUser };
      }
      return { success: false, message: 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' };
    }

    // 2. Check Member Accounts with Super Admin role
    let account = this.userAccounts.get(identifier);
    if (!account) {
      account = Array.from(this.userAccounts.values()).find(
        (a) => a.username?.toLowerCase() === identifier || a.email.toLowerCase() === identifier
      );
    }

    if (account) {
      const user = this.users.get(account.id);
      if (!user || !user.isSuperAdmin) {
        return { success: false, message: 'บัญชีนี้ยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ (Super Admin)' };
      }

      const hashed = emailService.hashPassword(pass);
      if (account.passwordHash !== hashed && pass.trim() !== MASTER_PASSCODE) {
        return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
      }

      if (user.isSuspended) {
        return { success: false, message: 'บัญชีของคุณถูกระงับการใช้งานชั่วคราว' };
      }

      const now = Date.now();
      account.lastLoginAt = now;
      user.lastActiveAt = now;
      this.scheduleSave();

      return { success: true, user };
    }

    // 3. Fallback: check this.users map by email or username
    const user = Array.from(this.users.values()).find(
      (u) => u.email?.toLowerCase() === identifier || u.username?.toLowerCase() === identifier
    );
    if (user) {
      if (!user.isSuperAdmin) {
        return { success: false, message: 'บัญชีนี้ยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ (Super Admin)' };
      }

      const userAcc = user.email ? this.userAccounts.get(user.email.toLowerCase()) : undefined;
      const hashed = emailService.hashPassword(pass);
      if (userAcc && userAcc.passwordHash !== hashed && pass.trim() !== MASTER_PASSCODE) {
        return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
      }

      if (user.isSuspended) {
        return { success: false, message: 'บัญชีของคุณถูกระงับการใช้งานชั่วคราว' };
      }

      const now = Date.now();
      if (userAcc) userAcc.lastLoginAt = now;
      user.lastActiveAt = now;
      this.scheduleSave();

      return { success: true, user };
    }

    return { success: false, message: 'ไม่พบบัญชีผู้ดูแลระบบนี้ในระบบ กรุณาตรวจสอบชื่อผู้ใช้หรืออีเมล' };
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

    let baseUsername = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!baseUsername || baseUsername.length < 3) {
      baseUsername = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    if (!baseUsername || baseUsername.length < 3) {
      baseUsername = 'user';
    }
    let finalUsername = baseUsername;
    let counter = 1;
    while (this.isUsernameTaken(finalUsername, userId)) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }

    const account: StoredUserAccount = {
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      username: finalUsername,
      passwordHash,
      avatar,
      color: randomColor,
      createdAt: now,
      lastLoginAt: now,
    };

    const platformUser: PlatformUser = {
      id: userId,
      name: account.name,
      username: finalUsername,
      email: account.email,
      avatar: account.avatar,
      bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      color: account.color,
      provider: 'email',
      isSuperAdmin: false,
      isSuspended: false,
      bio: '',
      favoriteGenres: ['Lofi', 'Pop'],
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

    let baseUsername = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!baseUsername || baseUsername.length < 3) {
      baseUsername = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    if (!baseUsername || baseUsername.length < 3) {
      baseUsername = 'user';
    }
    let finalUsername = baseUsername;
    let counter = 1;
    while (this.isUsernameTaken(finalUsername, userId)) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }

    const account: StoredUserAccount = {
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      username: finalUsername,
      passwordHash,
      avatar,
      color: randomColor,
      createdAt: now,
      lastLoginAt: now,
    };

    const platformUser: PlatformUser = {
      id: userId,
      name: account.name,
      username: finalUsername,
      email: account.email,
      avatar: account.avatar,
      bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      color: account.color,
      provider: 'email',
      isSuperAdmin: !!isSuperAdmin,
      isSuspended: false,
      bio: '',
      favoriteGenres: ['Lofi', 'Pop'],
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

  // --- Public Profile & Handle Management (@username) ---

  public isUsernameTaken(username: string, excludeUserId?: string): boolean {
    const clean = username.trim().toLowerCase();
    if (!clean) return true;
    if (clean === 'admin' && excludeUserId !== 'admin') return true;

    for (const u of this.users.values()) {
      if (excludeUserId && u.id === excludeUserId) continue;
      if (u.username?.toLowerCase() === clean) return true;
    }
    for (const acc of this.userAccounts.values()) {
      if (excludeUserId && acc.id === excludeUserId) continue;
      if (acc.username?.toLowerCase() === clean) return true;
    }
    return false;
  }

  public getUserByHandle(handle: string): PlatformUser | undefined {
    const clean = handle.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return undefined;

    // 1. Admin check
    if (clean === 'admin' || clean === this.adminCredentials.username.toLowerCase()) {
      return (
        this.users.get('admin') || {
          id: 'admin',
          name: this.adminCredentials.username,
          username: 'admin',
          email: this.adminCredentials.email,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
          color: '#dd5b00',
          provider: 'email',
          isSuperAdmin: true,
          isSuspended: false,
          bio: 'ผู้ดูแลระบบสูงสุด pleng.online 👑 ยินดีต้อนรับทุกคนสู่คอมมูนิตี้คนรักเสียงเพลงครับ',
          favoriteGenres: ['Lofi', 'Pop', 'Acoustic'],
          createdAt: this.adminCredentials.updatedAt || Date.now(),
          lastActiveAt: Date.now(),
        }
      );
    }

    // 2. Match by username
    for (const u of this.users.values()) {
      if (u.username?.toLowerCase() === clean) {
        return u;
      }
    }

    // 3. Match by ID
    const byId = this.users.get(clean);
    if (byId) return byId;

    // 4. Match by name
    for (const u of this.users.values()) {
      if (u.name.toLowerCase() === clean || u.name.toLowerCase().replace(/\s+/g, '_') === clean) {
        return u;
      }
    }

    // 5. Match by account username / id
    for (const acc of this.userAccounts.values()) {
      if (acc.username?.toLowerCase() === clean || acc.id === clean || acc.name.toLowerCase() === clean) {
        const u = this.users.get(acc.id);
        if (u) return u;
      }
    }

    return undefined;
  }

  public updateUserProfile(
    userId: string,
    data: Partial<UserProfile>
  ): { success: boolean; user?: PlatformUser; message?: string } {
    let user = this.users.get(userId);

    // If admin
    if (userId === 'admin') {
      if (!user) {
        user = this.adminLogin('admin', MASTER_PASSCODE).user;
      }
    }

    if (!user) {
      return { success: false, message: 'ไม่พบผู้ใช้ในระบบ' };
    }

    // If username is changing
    if (data.username !== undefined) {
      const cleanUsername = data.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3 || cleanUsername.length > 25) {
        return {
          success: false,
          message: 'ชื่อผู้ใช้ (Handle) ต้องมีความยาวระหว่าง 3-25 ตัวอักษร และใช้เฉพาะตัวอักษร a-z, 0-9 และ _ เท่านั้น',
        };
      }
      if (this.isUsernameTaken(cleanUsername, userId)) {
        return { success: false, message: `ชื่อผู้ใช้ @${cleanUsername} มีผู้ใช้งานแล้ว กรุณาเลือกชื่ออื่น` };
      }
      user.username = cleanUsername;
    }

    if (data.name && data.name.trim()) {
      user.name = data.name.trim();
    }
    if (data.avatar) user.avatar = data.avatar;
    if (data.bannerUrl !== undefined) user.bannerUrl = data.bannerUrl;
    if (data.color) user.color = data.color;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.favoriteGenres) user.favoriteGenres = data.favoriteGenres;
    if (data.socialLinks) user.socialLinks = data.socialLinks;
    if (data.favoriteSongs) user.favoriteSongs = data.favoriteSongs;

    // Sync to StoredUserAccount if present
    if (user.email) {
      const acc = this.userAccounts.get(user.email.toLowerCase());
      if (acc) {
        acc.name = user.name;
        if (user.username) acc.username = user.username;
        if (user.avatar) acc.avatar = user.avatar;
        if (user.bannerUrl) acc.bannerUrl = user.bannerUrl;
        if (user.color) acc.color = user.color;
        if (user.bio) acc.bio = user.bio;
        if (user.favoriteGenres) acc.favoriteGenres = user.favoriteGenres;
        if (user.socialLinks) acc.socialLinks = user.socialLinks;
      }
    }

    user.lastActiveAt = Date.now();
    this.scheduleSave();

    return { success: true, user, message: 'อัพเดตโปรไฟล์เรียบร้อยแล้ว' };
  }

  public getUserFavorites(userId: string): FavoriteSong[] {
    const user = this.users.get(userId);
    return user?.favoriteSongs || [];
  }

  public addUserFavorite(userId: string, song: FavoriteSong): FavoriteSong[] {
    const user = this.users.get(userId);
    if (!user) return [];
    if (!user.favoriteSongs) user.favoriteSongs = [];
    if (!user.favoriteSongs.some((s) => s.videoId === song.videoId)) {
      user.favoriteSongs.unshift(song);
      this.scheduleSave();
    }
    return user.favoriteSongs;
  }

  public removeUserFavorite(userId: string, videoId: string): FavoriteSong[] {
    const user = this.users.get(userId);
    if (!user || !user.favoriteSongs) return [];
    user.favoriteSongs = user.favoriteSongs.filter((s) => s.videoId !== videoId);
    this.scheduleSave();
    return user.favoriteSongs;
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
