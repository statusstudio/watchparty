import { WebSocket } from 'ws';
import { platformManager } from './platformManager.js';
import {
  RoomState,
  StageSeat,
  VideoState,
  PlaylistItem,
  ChatMessage,
  UserProfile,
  LoopMode,
  RoomMember,
  BannedUser,
  RoomMetadata,
  RoomSummary,
  UserRole,
  RoomCategory,
  StageAccessMode,
  StageRequest,
  RoomWidgetsConfig,
  DEFAULT_ROOM_WIDGETS,
} from '../src/types/index.js';

interface ClientConnection {
  ws: WebSocket;
  user: UserProfile;
  roomId: string;
}

interface InternalRoomData {
  metadata: RoomMetadata;
  seats: StageSeat[];
  video: VideoState;
  playlist: PlaylistItem[];
  loopMode: LoopMode;
  isShuffle: boolean;
  lastVideoEndedTime: number;
  stageAccessMode: StageAccessMode;
  approvedSpeakerIds: Set<string>;
  pendingStageRequests: Map<string, StageRequest>;
  chat: ChatMessage[];
  adminIds: Set<string>;
  bannedUsers: Map<string, BannedUser>;
}

export class RoomManager {
  private rooms: Map<string, InternalRoomData> = new Map();
  private clients: Map<WebSocket, ClientConnection> = new Map();
  public pendingUsers: Map<WebSocket, UserProfile> = new Map();

  constructor() {
    // Rooms are created dynamically on demand when users create them
  }

  private createDefaultSeats(): StageSeat[] {
    return Array.from({ length: 9 }, (_, i) => ({
      seatNumber: i + 1,
      user: null,
      isMuted: false,
      isSpeaking: false,
    }));
  }

  public createRoom(
    roomId: string,
    settings: {
      name: string;
      description?: string;
      isPrivate?: boolean;
      password?: string;
      category?: RoomCategory;
      coverImage?: string;
      onlyAdminManagePlaylist?: boolean;
      stageAccessMode?: StageAccessMode;
      initialVideoId?: string;
      initialVideoTitle?: string;
      initialVideoChannel?: string;
      widgets?: RoomWidgetsConfig;
    },
    creator: UserProfile
  ): InternalRoomData {
    const rawVideoId = settings.initialVideoId?.trim();
    const hasInitialVideo = !!rawVideoId;
    const stageAccessMode = settings.stageAccessMode || 'everyone';

    const newRoom: InternalRoomData = {
      metadata: {
        id: roomId,
        name: settings.name || `ห้องปาร์ตี้ #${roomId}`,
        description: settings.description || '',
        ownerId: creator.id,
        ownerName: creator.name,
        isPrivate: !!settings.isPrivate,
        hasPassword: !!(settings.isPrivate && settings.password),
        password: settings.password,
        category: settings.category || 'general',
        coverImage: settings.coverImage || undefined,
        onlyAdminManagePlaylist: !!settings.onlyAdminManagePlaylist,
        stageAccessMode,
        widgets: settings.widgets || { ...DEFAULT_ROOM_WIDGETS },
        createdAt: Date.now(),
      },
      seats: this.createDefaultSeats(),
      video: hasInitialVideo
        ? {
            videoId: rawVideoId,
            title: settings.initialVideoTitle || 'YouTube Video',
            channel: settings.initialVideoChannel || '',
            duration: 0,
            currentTime: 0,
            isPlaying: true,
            lastUpdated: Date.now(),
          }
        : {
            videoId: '',
            title: '',
            channel: '',
            duration: 0,
            currentTime: 0,
            isPlaying: false,
            lastUpdated: Date.now(),
          },
      playlist: hasInitialVideo
        ? [
            {
              id: 'init-' + Date.now(),
              videoId: rawVideoId,
              title: settings.initialVideoTitle || 'YouTube Video',
              channel: settings.initialVideoChannel || '',
              thumbnail: `https://i.ytimg.com/vi/${rawVideoId}/hqdefault.jpg`,
              duration: 'YouTube',
              addedBy: creator.name,
            },
          ]
        : [],
      loopMode: 'all',
      isShuffle: false,
      lastVideoEndedTime: 0,
      stageAccessMode,
      approvedSpeakerIds: new Set<string>([creator.id]),
      pendingStageRequests: new Map<string, StageRequest>(),
      chat: [
        {
          id: 'msg-welcome',
          sender: {
            id: 'system',
            name: 'WatchParty Bot 🤖',
            avatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238b5cf6"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>',
            color: '#8b5cf6',
          },
          text: `ยินดีต้อนรับสู่ห้อง "${settings.name}"! เจ้าของห้องคือคุณ ${creator.name} 🎉`,
          timestamp: Date.now(),
        },
      ],
      adminIds: new Set<string>(),
      bannedUsers: new Map<string, BannedUser>(),
    };

    this.rooms.set(roomId, newRoom);
    return newRoom;
  }

  private getOrCreateRoom(roomId: string, user?: UserProfile): InternalRoomData {
    if (!this.rooms.has(roomId)) {
      const creator = user || {
        id: 'usr-guest-owner',
        name: 'Room Host',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + roomId,
        color: '#8b5cf6',
      };
      this.createRoom(roomId, { name: `ห้องปาร์ตี้ ${roomId}` }, creator);
    }
    return this.rooms.get(roomId)!;
  }

  public getAllRoomSummaries(): RoomSummary[] {
    const list: RoomSummary[] = [];
    for (const [id, room] of this.rooms.entries()) {
      const onlineCount = this.getRoomClients(id).length;
      list.push({
        id,
        name: room.metadata.name,
        description: room.metadata.description,
        ownerId: room.metadata.ownerId,
        ownerName: room.metadata.ownerName,
        isPrivate: room.metadata.isPrivate,
        stageAccessMode: room.metadata.stageAccessMode || 'everyone',
        category: room.metadata.category || 'general',
        coverImage: room.metadata.coverImage,
        widgets: room.metadata.widgets || { ...DEFAULT_ROOM_WIDGETS },
        onlineCount,
        currentVideo: {
          videoId: room.video.videoId,
          title: room.video.title,
          thumbnail: `https://i.ytimg.com/vi/${room.video.videoId}/hqdefault.jpg`,
        },
        createdAt: room.metadata.createdAt,
      });
    }

    // Sort by online count desc then createdAt desc
    return list.sort((a, b) => b.onlineCount - a.onlineCount || b.createdAt - a.createdAt);
  }

  public broadcastToAll(message: any) {
    const raw = JSON.stringify(message);
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(raw);
        } catch (e) {
          console.error('Failed to send broadcastToAll to client:', e);
        }
      }
    }
  }

  public getAllRoomsAdmin(): any[] {
    const list: any[] = [];
    for (const [id, room] of this.rooms.entries()) {
      const clients = this.getRoomClients(id);
      list.push({
        id,
        name: room.metadata.name,
        description: room.metadata.description,
        ownerId: room.metadata.ownerId,
        ownerName: room.metadata.ownerName,
        isPrivate: room.metadata.isPrivate,
        password: room.metadata.password,
        hasPassword: room.metadata.hasPassword,
        category: room.metadata.category || 'general',
        coverImage: room.metadata.coverImage,
        widgets: room.metadata.widgets || { ...DEFAULT_ROOM_WIDGETS },
        onlineCount: clients.length,
        members: clients.map((c) => c.user.name),
        currentVideo: room.video,
        createdAt: room.metadata.createdAt,
      });
    }
    return list.sort((a, b) => b.onlineCount - a.onlineCount || b.createdAt - a.createdAt);
  }

  public forceDeleteRoom(roomId: string, reason?: string): boolean {
    if (!this.rooms.has(roomId)) return false;

    this.broadcastToRoom(roomId, {
      type: 'ROOM_FORCE_CLOSED',
      roomId,
      reason: reason || 'ห้องนี้ถูกปิดโดยเจ้าของเว็บ (Super Admin)',
    });

    for (const client of this.clients.values()) {
      if (client.roomId === roomId) {
        this.clients.delete(client.ws);
      }
    }

    this.rooms.delete(roomId);
    return true;
  }

  public getRoomState(roomId: string, requestingUserId?: string): RoomState {
    const room = this.getOrCreateRoom(roomId);
    const now = Date.now();
    let currentExtrapolatedTime = room.video.currentTime;
    if (room.video.isPlaying) {
      const elapsed = (now - room.video.lastUpdated) / 1000;
      if (room.video.duration > 0) {
        currentExtrapolatedTime = Math.min(room.video.duration, room.video.currentTime + elapsed);
      } else {
        currentExtrapolatedTime = room.video.currentTime + elapsed;
      }
    }

    const clients = this.getRoomClients(roomId);
    const members: RoomMember[] = clients.map((c) => {
      let role: UserRole = 'member';
      if (c.user.id === room.metadata.ownerId) {
        role = 'owner';
      } else if (room.adminIds.has(c.user.id)) {
        role = 'admin';
      }
      return {
        user: c.user,
        role,
        joinedAt: Date.now(),
      };
    });

    let myRole: UserRole = 'member';
    if (requestingUserId) {
      if (requestingUserId === room.metadata.ownerId) {
        myRole = 'owner';
      } else if (room.adminIds.has(requestingUserId)) {
        myRole = 'admin';
      }
    }

    // Sanitized metadata (hide password for non-owners)
    const sanitizedMetadata: RoomMetadata = {
      ...room.metadata,
      password: requestingUserId === room.metadata.ownerId ? room.metadata.password : undefined,
    };

    return {
      roomId,
      metadata: sanitizedMetadata,
      seats: room.seats,
      video: {
        ...room.video,
        currentTime: currentExtrapolatedTime,
        lastUpdated: now,
      },
      playlist: room.playlist,
      loopMode: room.loopMode,
      isShuffle: room.isShuffle,
      stageAccessMode: room.stageAccessMode || 'everyone',
      approvedSpeakerIds: Array.from(room.approvedSpeakerIds || []),
      pendingStageRequests: Array.from(room.pendingStageRequests ? room.pendingStageRequests.values() : []),
      chat: room.chat,
      members,
      bannedUsers: Array.from(room.bannedUsers.values()),
      onlineCount: clients.length,
      myRole,
    };
  }

  public getRoomClients(roomId: string): ClientConnection[] {
    const list: ClientConnection[] = [];
    for (const client of this.clients.values()) {
      if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
        list.push(client);
      }
    }
    return list;
  }

  public broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
    const data = JSON.stringify(message);
    for (const client of this.clients.values()) {
      if (client.roomId === roomId && client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }

  public sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private handleLeaveOldRoom(ws: WebSocket, oldRoomId: string, user: UserProfile) {
    this.clients.delete(ws);
    const room = this.rooms.get(oldRoomId);
    if (room) {
      let seatChanged = false;
      room.seats = room.seats.map((s) => {
        if (s.user && s.user.id === user.id) {
          seatChanged = true;
          return { ...s, user: null, isSpeaking: false, isMuted: false };
        }
        return s;
      });

      const clients = this.getRoomClients(oldRoomId);
      const onlineCount = clients.length;

      if (seatChanged) {
        this.broadcastToRoom(oldRoomId, {
          type: 'SEATS_UPDATED',
          seats: room.seats,
        });
      }

      this.broadcastToRoom(oldRoomId, {
        type: 'USER_LEFT',
        userId: user.id,
        onlineCount,
      });

      const roomState = this.getRoomState(oldRoomId);
      this.broadcastToRoom(oldRoomId, {
        type: 'MEMBERS_UPDATED',
        members: roomState.members,
        onlineCount,
      });
    }
  }

  public handleJoin(ws: WebSocket, roomId: string, user: UserProfile, password?: string) {
    const room = this.getOrCreateRoom(roomId, user);

    // If client was previously connected in another room on same ws, clean up from old room
    const existingClient = this.clients.get(ws);
    if (existingClient && existingClient.roomId !== roomId) {
      this.handleLeaveOldRoom(ws, existingClient.roomId, existingClient.user);
    }

    // Check if globally suspended by Super Admin
    if (platformManager.isSuspended(user.id)) {
      this.sendToClient(ws, {
        type: 'YOU_WERE_SUSPENDED',
        reason: 'บัญชีของคุณถูกระงับการใช้งานทั่วทั้งระบบโดยผู้ดูแลระบบ (Super Admin)',
      });
      return;
    }

    // Record user activity in platform registry
    platformManager.recordUser(user, roomId);

    // Check if banned
    if (room.bannedUsers.has(user.id)) {
      this.sendToClient(ws, {
        type: 'YOU_WERE_BANNED',
        reason: 'คุณถูกแบนจากการเข้าใช้งานห้องปาร์ตี้นี้',
      });
      return;
    }

    // Check password if private and user is not the owner
    if (room.metadata.isPrivate && room.metadata.password && user.id !== room.metadata.ownerId) {
      const roomPass = String(room.metadata.password).trim();
      const userPass = password ? String(password).trim() : '';

      if (!userPass || userPass !== roomPass) {
        this.pendingUsers.set(ws, user);
        this.sendToClient(ws, {
          type: 'PASSWORD_REQUIRED',
          roomId,
          roomName: room.metadata.name,
        });
        return;
      }
    }

    // Password passed or public room
    this.pendingUsers.delete(ws);

    // Register client
    this.clients.set(ws, { ws, user, roomId });
    const roomState = this.getRoomState(roomId, user.id);

    // Send initial room state
    this.sendToClient(ws, {
      type: 'ROOM_INIT',
      state: roomState,
      myUserId: user.id,
    });

    // Instant sync verification for video and playlist
    if (roomState.video && roomState.video.videoId) {
      this.sendToClient(ws, {
        type: 'VIDEO_SYNC',
        video: roomState.video,
        actionType: 'sync',
      });
    }
    if (roomState.playlist && roomState.playlist.length > 0) {
      this.sendToClient(ws, {
        type: 'PLAYLIST_UPDATED',
        playlist: roomState.playlist,
        loopMode: roomState.loopMode,
        isShuffle: roomState.isShuffle,
      });
    }

    // Notify other peers in room
    this.broadcastToRoom(roomId, {
      type: 'USER_JOINED',
      user,
      onlineCount: roomState.onlineCount,
    }, ws);

    // Broadcast updated members list
    this.broadcastToRoom(roomId, {
      type: 'MEMBERS_UPDATED',
      members: roomState.members,
      onlineCount: roomState.onlineCount,
    });
  }

  public handleVerifyPassword(ws: WebSocket, roomId: string, user: UserProfile, password: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      this.sendToClient(ws, { type: 'PASSWORD_ERROR', message: 'ไม่พบห้องที่ระบุ' });
      return;
    }

    const roomPass = room.metadata.password ? String(room.metadata.password).trim() : '';
    const userPass = String(password || '').trim();

    if (!room.metadata.isPrivate || !roomPass || userPass === roomPass) {
      this.pendingUsers.delete(ws);
      this.handleJoin(ws, roomId, user, password);
    } else {
      this.sendToClient(ws, {
        type: 'PASSWORD_ERROR',
        message: 'รหัสผ่านห้องไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
      });
    }
  }

  public handleUpdateProfile(ws: WebSocket, updatedUser: UserProfile) {
    const client = this.clients.get(ws);
    if (!client) return;

    client.user = updatedUser;
    const room = this.getOrCreateRoom(client.roomId);

    let seatChanged = false;
    room.seats = room.seats.map((s) => {
      if (s.user && s.user.id === updatedUser.id) {
        seatChanged = true;
        return { ...s, user: updatedUser };
      }
      return s;
    });

    if (seatChanged) {
      this.broadcastToRoom(client.roomId, {
        type: 'SEATS_UPDATED',
        seats: room.seats,
      });
    }

    const roomState = this.getRoomState(client.roomId);
    this.broadcastToRoom(client.roomId, {
      type: 'MEMBERS_UPDATED',
      members: roomState.members,
      onlineCount: roomState.onlineCount,
    });
  }

  public handleUpdateRoomSettings(
    ws: WebSocket,
    settings: {
      name: string;
      description: string;
      isPrivate: boolean;
      password?: string;
      category?: RoomCategory;
      coverImage?: string;
      onlyAdminManagePlaylist: boolean;
      stageAccessMode?: StageAccessMode;
      widgets?: RoomWidgetsConfig;
    }
  ) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    // Only room owner or admin can update settings
    if (client.user.id !== room.metadata.ownerId && !room.adminIds.has(client.user.id)) {
      this.sendToClient(ws, {
        type: 'SYNC_TOAST',
        message: 'เฉพาะเจ้าของห้องหรือผู้ดูแลห้องเท่านั้นที่สามารถเปลี่ยนการตั้งค่าห้องได้',
        toastType: 'warning',
      });
      return;
    }

    room.metadata.name = settings.name;
    room.metadata.description = settings.description;
    room.metadata.isPrivate = settings.isPrivate;
    room.metadata.password = settings.isPrivate ? settings.password : undefined;
    room.metadata.hasPassword = !!(settings.isPrivate && settings.password);
    if (settings.category) room.metadata.category = settings.category;
    if (settings.coverImage !== undefined) room.metadata.coverImage = settings.coverImage;
    room.metadata.onlyAdminManagePlaylist = settings.onlyAdminManagePlaylist;
    if (settings.widgets) {
      room.metadata.widgets = {
        ...(room.metadata.widgets || { ...DEFAULT_ROOM_WIDGETS }),
        ...settings.widgets,
      };
      if (settings.widgets.enableVoiceStage === false) {
        room.seats = room.seats.map((s) => ({ ...s, user: null, isSpeaking: false, isMuted: false }));
        this.broadcastToRoom(client.roomId, {
          type: 'SEATS_UPDATED',
          seats: room.seats,
        });
      }
    }
    if (settings.stageAccessMode) {
      room.stageAccessMode = settings.stageAccessMode;
      room.metadata.stageAccessMode = settings.stageAccessMode;

      // If switched to admin_only, kick non-admins off the stage
      if (settings.stageAccessMode === 'admin_only') {
        let changed = false;
        room.seats = room.seats.map((s) => {
          if (s.user && s.user.id !== room.metadata.ownerId && !room.adminIds.has(s.user.id)) {
            changed = true;
            return { ...s, user: null, isSpeaking: false, isMuted: false };
          }
          return s;
        });
        if (changed) {
          this.broadcastToRoom(client.roomId, {
            type: 'SEATS_UPDATED',
            seats: room.seats,
          });
        }
      }
    }

    this.broadcastToRoom(client.roomId, {
      type: 'ROOM_METADATA_UPDATED',
      metadata: {
        ...room.metadata,
        password: undefined, // Hide password in broadcast
      },
    });

    this.broadcastToRoom(client.roomId, {
      type: 'SYNC_TOAST',
      message: 'เจ้าของห้องได้อัพเดทการตั้งค่าห้องแล้ว ⚙️',
      toastType: 'success',
    });
  }

  public handleUpdateRoomWidgets(ws: WebSocket, widgets: Partial<RoomWidgetsConfig>) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    if (client.user.id !== room.metadata.ownerId && !room.adminIds.has(client.user.id)) {
      this.sendToClient(ws, {
        type: 'SYNC_TOAST',
        message: 'เฉพาะเจ้าของห้องหรือผู้ดูแลห้องเท่านั้นที่สามารถเปลี่ยน Widget ได้',
        toastType: 'warning',
      });
      return;
    }

    room.metadata.widgets = {
      ...(room.metadata.widgets || { ...DEFAULT_ROOM_WIDGETS }),
      ...widgets,
    };

    if (widgets.enableVoiceStage === false) {
      room.seats = room.seats.map((s) => ({ ...s, user: null, isSpeaking: false, isMuted: false }));
      this.broadcastToRoom(client.roomId, {
        type: 'SEATS_UPDATED',
        seats: room.seats,
      });
    }

    this.broadcastToRoom(client.roomId, {
      type: 'ROOM_METADATA_UPDATED',
      metadata: {
        ...room.metadata,
        password: undefined,
      },
    });

    this.broadcastToRoom(client.roomId, {
      type: 'SYNC_TOAST',
      message: 'อัพเดทโมดูล Widget ประจำห้องแล้ว 🎛️',
      toastType: 'info',
    });
  }

  public handleSetAdminRole(ws: WebSocket, targetUserId: string, role: 'admin' | 'member') {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    // Only owner can promote/demote admins
    if (client.user.id !== room.metadata.ownerId) {
      return;
    }

    if (role === 'admin') {
      room.adminIds.add(targetUserId);
    } else {
      room.adminIds.delete(targetUserId);
    }

    const roomState = this.getRoomState(client.roomId);
    this.broadcastToRoom(client.roomId, {
      type: 'MEMBERS_UPDATED',
      members: roomState.members,
      onlineCount: roomState.onlineCount,
    });

    const targetUser = roomState.members.find((m) => m.user.id === targetUserId)?.user;
    if (targetUser) {
      this.broadcastToRoom(client.roomId, {
        type: 'SYNC_TOAST',
        message: role === 'admin'
          ? `แต่งตั้งคุณ ${targetUser.name} เป็น Admin เรียบร้อยแล้ว 🛡️`
          : `ปลดสิทธิ์ Admin ของคุณ ${targetUser.name} เรียบร้อยแล้ว`,
        toastType: 'info',
      });
    }
  }

  public handleKickUser(ws: WebSocket, targetUserId: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    const isOwner = client.user.id === room.metadata.ownerId;
    const isAdmin = room.adminIds.has(client.user.id);
    if (!isOwner && !isAdmin) return;

    // Cannot kick the owner
    if (targetUserId === room.metadata.ownerId) return;

    // Find target connection
    for (const c of this.clients.values()) {
      if (c.user.id === targetUserId && c.roomId === client.roomId) {
        this.sendToClient(c.ws, {
          type: 'YOU_WERE_KICKED',
          reason: `คุณถูกเตะออกจากห้องโดย ${client.user.name}`,
        });
        c.ws.close();
        break;
      }
    }
  }

  public handleBanUser(ws: WebSocket, targetUserId: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    const isOwner = client.user.id === room.metadata.ownerId;
    const isAdmin = room.adminIds.has(client.user.id);
    if (!isOwner && !isAdmin) return;

    if (targetUserId === room.metadata.ownerId) return;

    // Find user name
    let targetName = 'User';
    for (const c of this.clients.values()) {
      if (c.user.id === targetUserId && c.roomId === client.roomId) {
        targetName = c.user.name;
        this.sendToClient(c.ws, {
          type: 'YOU_WERE_BANNED',
          reason: `คุณถูกแบนออกจากห้องนี้โดย ${client.user.name}`,
        });
        c.ws.close();
        break;
      }
    }

    room.bannedUsers.set(targetUserId, {
      id: targetUserId,
      name: targetName,
      bannedAt: Date.now(),
      bannedByName: client.user.name,
    });

    this.broadcastToRoom(client.roomId, {
      type: 'SYNC_TOAST',
      message: `${targetName} ถูกแบนออกจากห้อง 🚫`,
      toastType: 'warning',
    });
  }

  public handleUnbanUser(ws: WebSocket, targetUserId: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    const isOwner = client.user.id === room.metadata.ownerId;
    const isAdmin = room.adminIds.has(client.user.id);
    if (!isOwner && !isAdmin) return;

    const user = room.bannedUsers.get(targetUserId);
    room.bannedUsers.delete(targetUserId);

    this.broadcastToRoom(client.roomId, {
      type: 'SYNC_TOAST',
      message: `ปลดแบน ${user ? user.name : 'ผู้ใช้'} เรียบร้อยแล้ว`,
      toastType: 'info',
    });
  }

  public handleForceLeaveStage(ws: WebSocket, targetUserId: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    const isOwner = client.user.id === room.metadata.ownerId;
    const isAdmin = room.adminIds.has(client.user.id);
    if (!isOwner && !isAdmin) return;

    let changed = false;
    room.seats = room.seats.map((s) => {
      if (s.user && s.user.id === targetUserId) {
        changed = true;
        return { ...s, user: null, isSpeaking: false, isMuted: false };
      }
      return s;
    });

    if (changed) {
      this.broadcastToRoom(client.roomId, {
        type: 'SEATS_UPDATED',
        seats: room.seats,
      });
      this.broadcastToRoom(client.roomId, {
        type: 'SYNC_TOAST',
        message: 'ผู้ดูแลได้เตะสมาชิกลงจากเวทีไมค์',
        toastType: 'info',
      });
    }
  }

  public handleTakeSeat(ws: WebSocket, seatNumber: number) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    if (seatNumber < 1 || seatNumber > 9) return;

    const isOwner = client.user.id === room.metadata.ownerId;
    const isAdmin = room.adminIds.has(client.user.id);
    const isApproved = room.approvedSpeakerIds ? room.approvedSpeakerIds.has(client.user.id) : false;

    // Check Stage Access Mode
    if (room.stageAccessMode === 'admin_only') {
      if (!isOwner && !isAdmin) {
        this.sendToClient(ws, {
          type: 'SYNC_TOAST',
          message: 'ห้องนี้จำกัดการขึ้นไมค์เฉพาะ เจ้าของห้อง (Owner) และ แอดมิน เท่านั้น 🛡️',
          toastType: 'warning',
        });
        return;
      }
    } else if (room.stageAccessMode === 'approval') {
      if (!isOwner && !isAdmin && !isApproved) {
        // Automatically create/forward a speak request to the owner!
        this.handleRequestToSpeak(ws, seatNumber);
        return;
      }
    }

    room.seats = room.seats.map((s) => {
      if (s.user && s.user.id === client.user.id) {
        return { ...s, user: null, isSpeaking: false, isMuted: false };
      }
      return s;
    });

    // Find first empty seat or allocate a new seat dynamically (no seat limit!)
    let assignedSeat = seatNumber ? room.seats.find((s) => s.seatNumber === seatNumber && s.user === null) : null;
    if (!assignedSeat) {
      assignedSeat = room.seats.find((s) => s.user === null);
    }
    if (!assignedSeat) {
      const nextSeatNum = room.seats.length + 1;
      assignedSeat = {
        seatNumber: nextSeatNum,
        user: null,
        isMuted: false,
        isSpeaking: false,
      };
      room.seats.push(assignedSeat);
    }

    assignedSeat.user = client.user;
    assignedSeat.isMuted = false;
    assignedSeat.isSpeaking = false;

    this.broadcastToRoom(client.roomId, {
      type: 'SEATS_UPDATED',
      seats: room.seats,
    });

    this.broadcastToRoom(client.roomId, {
      type: 'SYNC_TOAST',
      message: `${client.user.name} เข้าร่วมคุยในสายไมค์ 🎙️`,
      toastType: 'info',
    });
  }

  public handleRequestToSpeak(ws: WebSocket, seatNumber?: number) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    const isOwner = client.user.id === room.metadata.ownerId;
    const isAdmin = room.adminIds.has(client.user.id);

    // If already allowed, take the seat immediately
    if (isOwner || isAdmin || (room.approvedSpeakerIds && room.approvedSpeakerIds.has(client.user.id))) {
      if (seatNumber) {
        this.handleTakeSeat(ws, seatNumber);
      }
      return;
    }

    const request: StageRequest = {
      userId: client.user.id,
      user: client.user,
      requestedSeatNumber: seatNumber,
      timestamp: Date.now(),
    };

    if (!room.pendingStageRequests) {
      room.pendingStageRequests = new Map();
    }
    room.pendingStageRequests.set(client.user.id, request);

    this.broadcastStageRequests(client.roomId);

    this.sendToClient(ws, {
      type: 'SYNC_TOAST',
      message: 'ส่งคำขอขึ้นไมค์ถึงเจ้าของห้องแล้ว กรุณารอสักครู่ ⏳',
      toastType: 'info',
    });

    // Notify owner & admins
    this.notifyOwnerAndAdmins(client.roomId, {
      type: 'SYNC_TOAST',
      message: `✋ ${client.user.name} ขอยกมือขอขึ้นไมค์บนเวที`,
      toastType: 'info',
    });
  }

  public handleApproveSpeakRequest(
    ws: WebSocket,
    targetUserId: string,
    approved: boolean,
    seatNumber?: number
  ) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    const isOwner = client.user.id === room.metadata.ownerId;
    const isAdmin = room.adminIds.has(client.user.id);

    if (!isOwner && !isAdmin) {
      this.sendToClient(ws, {
        type: 'SYNC_TOAST',
        message: 'เฉพาะ Owner & Admin เท่านั้นที่สามารถอนุมัติคำขอขึ้นไมค์ได้',
        toastType: 'warning',
      });
      return;
    }

    const pending = room.pendingStageRequests ? room.pendingStageRequests.get(targetUserId) : undefined;
    if (room.pendingStageRequests) {
      room.pendingStageRequests.delete(targetUserId);
    }

    if (approved) {
      if (!room.approvedSpeakerIds) {
        room.approvedSpeakerIds = new Set();
      }
      room.approvedSpeakerIds.add(targetUserId);

      // Find target user connection
      const targetClient = Array.from(this.clients.values()).find(
        (c) => c.roomId === client.roomId && c.user.id === targetUserId
      );

      if (targetClient) {
        this.sendToClient(targetClient.ws, {
          type: 'SYNC_TOAST',
          message: 'เจ้าของห้องอนุมัติให้คุณขึ้นไมค์แล้ว 🎉',
          toastType: 'success',
        });

        const targetSeat = seatNumber || pending?.requestedSeatNumber;
        if (targetSeat && targetSeat >= 1 && targetSeat <= 9 && room.seats[targetSeat - 1]?.user === null) {
          this.handleTakeSeat(targetClient.ws, targetSeat);
        } else {
          const firstEmpty = room.seats.find((s) => s.user === null);
          if (firstEmpty) {
            this.handleTakeSeat(targetClient.ws, firstEmpty.seatNumber);
          }
        }
      }
    } else {
      const targetClient = Array.from(this.clients.values()).find(
        (c) => c.roomId === client.roomId && c.user.id === targetUserId
      );
      if (targetClient) {
        this.sendToClient(targetClient.ws, {
          type: 'SYNC_TOAST',
          message: 'คำขอขึ้นไมค์ของคุณไม่ได้รับการอนุมัติในขณะนี้',
          toastType: 'warning',
        });
      }
    }

    this.broadcastStageRequests(client.roomId);
  }

  public handleRevokeSpeakPermission(ws: WebSocket, targetUserId: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    const isOwner = client.user.id === room.metadata.ownerId;
    if (!isOwner) return;

    if (room.approvedSpeakerIds) {
      room.approvedSpeakerIds.delete(targetUserId);
    }

    // If sitting on stage, remove them
    let changed = false;
    room.seats = room.seats.map((s) => {
      if (s.user && s.user.id === targetUserId) {
        changed = true;
        return { ...s, user: null, isSpeaking: false, isMuted: false };
      }
      return s;
    });

    if (changed) {
      this.broadcastToRoom(client.roomId, {
        type: 'SEATS_UPDATED',
        seats: room.seats,
      });
      this.broadcastToRoom(client.roomId, {
        type: 'SYNC_TOAST',
        message: 'เจ้าของห้องได้เพิกถอนสิทธิ์การขึ้นไมค์ของผู้ใช้',
        toastType: 'info',
      });
    }

    this.broadcastStageRequests(client.roomId);
  }

  private broadcastStageRequests(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    this.broadcastToRoom(roomId, {
      type: 'STAGE_REQUESTS_UPDATED',
      pendingRequests: Array.from(room.pendingStageRequests ? room.pendingStageRequests.values() : []),
      approvedSpeakerIds: Array.from(room.approvedSpeakerIds || []),
    });
  }

  private notifyOwnerAndAdmins(roomId: string, message: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const data = JSON.stringify(message);
    for (const client of this.clients.values()) {
      if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
        if (client.user.id === room.metadata.ownerId || room.adminIds.has(client.user.id)) {
          client.ws.send(data);
        }
      }
    }
  }

  public handleLeaveSeat(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    let changed = false;
    let oldSeatNum = 0;

    room.seats = room.seats.map((s) => {
      if (s.user && s.user.id === client.user.id) {
        changed = true;
        oldSeatNum = s.seatNumber;
        return { ...s, user: null, isSpeaking: false, isMuted: false };
      }
      return s;
    });

    if (changed) {
      this.broadcastToRoom(client.roomId, {
        type: 'SEATS_UPDATED',
        seats: room.seats,
      });

      this.broadcastToRoom(client.roomId, {
        type: 'SYNC_TOAST',
        message: `${client.user.name} ออกจากสายไมค์ 🎧`,
        toastType: 'info',
      });
    }
  }

  public handleToggleMute(ws: WebSocket, isMuted: boolean) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    let changed = false;

    room.seats = room.seats.map((s) => {
      if (s.user && s.user.id === client.user.id) {
        changed = true;
        return { ...s, isMuted, isSpeaking: isMuted ? false : s.isSpeaking };
      }
      return s;
    });

    if (changed) {
      this.broadcastToRoom(client.roomId, {
        type: 'SEATS_UPDATED',
        seats: room.seats,
      });
    }
  }

  public handleSpeakingState(ws: WebSocket, isSpeaking: boolean) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    let changed = false;

    room.seats = room.seats.map((s) => {
      if (s.user && s.user.id === client.user.id) {
        if (s.isSpeaking !== isSpeaking) {
          changed = true;
          return { ...s, isSpeaking: s.isMuted ? false : isSpeaking };
        }
      }
      return s;
    });

    if (changed) {
      this.broadcastToRoom(client.roomId, {
        type: 'SEATS_UPDATED',
        seats: room.seats,
      });
    }
  }

  public handleVideoPlay(ws: WebSocket, currentTime: number, duration?: number) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    room.video.isPlaying = true;
    room.video.currentTime = currentTime;
    if (duration && duration > 0) {
      room.video.duration = duration;
    }
    room.video.lastUpdated = Date.now();

    this.broadcastToRoom(client.roomId, {
      type: 'VIDEO_SYNC',
      video: room.video,
      triggeredByName: client.user.name,
      actionType: 'play',
    });
  }

  public handleVideoPause(ws: WebSocket, currentTime: number, duration?: number) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    room.video.isPlaying = false;
    room.video.currentTime = currentTime;
    if (duration && duration > 0) {
      room.video.duration = duration;
    }
    room.video.lastUpdated = Date.now();

    this.broadcastToRoom(client.roomId, {
      type: 'VIDEO_SYNC',
      video: room.video,
      triggeredByName: client.user.name,
      actionType: 'pause',
    });
  }

  public handleVideoSeek(ws: WebSocket, currentTime: number, duration?: number) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    room.video.currentTime = currentTime;
    if (duration && duration > 0) {
      room.video.duration = duration;
    }
    room.video.lastUpdated = Date.now();

    this.broadcastToRoom(client.roomId, {
      type: 'VIDEO_SYNC',
      video: room.video,
      triggeredByName: client.user.name,
      actionType: 'seek',
    });
  }

  public handleVideoChange(ws: WebSocket, videoId: string, title?: string, channel?: string, duration?: number) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);

    // Check playlist restriction
    if (room.metadata.onlyAdminManagePlaylist) {
      const isOwner = client.user.id === room.metadata.ownerId;
      const isAdmin = room.adminIds.has(client.user.id);
      if (!isOwner && !isAdmin) {
        this.sendToClient(ws, {
          type: 'SYNC_TOAST',
          message: 'ห้องนี้จำกัดสิทธิ์เฉพาะ Owner & Admin เท่านั้นในการเปลี่ยนเพลง',
          toastType: 'warning',
        });
        return;
      }
    }

    room.video = {
      videoId,
      title: title || 'YouTube Video',
      channel: channel || 'YouTube',
      duration: duration || 0,
      currentTime: 0,
      isPlaying: true,
      lastUpdated: Date.now(),
    };

    platformManager.recordTrackPlay({
      videoId,
      title: room.video.title,
      channel: room.video.channel,
    });

    this.broadcastToRoom(client.roomId, {
      type: 'VIDEO_SYNC',
      video: room.video,
      triggeredByName: client.user.name,
      actionType: 'change',
    });

    this.broadcastToRoom(client.roomId, {
      type: 'SYNC_TOAST',
      message: `${client.user.name} เปลี่ยนวิดีโอเป็น "${room.video.title}"`,
      toastType: 'info',
    });
  }

  public handlePlaylistAdd(ws: WebSocket, item: Omit<PlaylistItem, 'id'>, roomIdParam?: string) {
    let client = this.clients.get(ws);
    const targetRoomId = client?.roomId || roomIdParam;
    if (!targetRoomId) {
      console.warn('[PLAYLIST_ADD] No roomId found for websocket request');
      return;
    }

    const room = this.getOrCreateRoom(targetRoomId);

    // If client was not yet registered in this.clients on this ws, register fallback
    if (!client) {
      const fallbackUser: UserProfile = {
        id: 'usr-' + Math.random().toString(36).substr(2, 6),
        name: item.addedBy || 'Guest',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${item.addedBy || 'guest'}`,
        color: '#8b5cf6',
      };
      this.clients.set(ws, { ws, user: fallbackUser, roomId: targetRoomId });
      client = this.clients.get(ws);
    }

    if (room.metadata.onlyAdminManagePlaylist && client) {
      const isOwner = client.user.id === room.metadata.ownerId;
      const isAdmin = room.adminIds.has(client.user.id);
      if (!isOwner && !isAdmin) {
        this.sendToClient(ws, {
          type: 'SYNC_TOAST',
          message: 'ห้องนี้จำกัดสิทธิ์เฉพาะ Owner & Admin เท่านั้นในการเพิ่มเพลง ⚠️',
          toastType: 'warning',
        });
        return;
      }
    }

    const newItem: PlaylistItem = {
      ...item,
      id: 'pl-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    };
    room.playlist.push(newItem);

    // If the room video player is currently blank / idle, immediately start playing the new song
    if (!room.video.videoId) {
      room.video.videoId = newItem.videoId;
      room.video.title = newItem.title;
      room.video.channel = newItem.channel;
      room.video.isPlaying = true;
      room.video.currentTime = 0;
      room.video.lastUpdated = Date.now();

      this.broadcastToRoom(targetRoomId, {
        type: 'VIDEO_SYNC',
        video: room.video,
        triggeredByName: client?.user.name || 'System',
        actionType: 'change',
      });
    }

    this.broadcastToRoom(targetRoomId, {
      type: 'PLAYLIST_UPDATED',
      playlist: room.playlist,
      loopMode: room.loopMode,
      isShuffle: room.isShuffle,
    });

    this.broadcastToRoom(targetRoomId, {
      type: 'SYNC_TOAST',
      message: `เพิ่ม "${item.title}" เข้า Playlist แล้ว 🎵`,
      toastType: 'success',
    });
  }

  public handlePlaylistRemove(ws: WebSocket, id: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);

    if (room.metadata.onlyAdminManagePlaylist) {
      const isOwner = client.user.id === room.metadata.ownerId;
      const isAdmin = room.adminIds.has(client.user.id);
      if (!isOwner && !isAdmin) return;
    }

    room.playlist = room.playlist.filter((p) => p.id !== id);

    this.broadcastToRoom(client.roomId, {
      type: 'PLAYLIST_UPDATED',
      playlist: room.playlist,
      loopMode: room.loopMode,
      isShuffle: room.isShuffle,
    });
  }

  public handlePlaylistClear(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);

    if (room.metadata.onlyAdminManagePlaylist) {
      const isOwner = client.user.id === room.metadata.ownerId;
      const isAdmin = room.adminIds.has(client.user.id);
      if (!isOwner && !isAdmin) return;
    }

    room.playlist = [];

    this.broadcastToRoom(client.roomId, {
      type: 'PLAYLIST_UPDATED',
      playlist: room.playlist,
      loopMode: room.loopMode,
      isShuffle: room.isShuffle,
    });
  }

  public handleSetLoopMode(ws: WebSocket, loopMode: LoopMode) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);

    if (room.metadata.onlyAdminManagePlaylist) {
      const isOwner = client.user.id === room.metadata.ownerId;
      const isAdmin = room.adminIds.has(client.user.id);
      if (!isOwner && !isAdmin) {
        this.sendToClient(ws, {
          type: 'SYNC_TOAST',
          message: 'ห้องนี้จำกัดสิทธิ์เฉพาะ Owner & Admin เท่านั้นในการเปลี่ยนโหมดเล่นวน',
          toastType: 'warning',
        });
        return;
      }
    }

    room.loopMode = loopMode;

    this.broadcastToRoom(client.roomId, {
      type: 'PLAYLIST_UPDATED',
      playlist: room.playlist,
      loopMode: room.loopMode,
      isShuffle: room.isShuffle,
    });

    const labels: Record<LoopMode, string> = {
      off: 'ปิดการเล่นวนซ้ำ (เล่นตามคิวรอบเดียว) ➡️',
      all: 'เปิดการเล่นวนซ้ำทั้งคิว (Loop All) 🔁',
      single: 'เปิดการเล่นซ้ำเพลงเดิม (Loop Single) 🔂',
    };

    this.broadcastToRoom(client.roomId, {
      type: 'SYNC_TOAST',
      message: labels[loopMode] || 'เปลี่ยนโหมดเล่นวนแล้ว',
      toastType: 'info',
    });
  }

  public handleSetShuffle(ws: WebSocket, isShuffle: boolean) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);

    if (room.metadata.onlyAdminManagePlaylist) {
      const isOwner = client.user.id === room.metadata.ownerId;
      const isAdmin = room.adminIds.has(client.user.id);
      if (!isOwner && !isAdmin) {
        this.sendToClient(ws, {
          type: 'SYNC_TOAST',
          message: 'ห้องนี้จำกัดสิทธิ์เฉพาะ Owner & Admin เท่านั้นในการเปลี่ยนโหมดสุ่มเพลง',
          toastType: 'warning',
        });
        return;
      }
    }

    room.isShuffle = isShuffle;

    this.broadcastToRoom(client.roomId, {
      type: 'PLAYLIST_UPDATED',
      playlist: room.playlist,
      loopMode: room.loopMode,
      isShuffle: room.isShuffle,
    });

    this.broadcastToRoom(client.roomId, {
      type: 'SYNC_TOAST',
      message: isShuffle ? 'เปิดระบบสุ่มเพลงใน Playlist 🔀' : 'ปิดระบบสุ่มเพลง (เล่นตามลำดับปกติ)',
      toastType: 'info',
    });
  }

  /**
   * Advances or rewinds playlist playback (server-authoritative)
   */
  public advancePlaylist(roomId: string, reason: 'ended' | 'next' | 'prev', requestedByClient?: ClientConnection) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const now = Date.now();
    // Debounce rapid calls (e.g. from multiple clients simultaneously hitting ended event)
    if (reason === 'ended' && now - room.lastVideoEndedTime < 2000) {
      return;
    }
    room.lastVideoEndedTime = now;

    // 1. Loop Single (Repeat current song)
    if (room.loopMode === 'single' && reason === 'ended') {
      room.video.currentTime = 0;
      room.video.isPlaying = true;
      room.video.lastUpdated = Date.now();

      this.broadcastToRoom(roomId, {
        type: 'VIDEO_SYNC',
        video: room.video,
        actionType: 'seek',
      });

      this.broadcastToRoom(roomId, {
        type: 'SYNC_TOAST',
        message: `เล่นซ้ำเพลงเดิม: "${room.video.title}" 🔂`,
        toastType: 'info',
      });
      return;
    }

    // 2. If playlist has no songs
    if (room.playlist.length === 0) {
      if (reason === 'ended') {
        room.video.isPlaying = false;
        room.video.lastUpdated = Date.now();
        this.broadcastToRoom(roomId, {
          type: 'VIDEO_SYNC',
          video: room.video,
          actionType: 'pause',
        });
      }
      return;
    }

    // 3. Find current track in playlist
    const currentIndex = room.playlist.findIndex((p) => p.videoId === room.video.videoId);
    let nextIndex = 0;

    if (reason === 'prev') {
      if (currentIndex > 0) {
        nextIndex = currentIndex - 1;
      } else {
        nextIndex = room.playlist.length - 1;
      }
    } else if (room.isShuffle && room.playlist.length > 1) {
      // Pick random index different from current
      let rand = Math.floor(Math.random() * room.playlist.length);
      if (rand === currentIndex) {
        rand = (rand + 1) % room.playlist.length;
      }
      nextIndex = rand;
    } else {
      // Sequential progression
      if (currentIndex === -1) {
        nextIndex = 0;
      } else {
        nextIndex = currentIndex + 1;
        if (nextIndex >= room.playlist.length) {
          if (room.loopMode === 'all') {
            nextIndex = 0;
          } else if (reason === 'ended') {
            // Reached end of playlist without Loop All
            room.video.isPlaying = false;
            room.video.currentTime = 0;
            room.video.lastUpdated = Date.now();
            this.broadcastToRoom(roomId, {
              type: 'VIDEO_SYNC',
              video: room.video,
              actionType: 'pause',
            });
            this.broadcastToRoom(roomId, {
              type: 'SYNC_TOAST',
              message: 'เล่นจบรายการคิวเพลงแล้ว (เปิด Loop All หากต้องการให้เล่นวนซ้ำ) 🎵',
              toastType: 'info',
            });
            return;
          } else {
            // Manual Next wraps around
            nextIndex = 0;
          }
        }
      }
    }

    const nextTrack = room.playlist[nextIndex];
    if (!nextTrack) return;

    room.video = {
      videoId: nextTrack.videoId,
      title: nextTrack.title,
      channel: nextTrack.channel,
      duration: 0,
      currentTime: 0,
      isPlaying: true,
      lastUpdated: Date.now(),
    };

    this.broadcastToRoom(roomId, {
      type: 'VIDEO_SYNC',
      video: room.video,
      triggeredByName: requestedByClient ? requestedByClient.user.name : 'ระบบคิวเพลงอัตโนมัติ',
      actionType: 'change',
    });

    const prefix =
      reason === 'ended'
        ? 'เล่นเพลงถัดไปในคิว'
        : reason === 'prev'
        ? 'ย้อนกลับเพลงก่อนหน้า'
        : 'ข้ามไปเพลงถัดไป';

    this.broadcastToRoom(roomId, {
      type: 'SYNC_TOAST',
      message: `${prefix}: "${nextTrack.title}" (${nextIndex + 1}/${room.playlist.length})`,
      toastType: 'info',
    });
  }

  public handleVideoEnded(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;
    this.advancePlaylist(client.roomId, 'ended', client);
  }

  public handlePlaylistNext(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    if (room.metadata.onlyAdminManagePlaylist) {
      const isOwner = client.user.id === room.metadata.ownerId;
      const isAdmin = room.adminIds.has(client.user.id);
      if (!isOwner && !isAdmin) {
        this.sendToClient(ws, {
          type: 'SYNC_TOAST',
          message: 'ห้องนี้จำกัดสิทธิ์เฉพาะ Owner & Admin เท่านั้นในการข้ามเพลง',
          toastType: 'warning',
        });
        return;
      }
    }

    this.advancePlaylist(client.roomId, 'next', client);
  }

  public handlePlaylistPrev(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    if (room.metadata.onlyAdminManagePlaylist) {
      const isOwner = client.user.id === room.metadata.ownerId;
      const isAdmin = room.adminIds.has(client.user.id);
      if (!isOwner && !isAdmin) {
        this.sendToClient(ws, {
          type: 'SYNC_TOAST',
          message: 'ห้องนี้จำกัดสิทธิ์เฉพาะ Owner & Admin เท่านั้นในการเปลี่ยนเพลง',
          toastType: 'warning',
        });
        return;
      }
    }

    this.advancePlaylist(client.roomId, 'prev', client);
  }

  public handleChat(ws: WebSocket, text: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.getOrCreateRoom(client.roomId);
    const message: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      sender: client.user,
      text: text.trim(),
      timestamp: Date.now(),
    };

    room.chat.push(message);
    if (room.chat.length > 200) {
      room.chat.shift();
    }

    this.broadcastToRoom(client.roomId, {
      type: 'NEW_CHAT',
      message,
    });
  }

  public handleEmojiReaction(ws: WebSocket, emoji: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    this.broadcastToRoom(client.roomId, {
      type: 'EMOJI_REACTION',
      emoji,
      sender: client.user,
    });
  }

  public handlePlaySound(ws: WebSocket, soundId: string, soundName: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    this.broadcastToRoom(client.roomId, {
      type: 'PLAY_SOUND',
      soundId,
      soundName,
      playedBy: client.user,
    });
  }

  public handleSignal(ws: WebSocket, targetId: string, data: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    for (const c of this.clients.values()) {
      if (c.user.id === targetId && c.roomId === client.roomId && c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(JSON.stringify({
          type: 'SIGNAL_DATA',
          senderId: client.user.id,
          data,
        }));
        break;
      }
    }
  }

  public handleDisconnect(ws: WebSocket) {
    this.pendingUsers.delete(ws);
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomId, user } = client;
    this.clients.delete(ws);

    const room = this.rooms.get(roomId);
    if (room) {
      let seatChanged = false;
      room.seats = room.seats.map((s) => {
        if (s.user && s.user.id === user.id) {
          seatChanged = true;
          return { ...s, user: null, isSpeaking: false, isMuted: false };
        }
        return s;
      });

      const clients = this.getRoomClients(roomId);
      const onlineCount = clients.length;

      if (seatChanged) {
        this.broadcastToRoom(roomId, {
          type: 'SEATS_UPDATED',
          seats: room.seats,
        });
      }

      this.broadcastToRoom(roomId, {
        type: 'USER_LEFT',
        userId: user.id,
        onlineCount,
      });

      const roomState = this.getRoomState(roomId);
      this.broadcastToRoom(roomId, {
        type: 'MEMBERS_UPDATED',
        members: roomState.members,
        onlineCount,
      });
    }
  }
}
