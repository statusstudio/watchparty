export type AuthProvider = 'google' | 'facebook' | 'guest';

export interface UserSocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  spotify?: string;
  youtube?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  bannerUrl?: string;
  color: string;
  email?: string;
  provider?: AuthProvider;
  bio?: string;
  favoriteGenres?: string[];
  socialLinks?: UserSocialLinks;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isSuperAdmin?: boolean;
  createdAt?: number;
}

export interface FavoriteSong {
  id: string;
  userId: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  createdAt: number;
}

export type UserRole = 'owner' | 'admin' | 'member';

export interface RoomMember {
  user: UserProfile;
  role: UserRole;
  joinedAt: number;
}

export interface BannedUser {
  id: string;
  name: string;
  bannedAt: number;
  bannedByName: string;
}

export interface StageSeat {
  seatNumber: number; // 1 to 9
  user: UserProfile | null;
  isMuted: boolean;
  isSpeaking: boolean;
}

export interface VideoState {
  videoId: string;
  title: string;
  channel: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  lastUpdated: number;
}

export interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  addedBy: string;
}

export type LoopMode = 'off' | 'all' | 'single';

export interface ChatMessage {
  id: string;
  sender: UserProfile;
  text: string;
  timestamp: number;
  imageUrl?: string;
}

export type RoomCategory =
  | 'music'
  | 'gaming'
  | 'anime_movie'
  | 'talk'
  | 'study_work'
  | 'entertainment'
  | 'general';

export type StageAccessMode = 'everyone' | 'admin_only' | 'approval';

export interface StageRequest {
  userId: string;
  user: UserProfile;
  requestedSeatNumber?: number;
  timestamp: number;
}

export interface RoomWidgetsConfig {
  enableVoiceStage: boolean;
  enableChat: boolean;
  enableQueue: boolean;
  enableReactions: boolean;
  enableSoundboard: boolean;
  enableChatImages?: boolean;
}

export const DEFAULT_ROOM_WIDGETS: RoomWidgetsConfig = {
  enableVoiceStage: true,
  enableChat: true,
  enableQueue: true,
  enableReactions: true,
  enableSoundboard: true,
  enableChatImages: true,
};

export interface RoomMetadata {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  isPrivate: boolean;
  hasPassword: boolean;
  password?: string;
  onlyAdminManagePlaylist: boolean;
  stageAccessMode: StageAccessMode;
  category?: RoomCategory;
  coverImage?: string;
  widgets?: RoomWidgetsConfig;
  createdAt: number;
}

export interface RoomSummary {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  isPrivate: boolean;
  stageAccessMode?: StageAccessMode;
  category?: RoomCategory;
  coverImage?: string;
  widgets?: RoomWidgetsConfig;
  onlineCount: number;
  currentVideo: {
    videoId: string;
    title: string;
    thumbnail: string;
  };
  createdAt: number;
}

export interface RoomState {
  roomId: string;
  metadata: RoomMetadata;
  seats: StageSeat[];
  video: VideoState;
  playlist: PlaylistItem[];
  loopMode: LoopMode;
  isShuffle: boolean;
  stageAccessMode: StageAccessMode;
  approvedSpeakerIds: string[];
  pendingStageRequests: StageRequest[];
  chat: ChatMessage[];
  members: RoomMember[];
  bannedUsers: BannedUser[];
  onlineCount: number;
  myRole: UserRole;
}

export type WSClientMessage =
  | { type: 'JOIN_ROOM'; roomId: string; user: UserProfile; password?: string }
  | { type: 'GET_ROOMS' }
  | { type: 'VERIFY_ROOM_PASSWORD'; roomId: string; password: string; user?: UserProfile }
  | { type: 'UPDATE_PROFILE'; user: UserProfile }
  | { type: 'UPDATE_ROOM_SETTINGS'; settings: { name: string; description: string; isPrivate: boolean; password?: string; category?: RoomCategory; coverImage?: string; onlyAdminManagePlaylist: boolean; stageAccessMode?: StageAccessMode; widgets?: RoomWidgetsConfig } }
  | { type: 'UPDATE_ROOM_WIDGETS'; widgets: Partial<RoomWidgetsConfig> }
  | { type: 'SET_ADMIN_ROLE'; targetUserId: string; role: 'admin' | 'member' }
  | { type: 'KICK_USER'; targetUserId: string }
  | { type: 'BAN_USER'; targetUserId: string }
  | { type: 'UNBAN_USER'; targetUserId: string }
  | { type: 'FORCE_MUTE'; targetUserId: string }
  | { type: 'FORCE_LEAVE_STAGE'; targetUserId: string }
  | { type: 'TAKE_SEAT'; seatNumber: number }
  | { type: 'LEAVE_SEAT' }
  | { type: 'REQUEST_TO_SPEAK'; seatNumber?: number }
  | { type: 'APPROVE_SPEAK_REQUEST'; targetUserId: string; approved: boolean; seatNumber?: number }
  | { type: 'REVOKE_SPEAK_PERMISSION'; targetUserId: string }
  | { type: 'TOGGLE_MUTE'; isMuted: boolean }
  | { type: 'SPEAKING_STATE'; isSpeaking: boolean }
  | { type: 'VIDEO_PLAY'; currentTime: number; duration?: number }
  | { type: 'VIDEO_PAUSE'; currentTime: number; duration?: number }
  | { type: 'VIDEO_SEEK'; currentTime: number; duration?: number }
  | { type: 'VIDEO_CHANGE'; videoId: string; title?: string; channel?: string; duration?: number }
  | { type: 'VIDEO_ENDED' }
  | { type: 'PLAYLIST_ADD'; item: Omit<PlaylistItem, 'id'>; roomId?: string }
  | { type: 'PLAYLIST_REMOVE'; id: string }
  | { type: 'PLAYLIST_CLEAR' }
  | { type: 'PLAYLIST_NEXT' }
  | { type: 'PLAYLIST_PREV' }
  | { type: 'SET_LOOP_MODE'; loopMode: LoopMode }
  | { type: 'SET_SHUFFLE'; isShuffle: boolean }
  | { type: 'SEND_CHAT'; text: string; imageUrl?: string }
  | { type: 'CLOSE_ROOM' }
  | { type: 'EMOJI_REACTION'; emoji: string }
  | { type: 'PLAY_SOUND'; soundId: string; soundName: string }
  | { type: 'SIGNAL_DATA'; targetId: string; data: any };

export type WSServerMessage =
  | { type: 'ROOMS_LIST'; rooms: RoomSummary[] }
  | { type: 'PASSWORD_REQUIRED'; roomId: string; roomName: string }
  | { type: 'PASSWORD_ERROR'; message: string }
  | { type: 'YOU_WERE_KICKED'; reason: string }
  | { type: 'YOU_WERE_BANNED'; reason: string }
  | { type: 'ROOM_INIT'; state: RoomState; myUserId: string }
  | { type: 'ROOM_METADATA_UPDATED'; metadata: RoomMetadata }
  | { type: 'MEMBERS_UPDATED'; members: RoomMember[]; onlineCount: number }
  | { type: 'USER_JOINED'; user: UserProfile; onlineCount: number }
  | { type: 'USER_LEFT'; userId: string; onlineCount: number }
  | { type: 'SEATS_UPDATED'; seats: StageSeat[] }
  | { type: 'STAGE_REQUESTS_UPDATED'; pendingRequests: StageRequest[]; approvedSpeakerIds: string[]; stageAccessMode?: StageAccessMode }
  | { type: 'VIDEO_SYNC'; video: VideoState; triggeredByName?: string; actionType?: 'play' | 'pause' | 'seek' | 'change' }
  | { type: 'PLAYLIST_UPDATED'; playlist: PlaylistItem[]; loopMode: LoopMode; isShuffle: boolean }
  | { type: 'NEW_CHAT'; message: ChatMessage }
  | { type: 'EMOJI_REACTION'; emoji: string; sender: UserProfile }
  | { type: 'PLAY_SOUND'; soundId: string; soundName: string; playedBy: UserProfile }
  | { type: 'SIGNAL_DATA'; senderId: string; data: any }
  | { type: 'SYNC_TOAST'; message: string; toastType?: 'info' | 'success' | 'warning' }
  | { type: 'YOU_WERE_SUSPENDED'; reason: string }
  | { type: 'ROOM_FORCE_CLOSED'; roomId: string; reason: string }
  | { type: 'PLATFORM_CONFIG_UPDATED'; config: PlatformConfig }
  | { type: 'SYSTEM_ANNOUNCEMENT'; text: string; announcementType?: 'info' | 'warning' | 'alert' };

// Platform Owner & Super Admin Types
export interface PlatformUser {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  color: string;
  provider: AuthProvider;
  isSuperAdmin: boolean;
  isSuspended: boolean;
  createdAt: number;
  lastActiveAt: number;
  currentRoomId?: string;
}

export type TicketCategory = 'bug' | 'report_room' | 'feature' | 'general';
export type TicketStatus = 'pending' | 'in_progress' | 'resolved';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  isSuperAdmin: boolean;
  text: string;
  timestamp: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar: string;
  category: TicketCategory;
  title: string;
  description: string;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface PlatformConfig {
  maintenanceMode: boolean;
  announcementBanner?: {
    enabled: boolean;
    text: string;
    type: 'info' | 'warning' | 'alert';
  };
  globalWidgets: {
    enableVoiceStage: boolean;
    enableChat: boolean;
    enableSoundboard: boolean;
  };
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  maintenanceMode: false,
  announcementBanner: {
    enabled: false,
    text: '',
    type: 'info',
  },
  globalWidgets: {
    enableVoiceStage: true,
    enableChat: true,
    enableSoundboard: true,
  },
};

export interface TrackPlayStat {
  videoId: string;
  title: string;
  channel?: string;
  thumbnail?: string;
  playCount: number;
  lastPlayedAt: number;
}

export interface PlatformAnalytics {
  onlineVisitors: number;
  totalUsers: number;
  usersByProvider: {
    google: number;
    facebook: number;
    guest: number;
  };
  activeRooms: number;
  topTracks: TrackPlayStat[];
  serverUptimeSeconds: number;
  memoryUsageMb: number;
}

export interface PlatformStats {
  totalOnlineUsers: number;
  totalRooms: number;
  totalUsers: number;
  openTickets: number;
  serverUptimeSeconds: number;
}
