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
} from '../src/types/index.js';
import type { RoomManager } from './roomManager.js';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const STORE_FILE = path.join(DATA_DIR, 'platform_store.json');
export const MASTER_PASSCODE = process.env.ADMIN_MASTER_KEY || 'admin888';

interface StoreSchema {
  users: PlatformUser[];
  tickets: SupportTicket[];
  config?: PlatformConfig;
  topTracks?: TrackPlayStat[];
}

export class PlatformManager {
  private users: Map<string, PlatformUser> = new Map();
  private tickets: Map<string, SupportTicket> = new Map();
  private config: PlatformConfig = { ...DEFAULT_PLATFORM_CONFIG };
  private topTracks: Map<string, TrackPlayStat> = new Map();
  private startTime: number = Date.now();
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDataDir();
    this.loadStore();
    this.seedDefaults();
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
        if (Array.isArray(data.users)) {
          data.users.forEach((u) => this.users.set(u.id, u));
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
          tickets: Array.from(this.tickets.values()),
          config: this.config,
          topTracks: Array.from(this.topTracks.values()),
        };
        fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to save platform_store.json:', err);
      }
    }, 500);
  }

  private seedDefaults() {
    // Ensure System Admin exists and is Super Admin
    if (!this.users.has('usr-admin-system')) {
      this.users.set('usr-admin-system', {
        id: 'usr-admin-system',
        name: 'System Admin 👑',
        email: 'admin@watchparty.live',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
        color: '#8b5cf6',
        provider: 'google',
        isSuperAdmin: true,
        isSuspended: false,
        createdAt: Date.now() - 86400000 * 7,
        lastActiveAt: Date.now(),
      });
    }

    // Ensure at least one welcome ticket for showcase
    if (this.tickets.size === 0) {
      const sampleTicket: SupportTicket = {
        id: 'ticket-welcome',
        userId: 'usr-admin-system',
        userName: 'System Admin',
        userEmail: 'admin@watchparty.live',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
        category: 'general',
        title: 'ยินดีต้อนรับสู่ระบบ Support & Feedback 🎉',
        description: 'ศูนย์ติดต่อเจ้าของเว็บ ยินดีรับฟังทุกปัญหาและข้อเสนอแนะเพื่อพัฒนาแพลตฟอร์มให้ดียิ่งขึ้นครับ',
        status: 'resolved',
        messages: [
          {
            id: 'msg-init',
            senderId: 'usr-admin-system',
            senderName: 'System Admin 👑',
            senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
            isSuperAdmin: true,
            text: 'ยินดีต้อนรับสู่ระบบแจ้งปัญหา! ผู้ใช้สามารถส่งข้อความมาหาเจ้าของเว็บได้ตลอด 24 ชั่วโมงครับ',
            timestamp: Date.now() - 3600000,
          },
        ],
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000,
      };
      this.tickets.set(sampleTicket.id, sampleTicket);
    }

    this.scheduleSave();
  }

  public verifyMasterPasscode(code: string): boolean {
    return String(code).trim() === MASTER_PASSCODE;
  }

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
      isSuperAdmin: user.id === 'usr-admin-system',
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
    // Cannot suspend system admin
    if (user.id === 'usr-admin-system') return false;

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

    // If admin replies, update status to in_progress if it was pending
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
    };

    for (const u of this.users.values()) {
      if (u.provider === 'google') usersByProvider.google++;
      else if (u.provider === 'facebook') usersByProvider.facebook++;
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
