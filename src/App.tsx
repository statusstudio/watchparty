import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UserProfile,
  RoomState,
  StageSeat,
  VideoState,
  PlaylistItem,
  LoopMode,
  ChatMessage,
  WSServerMessage,
  RoomSummary,
  RoomMember,
  BannedUser,
  RoomMetadata,
  UserRole,
  RoomCategory,
  StageRequest,
  StageAccessMode,
  PlatformConfig,
  DEFAULT_PLATFORM_CONFIG,
  RoomWidgetsConfig,
  DrawAndGuessGameState,
  DrawStroke,
} from './types/index.js';
import { getStoredUser, saveUser, clearUser } from './services/auth.js';
import { socketService } from './services/socket.js';
import { WebRTCVoiceEngine } from './services/webrtc.js';
import { ListMusic, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, MessageSquare, Users, Crown, Shield, Mic, Mic2, Plus, Radio, RefreshCw, Moon, X, Ghost, LogOut, Play, Pause, RotateCcw, RotateCw, Gamepad2, Clock, Share2, Download, Gift } from 'lucide-react';
import { Navbar } from './components/Navbar.js';
import { VideoPlayer } from './components/VideoPlayer.js';
import { KaraokeLyricsModal } from './components/KaraokeLyricsModal.js';
import { SleepTimerModal } from './components/SleepTimerModal.js';
import { ShareCardModal } from './components/ShareCardModal.js';
import { VoiceStage } from './components/VoiceStage.js';
import { LiveChat } from './components/LiveChat.js';
import { SidebarQueue } from './components/SidebarQueue.js';
import { HomeView } from './components/HomeView.js';
import { MinimizedRoomCard } from './components/MinimizedRoomCard.js';
import { ProfileModal } from './components/ProfileModal.js';
import { AuthModal } from './components/AuthModal.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import { UserCardModal } from './components/UserCardModal.js';
import { PlaylistModal } from './components/PlaylistModal.js';
import { CreateRoomModal, CreateRoomForm } from './components/CreateRoomModal.js';
import { PasswordGateModal } from './components/PasswordGateModal.js';
import { AdminPanelModal } from './components/AdminPanelModal.js';
import { SuperAdminUnlockModal } from './components/SuperAdminUnlockModal.js';
import { AdPopupModal } from './components/AdPopupModal.js';
import { SupportModal } from './components/SupportModal.js';
import { InstallAppModal } from './components/InstallAppModal.js';
import { LiveTVModal } from './components/LiveTVModal.js';
import { LiveChannel } from './data/iptvChannels.js';

// Code-split heavy views to reduce initial bundle size & speed up page load drastically
const LineStickerStudio = React.lazy(() => import('./components/LineStickerStudio.js'));
const AdminPortalView = React.lazy(() => import('./components/AdminPortalView.js').then((m) => ({ default: m.AdminPortalView })));
const PublicProfileView = React.lazy(() => import('./components/PublicProfileView.js').then((m) => ({ default: m.PublicProfileView })));
const SuperAdminDashboardModal = React.lazy(() => import('./components/SuperAdminDashboardModal.js').then((m) => ({ default: m.SuperAdminDashboardModal })));
const DrawAndGuessStage = React.lazy(() => import('./components/DrawAndGuessStage.js').then((m) => ({ default: m.DrawAndGuessStage })));
import { FloatingItem, GiftEvent } from './components/FloatingReactions.js';
import { ToastContainer, ToastItem } from './components/Toast.js';
import {
  isSupabaseConfigured,
  supabase,
  fetchProfile,
  addFavorite,
  removeFavorite,
  checkIsFavorite,
} from './services/supabase.js';

function isAdminPath(): boolean {
  return (
    window.location.pathname.startsWith('/admin') ||
    window.location.hash.startsWith('#admin')
  );
}

function isLineStudioPath(): boolean {
  return (
    window.location.pathname.startsWith('/line') ||
    window.location.hash.startsWith('#line')
  );
}

function getProfileHandleFromUrl(): string | null {
  // 1. Path format: /@username
  const pathMatch = window.location.pathname.match(/^\/@([a-zA-Z0-9_.-]+)/i);
  if (pathMatch && pathMatch[1]) {
    return decodeURIComponent(pathMatch[1]);
  }
  // 2. Hash format: #@username
  const hashMatch = window.location.hash.match(/^#@([a-zA-Z0-9_.-]+)/i);
  if (hashMatch && hashMatch[1]) {
    return decodeURIComponent(hashMatch[1]);
  }
  // 3. Query param format: ?u=username or ?user=username
  const searchParams = new URLSearchParams(window.location.search);
  const userParam = searchParams.get('u') || searchParams.get('user');
  if (userParam) {
    return userParam.replace(/^@/, '');
  }
  return null;
}

function getHashRoomId(): string | null {
  const hash = window.location.hash.replace(/^#/, '').trim();
  if (!hash || hash.startsWith('admin') || hash.startsWith('@') || hash.startsWith('line')) {
    return null;
  }
  // Check if legacy #room=xxxx format
  const legacyMatch = hash.match(/room=([a-zA-Z0-9_-]+)/);
  if (legacyMatch && legacyMatch[1]) {
    return legacyMatch[1];
  }
  // Clean hash format: e.g. #chill or #m7x8k2
  const cleanMatch = hash.match(/^([a-zA-Z0-9_-]+)/);
  return cleanMatch && cleanMatch[1] ? cleanMatch[1] : null;
}

export function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => isAdminPath());
  const [isLineStudioRoute, setIsLineStudioRoute] = useState<boolean>(() => isLineStudioPath());
  const [profileHandleRoute, setProfileHandleRoute] = useState<string | null>(() => getProfileHandleFromUrl());

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(isAdminPath());
      setIsLineStudioRoute(isLineStudioPath());
      setProfileHandleRoute(getProfileHandleFromUrl());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const initialRoom = getHashRoomId();
  const [currentView, setCurrentView] = useState<'home' | 'room'>(initialRoom ? 'room' : 'home');
  const [roomId, setRoomId] = useState<string>(initialRoom || 'squad-chill');
  const [isStealthInspection, setIsStealthInspection] = useState<boolean>(false);
  const isStealthInspectionRef = useRef(isStealthInspection);
  isStealthInspectionRef.current = isStealthInspection;
  const [currentUser, setCurrentUser] = useState<UserProfile>(getStoredUser);
  const [onlineCount, setOnlineCount] = useState<number>(1);

  // Home Directory Rooms
  const [roomsList, setRoomsList] = useState<RoomSummary[]>([]);

  // Room Metadata & Members
  const [roomMetadata, setRoomMetadata] = useState<RoomMetadata>({
    id: 'squad-chill',
    name: 'Squad Chill & Lofi Beats 🎵',
    description: 'ห้องปาร์ตี้หลัก ฟังเพลงชิลล์ๆ คุยงานและเล่นเกม',
    ownerId: '',
    ownerName: '',
    isPrivate: false,
    hasPassword: false,
    onlyAdminManagePlaylist: false,
    stageAccessMode: 'everyone',
    createdAt: Date.now(),
  });
  const [members, setMembers] = useState<RoomMember[]>([]);
  const uniqueMembers = React.useMemo(() => {
    const seen = new Set<string>();
    const list: RoomMember[] = [];
    for (const m of members) {
      if (m.user?.id && !seen.has(m.user.id)) {
        seen.add(m.user.id);
        list.push(m);
      }
    }
    return list;
  }, [members]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [myRole, setMyRole] = useState<UserRole>('member');
  const [gameState, setGameState] = useState<DrawAndGuessGameState | null>(null);

  // Password Gate
  const [isPasswordGateOpen, setIsPasswordGateOpen] = useState(false);
  const [passwordGateRoomName, setPasswordGateRoomName] = useState('');
  const [passwordGateError, setPasswordGateError] = useState<string | null>(null);
  const [pendingPrivateRoomId, setPendingPrivateRoomId] = useState<string | null>(null);

  // Room Audio & Video State
  const [seats, setSeats] = useState<StageSeat[]>(
    Array.from({ length: 9 }, (_, i) => ({
      seatNumber: i + 1,
      user: null,
      isMuted: false,
      isSpeaking: false,
    }))
  );
  const [video, setVideo] = useState<VideoState>({
    videoId: '',
    title: '',
    channel: '',
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    lastUpdated: Date.now(),
  });
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [loopMode, setLoopMode] = useState<LoopMode>('all');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [pendingStageRequests, setPendingStageRequests] = useState<StageRequest[]>([]);
  const [approvedSpeakerIds, setApprovedSpeakerIds] = useState<string[]>([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'queue' | 'chat' | 'members'>('queue');
  const [activeMobileTab, setActiveMobileTab] = useState<'voice' | 'queue' | 'chat' | 'members'>('voice');
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [quickUrlText, setQuickUrlText] = useState('');

  // Playback Progress & Timeline State (Scrubber & Time Display)
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubValue, setScrubValue] = useState<number>(0);

  // Time formatter: mm.ss or hh:mm:ss
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0.00';
    const totalSec = Math.floor(seconds);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${mins}.${pad(secs)}`;
  };

  // Global Platform Config & Announcements
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({ ...DEFAULT_PLATFORM_CONFIG });

  useEffect(() => {
    fetch('/api/platform/config')
      .then((res) => res.json())
      .then((data) => {
        if (data) setPlatformConfig(data);
      })
      .catch(() => {});
  }, []);

  // Widget Toggles Evaluation (Inherits from Global & Room level)
  const isVoiceStageEnabled =
    platformConfig.globalWidgets?.enableVoiceStage !== false &&
    roomMetadata.widgets?.enableVoiceStage !== false;

  const isChatEnabled =
    platformConfig.globalWidgets?.enableChat !== false &&
    roomMetadata.widgets?.enableChat !== false;

  const isQueueEnabled = roomMetadata.widgets?.enableQueue !== false;

  const isReactionsEnabled =
    platformConfig.globalWidgets?.enableSoundboard !== false &&
    roomMetadata.widgets?.enableReactions !== false;

  // Auto-switch tabs if currently selected tab is disabled
  useEffect(() => {
    if (!isVoiceStageEnabled && activeMobileTab === 'voice') {
      setActiveMobileTab(isQueueEnabled ? 'queue' : isChatEnabled ? 'chat' : 'members');
    }
  }, [isVoiceStageEnabled, activeMobileTab, isQueueEnabled, isChatEnabled]);

  useEffect(() => {
    if (!isChatEnabled) {
      if (activeMobileTab === 'chat') setActiveMobileTab(isQueueEnabled ? 'queue' : 'members');
      if (activeSidebarTab === 'chat') setActiveSidebarTab(isQueueEnabled ? 'queue' : 'members');
    }
  }, [isChatEnabled, activeMobileTab, activeSidebarTab, isQueueEnabled]);

  useEffect(() => {
    if (!isQueueEnabled) {
      if (activeMobileTab === 'queue') setActiveMobileTab(isChatEnabled ? 'chat' : 'members');
      if (activeSidebarTab === 'queue') setActiveSidebarTab(isChatEnabled ? 'chat' : 'members');
    }
  }, [isQueueEnabled, isChatEnabled, activeMobileTab, activeSidebarTab]);

  // Tab and View refs to avoid stale closures in socket listener
  const activeSidebarTabRef = useRef(activeSidebarTab);
  const activeMobileTabRef = useRef(activeMobileTab);
  const currentViewRef = useRef(currentView);

  useEffect(() => {
    activeSidebarTabRef.current = activeSidebarTab;
    if (activeSidebarTab === 'chat') {
      setUnreadChatCount(0);
    }
  }, [activeSidebarTab]);

  useEffect(() => {
    activeMobileTabRef.current = activeMobileTab;
    if (activeMobileTab === 'chat') {
      setUnreadChatCount(0);
    }
  }, [activeMobileTab]);

  useEffect(() => {
    currentViewRef.current = currentView;
    if (currentView !== 'room') {
      setUnreadChatCount(0);
    }
  }, [currentView]);

  // Sync unread chat count to page title
  useEffect(() => {
    if (unreadChatCount > 0) {
      document.title = `(${unreadChatCount}) pleng.online – แชทใหม่`;
    } else {
      document.title = 'pleng.online – ฟังเพลง ดูคลิป คุยไมค์สดไปด้วยกัน';
    }
  }, [unreadChatCount]);

  // Clear unread count when user focuses back to the window if chat is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const isDesktop = window.innerWidth >= 1024;
        const isViewingChat = isDesktop
          ? activeSidebarTabRef.current === 'chat'
          : activeMobileTabRef.current === 'chat';
        if (isViewingChat) {
          setUnreadChatCount(0);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  // Modals State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'member' | 'admin'>('member');
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<UserProfile | null>(null);
  const [isUserCardModalOpen, setIsUserCardModalOpen] = useState(false);
  const [selectedUserForCard, setSelectedUserForCard] = useState<UserProfile | null>(null);
  const [isVideoFavorite, setIsVideoFavorite] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isKaraokeModalOpen, setIsKaraokeModalOpen] = useState(false);
  const [isAudioDuckingEnabled, setIsAudioDuckingEnabled] = useState(true);

  // Super Admin & Support State
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    return localStorage.getItem('watchparty_superadmin') === 'true' || currentUser.id === 'usr-admin-system';
  });
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [isSuperAdminUnlockModalOpen, setIsSuperAdminUnlockModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Interactive Reactions & Gifts
  const [reactions, setReactions] = useState<FloatingItem[]>([]);
  const [activeGifts, setActiveGifts] = useState<GiftEvent[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // QoL: Sleep Timer & PWA & Share Card & APK Install & Live TV
  const [isLiveTVModalOpen, setIsLiveTVModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isShareCardModalOpen, setIsShareCardModalOpen] = useState(false);
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState(false);
  const [sleepTimerSecondsLeft, setSleepTimerSecondsLeft] = useState<number | null>(null);
  const [sleepTimerStopAtEnd, setSleepTimerStopAtEnd] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  const isSomeoneSpeaking = seats.some((s) => s.isSpeaking && !s.isMuted);

  // Listen for PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) {
      showToast('แอปพร้อมใช้งานผ่านเบราว์เซอร์แล้ว หรือเปิดเมนูตัวเลือกเพื่อ "เพิ่มลงหน้าจอหลัก"', 'info');
      return;
    }
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      showToast('กำลังติดตั้งแอป pleng.online 🎉', 'success');
      setDeferredInstallPrompt(null);
    }
  };

  // Sleep Timer Countdown Effect
  useEffect(() => {
    if (sleepTimerSecondsLeft === null || sleepTimerSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSleepTimerSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleVideoPause(video.currentTime || 0, video.duration);
          showToast('ตัวตั้งเวลาปิดเพลงทำงานแล้ว 🌙 ราตรีสวัสดิ์ครับ', 'info');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerSecondsLeft, video.currentTime, video.duration]);

  // WebRTC engine reference
  const webrtcRef = useRef<WebRTCVoiceEngine | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setToasts((prev) => {
      // Prevent duplicate toasts with the exact same message
      if (prev.some((t) => t.message === message)) return prev;
      // Cap at maximum 3 visible toasts to prevent cluttering the screen
      const trimmed = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
      const id = 't-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      return [...trimmed, { id, message, type }];
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch Public Rooms list for Home Lobby
  const fetchPublicRooms = useCallback(() => {
    fetch('/api/rooms')
      .then((res) => res.json())
      .then((data: RoomSummary[]) => {
        setRoomsList(data);
      })
      .catch((err) => {
        console.warn('Failed to fetch rooms list:', err);
      });
  }, []);

  useEffect(() => {
    fetchPublicRooms();
  }, [fetchPublicRooms]);

  // Sync Supabase OAuth session (Google / Facebook)
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      const handleSupabaseSession = async (sbUser: any) => {
        const provider = (sbUser.app_metadata?.provider as any) || 'google';
        const meta = sbUser.user_metadata || {};
        const email = sbUser.email || '';
        const name = meta.full_name || meta.name || email.split('@')[0] || 'Music Lover';
        const avatar =
          meta.avatar_url || meta.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${sbUser.id}`;

        const existing = await fetchProfile(sbUser.id, sbUser.id);
        if (existing) {
          setCurrentUser(existing);
          saveUser(existing);
        } else {
          const newUser: UserProfile = {
            id: sbUser.id,
            name,
            username: email
              ? email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
              : `user_${sbUser.id.slice(0, 5)}`,
            email,
            avatar,
            color: '#ec4899',
            bannerUrl:
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
            provider,
            bio: 'เพลิดเพลินกับเสียงดนตรีบน pleng.online 🎧',
            favoriteGenres: ['Lofi', 'Pop', 'Acoustic'],
            followersCount: 0,
            followingCount: 0,
          };
          setCurrentUser(newUser);
          saveUser(newUser);
        }
      };

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleSupabaseSession(session.user);
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await handleSupabaseSession(session.user);
          if (event === 'SIGNED_IN') {
            showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับสู่ pleng.online 🎵', 'success');
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [showToast]);

  // Synchronize latest user profile, avatar, xp & level across devices
  useEffect(() => {
    if (!currentUser?.id) return;

    const refreshMyProfile = async () => {
      try {
        const query = `?currentUserId=${encodeURIComponent(currentUser.id)}`;
        const res = await fetch(`/api/users/profile/${encodeURIComponent(currentUser.id)}${query}`);
        if (res.ok) {
          const fresh = await res.json();
          if (fresh && fresh.id) {
            setCurrentUser((prev) => {
              const hasAvatarDiff = fresh.avatar && fresh.avatar !== prev.avatar;
              const hasLevelDiff = typeof fresh.level === 'number' && fresh.level !== prev.level;
              const hasXpDiff = typeof fresh.xp === 'number' && fresh.xp !== prev.xp;
              const hasNameDiff = fresh.name && fresh.name !== prev.name;
              const hasColorDiff = fresh.color && fresh.color !== prev.color;

              if (hasAvatarDiff || hasLevelDiff || hasXpDiff || hasNameDiff || hasColorDiff) {
                const updated: UserProfile = {
                  ...prev,
                  ...fresh,
                  avatar: fresh.avatar || prev.avatar,
                  xp: Math.max(prev.xp || 0, fresh.xp || 0),
                  level: Math.max(prev.level || 1, fresh.level || 1),
                  listeningTimeMinutes: Math.max(prev.listeningTimeMinutes || 0, fresh.listeningTimeMinutes || 0),
                };
                saveUser(updated);
                return updated;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // silent
      }
    };

    refreshMyProfile();

    const handleFocus = () => {
      refreshMyProfile();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser?.id]);

  // Check if current video is in favorites
  useEffect(() => {
    if (!video.videoId) {
      setIsVideoFavorite(false);
      return;
    }
    checkIsFavorite(currentUser.id, video.videoId).then((fav) => {
      setIsVideoFavorite(fav);
    });
  }, [video.videoId, currentUser.id]);

  // Toggle Favorite handler
  const handleToggleFavoriteCurrentSong = useCallback(async () => {
    if (!video.videoId) return;

    if (isVideoFavorite) {
      await removeFavorite(currentUser.id, video.videoId);
      setIsVideoFavorite(false);
      showToast('ลบเพลงนี้ออกจากคลังเพลงโปรดแล้ว', 'info');
    } else {
      await addFavorite(currentUser.id, {
        videoId: video.videoId,
        title: video.title,
        channel: video.channel,
      });
      setIsVideoFavorite(true);
      showToast('บันทึกเพลงนี้ลงในคลังเพลงโปรดของคุณแล้ว ❤️', 'success');
    }
  }, [video.videoId, video.title, video.channel, currentUser.id, isVideoFavorite, showToast]);

  // Favorite Rooms State
  const [favoriteRoomIds, setFavoriteRoomIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`fav_rooms_${currentUser.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const handleToggleFavoriteCurrentRoom = useCallback(() => {
    if (!roomId) return;
    setFavoriteRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
        showToast('เลิกติดตามห้องนี้แล้ว', 'info');
      } else {
        next.add(roomId);
        showToast('บันทึกเป็นห้องโปรดของคุณแล้ว ⭐', 'success');
      }
      localStorage.setItem(`fav_rooms_${currentUser.id}`, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [roomId, currentUser.id, showToast]);

  // Active Listening XP & Level Tracker (Category 4 Gamification)
  useEffect(() => {
    if (currentView !== 'room') return;

    // Every 60 seconds of listening to music in a room
    const xpTimer = setInterval(() => {
      setCurrentUser((prev) => {
        const prevMins = prev.listeningTimeMinutes || 0;
        const prevXp = prev.xp || 0;
        const newMins = prevMins + 1;
        const newXp = prevXp + 10; // +10 XP per minute
        const newLevel = Math.floor(Math.sqrt(newXp / 25)) + 1;

        const prevLevel = prev.level || Math.floor(Math.sqrt(prevXp / 25)) + 1;
        if (newLevel > prevLevel) {
          showToast(`🎉 เลเวลอัป! คุณได้เลื่อนขั้นเป็น Lv.${newLevel} แล้ว!`, 'success');
        }

        const updated: UserProfile = {
          ...prev,
          listeningTimeMinutes: newMins,
          xp: newXp,
          level: newLevel,
        };

        saveUser(updated);

        // Sync to server via WebSocket
        socketService.send({
          type: 'UPDATE_PROFILE',
          user: updated,
        });

        // Sync to server via REST
        fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: updated.id,
            xp: newXp,
            level: newLevel,
            listeningTimeMinutes: newMins,
          }),
        }).catch(() => {});

        return updated;
      });
    }, 60000);

    return () => clearInterval(xpTimer);
  }, [currentView, showToast]);

  // Refresh Room & Pull-to-Refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const isPullingRef = useRef(false);
  const syncRoomStateRef = useRef<(targetRoomId: string, providedPassword?: string) => void>(() => {});

  // Unified Refresh (Home Lobby or Room) - Silent refresh without noisy popups
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    if (currentView === 'home') {
      fetchPublicRooms();
      socketService.send({ type: 'GET_ROOMS' });

      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    } else {
      const currentRoom = roomId || getHashRoomId();
      if (currentRoom) {
        const savedPwd = sessionStorage.getItem(`room_pwd_${currentRoom}`) || undefined;
        socketService.send({
          type: 'JOIN_ROOM',
          roomId: currentRoom,
          user: currentUser,
          password: savedPwd,
          isStealth: isStealthInspectionRef.current,
        });
        syncRoomStateRef.current(currentRoom, savedPwd);
      }
      fetchPublicRooms();

      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  }, [isRefreshing, currentView, roomId, currentUser, fetchPublicRooms]);

  // Pull-to-refresh listener on touch devices (Supported on Home view only - disabled inside rooms to avoid accidental reload when scrolling chat)
  useEffect(() => {
    if (currentView !== 'home') return;

    const handleTouchStart = (e: TouchEvent) => {
      if (currentView !== 'home' || e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartYRef.current = touch.clientY;
      touchStartXRef.current = touch.clientX;
      isPullingRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (currentView !== 'home' || e.touches.length !== 1 || isRefreshing) return;
      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartYRef.current;
      const deltaX = touch.clientX - touchStartXRef.current;

      // Ignore if touching inside form inputs, buttons, or designated non-refresh areas
      let target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, [data-no-pull-refresh], #live-chat-messages, [data-chat-scroll]')) return;

      // Detect downward drag when page is scrolled to top
      if (deltaY > 15 && deltaY > Math.abs(deltaX) * 1.2) {
        let isInnerScrolled = false;
        while (target && target !== document.body) {
          if (target.scrollTop > 5) {
            isInnerScrolled = true;
            break;
          }
          target = target.parentElement;
        }
        if (isInnerScrolled) return;

        const homeEl = document.getElementById('home-view-scroll');
        const currentScrollTop = homeEl ? homeEl.scrollTop : window.scrollY || 0;

        if (currentScrollTop <= 5) {
          isPullingRef.current = true;
          const distance = Math.min(85, (deltaY - 15) * 0.45);
          setPullDistance(distance);
        }
      }
    };

    const handleTouchEnd = () => {
      if (currentView !== 'home') {
        isPullingRef.current = false;
        setPullDistance(0);
        return;
      }
      if (isPullingRef.current) {
        if (pullDistance >= 50) {
          handleRefresh();
        }
        setPullDistance(0);
        isPullingRef.current = false;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isRefreshing, pullDistance, handleRefresh, currentView]);

  // OLED Sleep Mode state (โหมดพักหน้าจอประหยัดแบตเตอรี่)
  const [isOledSleepMode, setIsOledSleepMode] = useState(false);
  const [oledTimeStr, setOledTimeStr] = useState('');

  useEffect(() => {
    if (!isOledSleepMode) return;
    const updateTime = () => {
      const now = new Date();
      setOledTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Keep screen from turning off while in OLED mode
    let wakeLock: any = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock?.request('screen').then((lock: any) => {
        wakeLock = lock;
      }).catch(() => {});
    }

    return () => {
      clearInterval(interval);
      wakeLock?.release().catch(() => {});
    };
  }, [isOledSleepMode]);

  // WebRTC Signal Sender
  const sendWebRTCSignal = useCallback((targetId: string, data: any) => {
    socketService.send({
      type: 'SIGNAL_DATA',
      targetId,
      data,
    });
  }, []);

  // Initialize WebRTC engine
  useEffect(() => {
    webrtcRef.current = new WebRTCVoiceEngine(currentUser.id, sendWebRTCSignal);
    return () => {
      webrtcRef.current?.destroy();
      webrtcRef.current = null;
    };
  }, [currentUser.id, sendWebRTCSignal]);

  // Connect to all seated stage speakers so both seated members and audience can hear them
  useEffect(() => {
    if (!webrtcRef.current) return;

    const mySeat = seats.find((s) => s.user?.id === currentUser.id);
    const seatedSpeakers = seats.filter((s) => s.user && s.user.id !== currentUser.id);
    const seatedSpeakerIds = new Set(seatedSpeakers.map((s) => s.user!.id));

    seatedSpeakers.forEach((seat) => {
      if (seat.user) {
        // If both are seated: user with smaller ID initiates
        // If local user is audience listener: listener initiates to request audio from speaker
        const isInitiator = mySeat ? currentUser.id < seat.user.id : true;
        webrtcRef.current?.connectToPeer(seat.user.id, isInitiator);
      }
    });

    // Clean up peer connections to people who are no longer on stage
    webrtcRef.current?.cleanupPeersExcept(seatedSpeakerIds);
  }, [seats, currentUser.id]);

  // Keep latest state in refs for persistent WebSocket listener
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;
  currentViewRef.current = currentView;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const roomsListRef = useRef(roomsList);
  roomsListRef.current = roomsList;

  // Instant Room State Sync via REST API (Dual-Channel with WebSocket)
  const syncRoomState = useCallback((targetRoomId: string, providedPassword?: string) => {
    const pwd = providedPassword || sessionStorage.getItem(`room_pwd_${targetRoomId}`) || undefined;
    const queryParams = new URLSearchParams();
    if (currentUserRef.current?.id) {
      queryParams.set('userId', currentUserRef.current.id);
    }
    if (pwd) {
      queryParams.set('password', pwd);
    }
    if (isStealthInspectionRef.current) {
      queryParams.set('isStealth', 'true');
    }

    fetch(`/api/room/${targetRoomId}?${queryParams.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((state: RoomState & { requiresPassword?: boolean }) => {
        if (state.requiresPassword) {
          sessionStorage.removeItem(`room_pwd_${targetRoomId}`);
          setPendingPrivateRoomId(targetRoomId);
          setPasswordGateRoomName(state.metadata?.name || 'ห้องส่วนตัว');
          setPasswordGateError(null);
          setIsPasswordGateOpen(true);
          setCurrentView('home');
          setVideo({
            videoId: '',
            title: '',
            channel: '',
            duration: 0,
            currentTime: 0,
            isPlaying: false,
            lastUpdated: Date.now(),
          });
          setPlaylist([]);
          setChat([]);
          setMembers([]);
          return;
        }

        if (state && (state.roomId === targetRoomId || !state.roomId)) {
          setIsPasswordGateOpen(false);
          setPasswordGateError(null);
          setPendingPrivateRoomId(null);
          if (state.metadata) setRoomMetadata(state.metadata);
          if (state.seats) setSeats(state.seats);
          if (state.video) setVideo(state.video);
          if (state.playlist) setPlaylist(state.playlist);
          if (state.loopMode) setLoopMode(state.loopMode);
          if (state.isShuffle !== undefined) setIsShuffle(state.isShuffle);
          if (state.chat) setChat(state.chat);
          if (state.members) {
            const rawMembers = state.members || [];
            const dedupedMembers: RoomMember[] = [];
            const seenMemberIds = new Set<string>();
            for (const m of rawMembers) {
              if (m.user?.id && !seenMemberIds.has(m.user.id)) {
                seenMemberIds.add(m.user.id);
                dedupedMembers.push(m);
              }
            }
            setMembers(dedupedMembers);
            setOnlineCount(state.onlineCount || dedupedMembers.length);
          }
          if (state.bannedUsers) setBannedUsers(state.bannedUsers);
          if (state.myRole) setMyRole(state.myRole);
          if (state.approvedSpeakerIds) setApprovedSpeakerIds(state.approvedSpeakerIds);
          if (state.pendingStageRequests) setPendingStageRequests(state.pendingStageRequests);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch room state via REST:', err);
      });
  }, []);
  syncRoomStateRef.current = syncRoomState;

  // Handle URL Hash change (Room vs Home)
  useEffect(() => {
    const handleHashChange = () => {
      const targetRoom = getHashRoomId();
      if (targetRoom) {
        const roomMeta = roomsListRef.current?.find((r) => r.id === targetRoom);
        const isPrivate = roomMeta?.isPrivate || roomMeta?.hasPassword;
        const isMine = roomMeta?.ownerId === currentUserRef.current.id;
        const savedPwd = sessionStorage.getItem(`room_pwd_${targetRoom}`) || undefined;

        if (!isStealthInspectionRef.current && !isMine && isPrivate && !savedPwd) {
          setPendingPrivateRoomId(targetRoom);
          setPasswordGateRoomName(roomMeta?.name || 'ห้องส่วนตัว');
          setPasswordGateError(null);
          setIsPasswordGateOpen(true);
          setCurrentView('home');
          return;
        }

        setRoomId(targetRoom);
        setCurrentView('room');
        syncRoomState(targetRoom, savedPwd);
        socketService.send({
          type: 'JOIN_ROOM',
          roomId: targetRoom,
          user: currentUserRef.current,
          password: savedPwd,
          isStealth: isStealthInspectionRef.current,
        });
      } else {
        const prevRoom = roomIdRef.current;
        if (prevRoom) {
          sessionStorage.removeItem(`room_pwd_${prevRoom}`);
        }
        socketService.send({ type: 'LEAVE_ROOM' });
        setChat([]);
        setMembers([]);
        setPlaylist([]);
        setCurrentView('home');
        fetchPublicRooms();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [fetchPublicRooms, syncRoomState]);

  // Setup WebSocket connection and event handlers (Mounted persistently with NO drops)
  useEffect(() => {
    const unregisterOnConnect = socketService.registerOnConnect(() => {
      const activeRoom = getHashRoomId() || (currentViewRef.current === 'room' ? roomIdRef.current : null);
      if (activeRoom) {
        const savedPwd = sessionStorage.getItem(`room_pwd_${activeRoom}`) || undefined;
        socketService.send({
          type: 'JOIN_ROOM',
          roomId: activeRoom,
          user: currentUserRef.current,
          password: savedPwd,
          isStealth: isStealthInspectionRef.current,
        });
        syncRoomState(activeRoom, savedPwd);
      } else {
        socketService.send({ type: 'GET_ROOMS' });
      }
    });

    socketService.connect();

    // Immediate initial sync if starting directly inside a room
    const initialHashRoom = getHashRoomId();
    if (initialHashRoom) {
      const savedPwd = sessionStorage.getItem(`room_pwd_${initialHashRoom}`) || undefined;
      syncRoomState(initialHashRoom, savedPwd);
    }

    const unsubscribe = socketService.subscribe((msg: WSServerMessage) => {
      switch (msg.type) {
        case 'ROOMS_LIST':
          setRoomsList(msg.rooms);
          break;

        case 'PASSWORD_REQUIRED': {
          const savedPwd = sessionStorage.getItem(`room_pwd_${msg.roomId}`);
          if (savedPwd) {
            socketService.send({
              type: 'VERIFY_ROOM_PASSWORD',
              roomId: msg.roomId,
              password: savedPwd,
              user: currentUserRef.current,
            });
            break;
          }
          setIsPasswordGateOpen(true);
          setPasswordGateRoomName(msg.roomName);
          setPasswordGateError(null);
          setPendingPrivateRoomId(msg.roomId);
          setCurrentView('home');
          setVideo({
            videoId: '',
            title: '',
            channel: '',
            duration: 0,
            currentTime: 0,
            isPlaying: false,
            lastUpdated: Date.now(),
          });
          setPlaylist([]);
          setChat([]);
          setMembers([]);
          break;
        }

        case 'PASSWORD_ERROR':
          if (pendingPrivateRoomId) {
            sessionStorage.removeItem(`room_pwd_${pendingPrivateRoomId}`);
          }
          if (roomId) {
            sessionStorage.removeItem(`room_pwd_${roomId}`);
          }
          setPasswordGateError(msg.message);
          setIsPasswordGateOpen(true);
          break;

        case 'YOU_WERE_KICKED':
          if (roomId) sessionStorage.removeItem(`room_pwd_${roomId}`);
          showToast(msg.reason, 'warning');
          setChat([]);
          setIsPasswordGateOpen(false);
          setIsAdminPanelOpen(false);
          window.location.hash = '';
          setCurrentView('home');
          fetchPublicRooms();
          break;

        case 'YOU_WERE_BANNED':
          if (roomId) sessionStorage.removeItem(`room_pwd_${roomId}`);
          showToast(msg.reason, 'warning');
          setChat([]);
          setIsPasswordGateOpen(false);
          setIsAdminPanelOpen(false);
          window.location.hash = '';
          setCurrentView('home');
          fetchPublicRooms();
          break;

        case 'YOU_WERE_SUSPENDED':
          if (roomId) sessionStorage.removeItem(`room_pwd_${roomId}`);
          showToast(msg.reason, 'warning');
          setChat([]);
          setIsPasswordGateOpen(false);
          setIsAdminPanelOpen(false);
          setIsSuperAdminModalOpen(false);
          window.location.hash = '';
          setCurrentView('home');
          fetchPublicRooms();
          break;

        case 'ROOM_FORCE_CLOSED':
          if (roomId) sessionStorage.removeItem(`room_pwd_${roomId}`);
          showToast(msg.reason, 'warning');
          setChat([]);
          setIsPasswordGateOpen(false);
          setIsAdminPanelOpen(false);
          window.location.hash = '';
          setCurrentView('home');
          fetchPublicRooms();
          break;

        case 'ROOM_INIT': {
          setIsPasswordGateOpen(false);
          setPasswordGateError(null);
          setPendingPrivateRoomId(null);
          if (msg.state.roomId) {
            setRoomId(msg.state.roomId);
            window.location.hash = `#${msg.state.roomId}`;
          }
          setCurrentView('room');
          setRoomMetadata(msg.state.metadata);
          setSeats(msg.state.seats);
          setVideo(msg.state.video);
          setPlaylist(msg.state.playlist);
          setLoopMode(msg.state.loopMode);
          setIsShuffle(msg.state.isShuffle ?? false);
          setChat(msg.state.chat);
          const rawMembers = msg.state.members || [];
          const dedupedMembers: RoomMember[] = [];
          const seenMemberIds = new Set<string>();
          for (const m of rawMembers) {
            if (m.user?.id && !seenMemberIds.has(m.user.id)) {
              seenMemberIds.add(m.user.id);
              dedupedMembers.push(m);
            }
          }
          setMembers(dedupedMembers);
          setOnlineCount(msg.state.onlineCount || dedupedMembers.length);
          setBannedUsers(msg.state.bannedUsers);
          setMyRole(msg.state.myRole);
          setGameState(msg.state.gameState || null);
          setUnreadChatCount(0);
          if (msg.state.approvedSpeakerIds) {
            setApprovedSpeakerIds(msg.state.approvedSpeakerIds);
          }
          if (msg.state.pendingStageRequests) {
            setPendingStageRequests(msg.state.pendingStageRequests);
          }
          if (msg.user) {
            const serverUser = msg.user;
            setCurrentUser((prev) => {
              const updated = {
                ...prev,
                ...serverUser,
                avatar: serverUser.avatar || prev.avatar,
                xp: Math.max(prev.xp || 0, serverUser.xp || 0),
                level: Math.max(prev.level || 1, serverUser.level || 1),
                listeningTimeMinutes: Math.max(prev.listeningTimeMinutes || 0, serverUser.listeningTimeMinutes || 0),
              };
              saveUser(updated);
              return updated;
            });
          }
          break;
        }

        case 'STAGE_REQUESTS_UPDATED': {
          const nextMode = msg.stageAccessMode;
          if (nextMode) {
            setRoomMetadata((prev) => ({ ...prev, stageAccessMode: nextMode }));
          }
          setApprovedSpeakerIds(msg.approvedSpeakerIds);
          setPendingStageRequests(msg.pendingRequests);
          break;
        }

        case 'ROOM_METADATA_UPDATED':
          setRoomMetadata(msg.metadata);
          break;

        case 'MEMBERS_UPDATED': {
          const rawMembers = msg.members || [];
          const dedupedMembers: RoomMember[] = [];
          const seenMemberIds = new Set<string>();
          for (const m of rawMembers) {
            if (m.user?.id && !seenMemberIds.has(m.user.id)) {
              seenMemberIds.add(m.user.id);
              dedupedMembers.push(m);
            }
          }
          setMembers(dedupedMembers);
          setOnlineCount(msg.onlineCount || dedupedMembers.length);
          // Re-evaluate my role
          const me = dedupedMembers.find((m) => m.user.id === currentUser.id);
          if (me) {
            setMyRole(me.role);
          }
          break;
        }

        case 'USER_JOINED':
          setOnlineCount(msg.onlineCount);
          showToast(`${msg.user.name} เข้าร่วมห้องแล้ว 👋`, 'info');
          break;

        case 'USER_LEFT':
          setOnlineCount(msg.onlineCount);
          webrtcRef.current?.cleanupPeer(msg.userId);
          break;

        case 'SEATS_UPDATED':
          setSeats(msg.seats);
          break;

        case 'VIDEO_SYNC':
          setVideo(msg.video);
          if (msg.triggeredByName && msg.actionType) {
            // Ignore generic change toast (since SYNC_TOAST handles song titles)
            if (msg.actionType !== 'change') {
              // Only notify when someone else in the room triggers play/pause/seek
              if (msg.triggeredByName !== currentUser.name) {
                const actionText: Record<string, string> = {
                  play: 'กดเล่นวิดีโอ ▶️',
                  pause: 'กดพักวิดีโอ ⏸️',
                  seek: 'เลื่อนแถบเวลา ⏩',
                };
                const text = actionText[msg.actionType];
                if (text) {
                  showToast(`${msg.triggeredByName} ${text}`, 'info');
                }
              }
            }
          }
          break;

        case 'PLAYLIST_UPDATED':
          setPlaylist(msg.playlist);
          setLoopMode(msg.loopMode);
          setIsShuffle(msg.isShuffle ?? false);
          break;

        case 'NEW_CHAT':
          setChat((prev) => {
            const isDuplicate = prev.some(
              (m) =>
                m.id === msg.message.id ||
                (m.id.startsWith('msg-opt-') &&
                  m.sender?.id === msg.message.sender?.id &&
                  m.text === msg.message.text &&
                  Math.abs(m.timestamp - msg.message.timestamp) < 5000)
            );
            if (isDuplicate) {
              return prev.map((m) =>
                m.id.startsWith('msg-opt-') &&
                m.sender?.id === msg.message.sender?.id &&
                m.text === msg.message.text &&
                Math.abs(m.timestamp - msg.message.timestamp) < 5000
                  ? msg.message
                  : m
              );
            }
            return [...prev, msg.message];
          });
          // Increment unread counter if message is from someone else and user is not currently in chat
          if (msg.message.sender.id !== currentUser.id) {
            const isDesktop = window.innerWidth >= 1024;
            const isViewingChat = isDesktop
              ? activeSidebarTabRef.current === 'chat'
              : activeMobileTabRef.current === 'chat';
            if (!isViewingChat || document.hidden) {
              setUnreadChatCount((prev) => prev + 1);
            }
          }
          break;

        case 'CHAT_MESSAGE_DELETED':
          setChat((prev) => prev.filter((m) => m.id !== msg.messageId));
          break;

        case 'CHAT_CLEARED':
          setChat(msg.chat || []);
          showToast('ล้างข้อความแชทในห้องเรียบร้อย 🧹', 'info');
          break;

        case 'EMOJI_REACTION': {
          const item: FloatingItem = {
            id: 'react-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            emoji: msg.emoji,
            senderName: msg.sender.name,
            senderColor: msg.sender.color,
            leftPercent: Math.floor(20 + Math.random() * 60),
          };
          setReactions((prev) => [...prev, item]);
          break;
        }

        case 'GIFT_BROADCAST': {
          const giftItem: GiftEvent = {
            id: 'gift-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            giftId: msg.giftId,
            giftName: msg.giftName,
            giftIcon: msg.giftIcon,
            senderName: msg.sender?.name || 'เพื่อนในห้อง',
            senderAvatar: msg.sender?.avatar,
            senderColor: msg.sender?.color,
          };
          setActiveGifts((prev) => [...prev.slice(-1), giftItem]);
          break;
        }

        case 'SIGNAL_DATA':
          webrtcRef.current?.handleSignal(msg.senderId, msg.data);
          break;

        case 'SYNC_TOAST':
          showToast(msg.message, msg.toastType);
          break;

        case 'PLATFORM_CONFIG_UPDATED':
          setPlatformConfig(msg.config);
          break;

        case 'SYSTEM_ANNOUNCEMENT':
          showToast(`📢 ${msg.text}`, msg.announcementType === 'alert' ? 'warning' : 'info');
          break;

        case 'GAME_STATE_UPDATED':
          setGameState(msg.state);
          break;

        case 'GAME_DRAW_STROKE':
          window.dispatchEvent(new CustomEvent('watchparty:game_stroke', { detail: msg.stroke }));
          break;

        case 'GAME_CLEAR_CANVAS':
          window.dispatchEvent(new CustomEvent('watchparty:game_clear_canvas'));
          break;

        case 'GAME_GUESSED_CORRECT':
          showToast(`🎉 ${msg.userName} ทายคำตอบถูกต้อง! (+${msg.points} คะแนน)`, 'success');
          break;

        default:
          break;
      }
    });

    return () => {
      unregisterOnConnect();
      unsubscribe();
    };
  }, [syncRoomState, showToast]);

  // Minimize Room (Keep connected, audio continues playing in background, dock to bottom-left)
  const handleMinimizeRoom = useCallback(() => {
    window.scrollTo(0, 0);
    setCurrentView('home');
    fetchPublicRooms();
    showToast('ย่อห้องปาร์ตี้ไว้ที่มุมล่างซ้ายแล้ว 🎵 แตะเพื่อเปิดกลับมาได้ตลอดเวลา', 'info');
  }, [fetchPublicRooms, showToast]);

  // Restore Room from Minimized Card
  const handleRestoreRoom = useCallback(() => {
    window.scrollTo(0, 0);
    setCurrentView('room');
  }, []);

  // Leave Room completely (Disconnect socket, stop audio, clear room state)
  const handleLeaveRoom = useCallback(() => {
    setIsPasswordGateOpen(false);
    setPasswordGateError(null);
    setPendingPrivateRoomId(null);
    setIsStealthInspection(false);
    const activeRoom = roomId || getHashRoomId();
    if (activeRoom) {
      sessionStorage.removeItem(`room_pwd_${activeRoom}`);
    }
    socketService.send({ type: 'LEAVE_ROOM' });
    setRoomId('');
    setChat([]);
    setGameState(null);
    setMembers([]);
    setPlaylist([]);
    setVideo({
      videoId: '',
      title: '',
      channel: '',
      duration: 0,
      currentTime: 0,
      isPlaying: false,
      lastUpdated: Date.now(),
    });
    window.scrollTo(0, 0);
    window.location.hash = '';
    setCurrentView('home');
    fetchPublicRooms();
    showToast('ออกจากห้องปาร์ตี้เรียบร้อย 👋', 'info');
  }, [roomId, fetchPublicRooms, showToast]);

  // Navigate actions (Tapping logo or Home)
  const handleNavigateHome = () => {
    if (currentView === 'room' || roomId) {
      handleMinimizeRoom();
    } else {
      window.scrollTo(0, 0);
      setCurrentView('home');
      fetchPublicRooms();
    }
  };

  const handleSelectRoom = (targetRoomId: string, isStealth: boolean = false) => {
    window.scrollTo(0, 0);
    if (targetRoomId === roomId) {
      handleRestoreRoom();
      return;
    }

    if (roomId && targetRoomId !== roomId) {
      const activeRoom = roomId || getHashRoomId();
      if (activeRoom) {
        sessionStorage.removeItem(`room_pwd_${activeRoom}`);
      }
      socketService.send({ type: 'LEAVE_ROOM' });
      setChat([]);
      setPlaylist([]);
    }

    const targetRoomSummary = roomsListRef.current?.find((r) => r.id === targetRoomId);
    const isPrivate = targetRoomSummary?.isPrivate || targetRoomSummary?.hasPassword;
    const isMine = targetRoomSummary?.ownerId === currentUserRef.current.id;
    const savedPwd = sessionStorage.getItem(`room_pwd_${targetRoomId}`) || undefined;

    if (!isStealth && !isMine && isPrivate && !savedPwd) {
      setPendingPrivateRoomId(targetRoomId);
      setPasswordGateRoomName(targetRoomSummary?.name || 'ห้องส่วนตัว');
      setPasswordGateError(null);
      setIsPasswordGateOpen(true);
      return;
    }

    window.scrollTo(0, 0);
    window.location.hash = `#${targetRoomId}`;
    setRoomId(targetRoomId);
    setIsStealthInspection(isStealth);
    setCurrentView('room');
    syncRoomState(targetRoomId, savedPwd);
    socketService.send({
      type: 'JOIN_ROOM',
      roomId: targetRoomId,
      user: currentUserRef.current,
      password: savedPwd,
      isStealth,
    });
  };

  // Auth actions
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    saveUser(user);
    if (user.isSuperAdmin || user.id === 'usr-admin-system') {
      setIsSuperAdmin(true);
      localStorage.setItem('watchparty_superadmin', 'true');
    }
    socketService.send({
      type: 'UPDATE_PROFILE',
      user,
    });
    showToast(`ยินดีต้อนรับคุณ ${user.name}! เข้าสู่ระบบสำเร็จ 🎉`, 'success');
  };

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('watchparty_superadmin');
    setIsSuperAdmin(false);
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.signOut();
    }
    const guestUser = getStoredUser();
    setCurrentUser(guestUser);
    socketService.send({
      type: 'UPDATE_PROFILE',
      user: guestUser,
    });
    showToast('ออกจากระบบเรียบร้อย เข้าสู่โหมด Guest', 'info');
  };

  // Create Room action
  const handleCreateRoom = async (form: CreateRoomForm) => {
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          user: currentUser,
        }),
      });
      const data = await res.json();
      if (data.success && data.roomId) {
        if (form.password) {
          sessionStorage.setItem(`room_pwd_${data.roomId}`, form.password);
        }
        showToast(`สร้างห้อง "${form.name}" สำเร็จ! 🎉`, 'success');
        handleSelectRoom(data.roomId);
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการสร้างห้อง', 'warning');
    }
  };

  // Password Gate submit
  const handlePasswordSubmit = (password: string) => {
    const targetId = pendingPrivateRoomId || roomId;
    if (!targetId) return;

    sessionStorage.setItem(`room_pwd_${targetId}`, password);

    // Send password verification via WebSocket. The server will respond with room join updates.
    socketService.send({
      type: 'VERIFY_ROOM_PASSWORD',
      roomId: targetId,
      password,
      user: currentUser,
    });

    // Also sync via REST so state is loaded instantly
    syncRoomState(targetId, password);
  };

  // Moderation actions
  const handleSetAdminRole = (targetUserId: string, role: 'admin' | 'member') => {
    socketService.send({
      type: 'SET_ADMIN_ROLE',
      targetUserId,
      role,
    });
  };

  const handleKickUser = (targetUserId: string) => {
    socketService.send({
      type: 'KICK_USER',
      targetUserId,
    });
  };

  const handleBanUser = (targetUserId: string) => {
    socketService.send({
      type: 'BAN_USER',
      targetUserId,
    });
  };

  const handleUnbanUser = (targetUserId: string) => {
    socketService.send({
      type: 'UNBAN_USER',
      targetUserId,
    });
  };

  const handleForceLeaveStage = (targetUserId: string) => {
    socketService.send({
      type: 'FORCE_LEAVE_STAGE',
      targetUserId,
    });
  };

  const handleUpdateRoomSettings = (settings: {
    name: string;
    description: string;
    isPrivate: boolean;
    password?: string;
    category?: RoomCategory;
    coverImage?: string;
    onlyAdminManagePlaylist: boolean;
    stageAccessMode?: StageAccessMode;
    widgets?: RoomWidgetsConfig;
    announcement?: string;
  }) => {
    socketService.send({
      type: 'UPDATE_ROOM_SETTINGS',
      settings,
    });
    showToast('บันทึกการตั้งค่าห้องเรียบร้อยแล้ว 🎉', 'success');
  };

  // Profile Save
  const handleSaveProfile = async (updated: UserProfile) => {
    setCurrentUser(updated);
    saveUser(updated);
    socketService.send({
      type: 'UPDATE_PROFILE',
      user: updated,
    });
    try {
      await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: updated.id, ...updated }),
      });
    } catch (e) {
      console.warn('Failed to sync profile to server:', e);
    }
    showToast('อัพเดทโปรไฟล์สำเร็จ!', 'success');
  };

  // Full Member & Profile System Handlers
  const handleOpenUserCard = useCallback((user: UserProfile) => {
    setSelectedUserForCard(user);
    setIsUserCardModalOpen(true);
  }, []);

  const handleViewFullProfile = useCallback((user: UserProfile) => {
    setSelectedUserForProfile(user);
    setIsUserProfileModalOpen(true);
  }, []);

  const handlePlaySongFromProfile = useCallback((videoId: string, title?: string, channel?: string) => {
    const targetRoom = roomId || 'squad-chill';
    window.location.hash = `#${targetRoom}`;
    setProfileHandleRoute(null);
    setCurrentView('room');
    handleSelectRoom(targetRoom);
    handleVideoChange(videoId, title, channel);
    setIsUserProfileModalOpen(false);
    showToast(`กำลังเปิดเพลง: ${title || videoId} 🎵`, 'success');
  }, [roomId, showToast]);

  // Stage speak request interactions
  const handleRequestToSpeak = (seatNumber?: number) => {
    if (isStealthInspection) {
      showToast('คุณอยู่ในโหมดล่องหน ไม่สามารถขอเปิดไมค์ขึ้นเวทีได้ 🔒', 'warning');
      return;
    }
    socketService.send({
      type: 'REQUEST_TO_SPEAK',
      seatNumber,
    });
  };

  const handleApproveSpeakRequest = (targetUserId: string, approved: boolean, seatNumber?: number) => {
    socketService.send({
      type: 'APPROVE_SPEAK_REQUEST',
      targetUserId,
      approved,
      seatNumber,
    });
  };

  const handleRevokeSpeakPermission = (targetUserId: string) => {
    socketService.send({
      type: 'REVOKE_SPEAK_PERMISSION',
      targetUserId,
    });
  };

  // Stage seat interactions
  const handleTakeSeat = (seatNumber: number) => {
    if (isStealthInspection) {
      showToast('คุณอยู่ในโหมดล่องหน ไม่สามารถขึ้นเวทีเปิดไมค์ได้ 🔒', 'warning');
      return;
    }
    // Optimistic UI update: immediately seat the user locally (0ms perceived latency)
    setSeats((prev) =>
      prev.map((s) => {
        if (s.seatNumber === seatNumber) {
          return {
            ...s,
            user: currentUser,
            isMuted: false,
            isSpeaking: false,
          };
        }
        if (s.user?.id === currentUser.id) {
          return {
            ...s,
            user: null,
            isSpeaking: false,
            isMuted: false,
          };
        }
        return s;
      })
    );

    socketService.send({
      type: 'TAKE_SEAT',
      seatNumber,
    });
  };

  const handleLeaveSeat = () => {
    // Optimistic UI update: immediately vacate the seat locally
    setSeats((prev) =>
      prev.map((s) =>
        s.user?.id === currentUser.id
          ? { ...s, user: null, isSpeaking: false, isMuted: false }
          : s
      )
    );

    socketService.send({
      type: 'LEAVE_SEAT',
    });
    webrtcRef.current?.setLocalStream(null);
  };

  const handleToggleMute = (isMuted: boolean) => {
    socketService.send({
      type: 'TOGGLE_MUTE',
      isMuted,
    });
  };

  const handleSpeakingState = (isSpeaking: boolean) => {
    // Optimistic local update so audio ducking triggers instantly without waiting for server roundtrip
    setSeats((prev) =>
      prev.map((s) => (s.user?.id === currentUser.id ? { ...s, isSpeaking } : s))
    );
    socketService.send({
      type: 'SPEAKING_STATE',
      isSpeaking,
    });
  };

  const handleVoiceVolumeChange = (vol: number) => {
    webrtcRef.current?.setIncomingVolume(vol);
  };

  const handleLocalStreamReady = (stream: MediaStream | null) => {
    webrtcRef.current?.setLocalStream(stream);
  };

  // Video player controls
  const handleVideoPlay = (currentTime: number, duration?: number) => {
    socketService.send({
      type: 'VIDEO_PLAY',
      currentTime,
      duration,
    });
  };

  const handleVideoPause = (currentTime: number, duration?: number) => {
    socketService.send({
      type: 'VIDEO_PAUSE',
      currentTime,
      duration,
    });
  };

  const handleVideoSeek = (currentTime: number, duration?: number) => {
    socketService.send({
      type: 'VIDEO_SEEK',
      currentTime,
      duration,
    });
  };

  const handleVideoChange = (videoId: string, title?: string, channel?: string) => {
    socketService.send({
      type: 'VIDEO_CHANGE',
      videoId,
      title,
      channel,
    });
  };

  const handlePlayLiveChannel = useCallback((liveChannel: LiveChannel) => {
    if (currentView === 'home') {
      window.scrollTo(0, 0);
      setCurrentView('room');
      const targetRoom = roomId || 'squad-chill';
      window.location.hash = `#${targetRoom}`;
      handleSelectRoom(targetRoom);
    }
    socketService.send({
      type: 'VIDEO_CHANGE',
      videoId: liveChannel.id,
      title: liveChannel.name,
      channel: liveChannel.countryName,
      duration: 0,
      isLive: true,
      streamUrl: liveChannel.streamUrl,
      thumbnail: liveChannel.logo,
    });
  }, [currentView, roomId]);

  const handleAddLiveChannelToQueue = useCallback((liveChannel: LiveChannel) => {
    socketService.send({
      type: 'PLAYLIST_ADD',
      item: {
        videoId: liveChannel.id,
        title: liveChannel.name,
        channel: liveChannel.countryName,
        thumbnail: liveChannel.logo || 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80',
        duration: 'ถ่ายทอดสด',
        addedBy: currentUser.name,
        isLive: true,
        streamUrl: liveChannel.streamUrl,
      },
      roomId: roomId,
    });
  }, [currentUser.name, roomId]);

  // Handle Video End (Server-authoritative auto advance playlist)
  const handleVideoEnd = () => {
    if (sleepTimerStopAtEnd) {
      setSleepTimerStopAtEnd(false);
      handleVideoPause(video.currentTime || 0, video.duration);
      showToast('ตัวตั้งเวลาปิดเพลงทำงานแล้ว (เล่นจบเพลงนี้) 🌙 ราตรีสวัสดิ์ครับ', 'info');
      return;
    }
    socketService.send({
      type: 'VIDEO_ENDED',
    });
  };

  const handleNextTrack = () => {
    socketService.send({
      type: 'PLAYLIST_NEXT',
    });
  };

  const handlePrevTrack = () => {
    socketService.send({
      type: 'PLAYLIST_PREV',
    });
  };

  const handleToggleShuffle = () => {
    socketService.send({
      type: 'SET_SHUFFLE',
      isShuffle: !isShuffle,
    });
  };

  // Playlist actions
  const handleAddToPlaylist = (item: Omit<PlaylistItem, 'id'>) => {
    // Optimistic UI update: immediately append song to playlist queue
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const optimisticItem: PlaylistItem = {
      ...item,
      id: tempId,
    };
    setPlaylist((prev) => [...prev, optimisticItem]);

    // If no video is currently active, start playing immediately
    if (!video.videoId) {
      setVideo({
        videoId: item.videoId,
        title: item.title,
        channel: item.channel,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
        lastUpdated: Date.now(),
      });
    }

    socketService.send({
      type: 'PLAYLIST_ADD',
      item,
      roomId,
    });
  };

  const handleAddToPlaylistBatch = useCallback((items: Omit<PlaylistItem, 'id'>[]) => {
    if (!items || items.length === 0) return;
    socketService.send({
      type: 'PLAYLIST_ADD_BATCH',
      items,
      roomId,
    });
  }, [roomId]);

  const handleRemovePlaylistItem = (id: string) => {
    // Optimistic UI update: immediately remove from playlist
    setPlaylist((prev) => prev.filter((item) => item.id !== id));

    socketService.send({
      type: 'PLAYLIST_REMOVE',
      id,
    });
  };

  const handleClearPlaylist = () => {
    // Optimistic UI update: immediately clear playlist
    setPlaylist([]);

    socketService.send({
      type: 'PLAYLIST_CLEAR',
    });
  };

  const handleSetLoopMode = (mode: LoopMode) => {
    socketService.send({
      type: 'SET_LOOP_MODE',
      loopMode: mode,
    });
  };

  // Chat message
  const handleSendMessage = (text: string, imageUrl?: string) => {
    const trimmed = (text || '').trim();
    if (!trimmed && !imageUrl) return;

    // Optimistically append message immediately to chat stream
    const optimisticMessage: ChatMessage = {
      id: 'msg-opt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      sender: currentUser,
      text: trimmed,
      imageUrl,
      timestamp: Date.now(),
    };
    setChat((prev) => [...prev, optimisticMessage]);

    socketService.send({
      type: 'SEND_CHAT',
      text: trimmed,
      imageUrl,
    });
  };

  // Close Room (Owner)
  const handleCloseRoom = () => {
    socketService.send({
      type: 'CLOSE_ROOM',
    });
  };

  // Delete chat message (Sender / Admin / Owner)
  const handleDeleteMessage = (messageId: string) => {
    socketService.send({
      type: 'DELETE_CHAT_MESSAGE',
      messageId,
    });
  };

  // Clear all chat in room (Owner / Admin)
  const handleClearChat = () => {
    socketService.send({
      type: 'CLEAR_CHAT',
    });
  };

  // Reactions & Soundboard
  const handleSendReaction = (emoji: string) => {
    const item: FloatingItem = {
      id: 'react-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      emoji,
      senderName: currentUser.name,
      senderColor: currentUser.color,
      leftPercent: Math.floor(20 + Math.random() * 60),
    };
    setReactions((prev) => [...prev, item]);
    socketService.send({
      type: 'EMOJI_REACTION',
      emoji,
    });
  };

  const handleRemoveReaction = (id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  };

  const lastGiftSentTimeRef = useRef<number>(0);

  const handleSendGift = useCallback((gift: { id: string; name: string; icon: string }) => {
    const now = Date.now();
    if (now - lastGiftSentTimeRef.current < 1500) {
      showToast('กรุณารอสักครู่ก่อนส่งของขวัญชิ้นถัดไป ✨', 'warning');
      return;
    }
    lastGiftSentTimeRef.current = now;

    socketService.send({
      type: 'SEND_GIFT',
      giftId: gift.id,
      giftName: gift.name,
      giftIcon: gift.icon,
    });
  }, [showToast]);

  const handleRemoveGift = useCallback((id: string) => {
    setActiveGifts((prev) => prev.filter((g) => g.id !== id));
  }, []);

  // Draw and Guess Game Action Handlers
  const handleStartGame = useCallback((maxRounds: number = 3) => {
    socketService.send({ type: 'GAME_START', maxRounds });
  }, []);

  const handleStopGame = useCallback(() => {
    socketService.send({ type: 'GAME_STOP' });
  }, []);

  const handleSelectGameWord = useCallback((word: string, category: string) => {
    socketService.send({ type: 'GAME_SELECT_WORD', word, category });
  }, []);

  const handleSendGameStroke = useCallback((stroke: DrawStroke) => {
    socketService.send({ type: 'GAME_DRAW_STROKE', stroke });
  }, []);

  const handleClearGameCanvas = useCallback(() => {
    socketService.send({ type: 'GAME_CLEAR_CANVAS' });
  }, []);

  const handleGameGuess = useCallback((guess: string) => {
    socketService.send({ type: 'GAME_GUESS', guess });
  }, []);

  const handleSetRoomAnnouncement = useCallback((announcement: string) => {
    socketService.send({ type: 'SET_ROOM_ANNOUNCEMENT', announcement });
  }, []);

  if (isLineStudioRoute) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#11161d] flex items-center justify-center text-zinc-400 text-sm">กำลังโหลด Line Sticker Studio...</div>}>
        <LineStickerStudio />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </React.Suspense>
    );
  }

  if (isAdminRoute) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#11161d] flex items-center justify-center text-zinc-400 text-sm">กำลังโหลด Admin Portal...</div>}>
        <AdminPortalView
          currentUser={currentUser}
          onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
          onNavigateHome={() => {
            window.history.pushState({}, '', '/');
            setIsAdminRoute(false);
            setCurrentView('home');
          }}
          onShowToast={showToast}
          onJoinRoom={(targetRoomId, isStealth) => {
            window.history.pushState({}, '', `/#${targetRoomId}`);
            setIsAdminRoute(false);
            handleSelectRoom(targetRoomId, !!isStealth);
            if (isStealth) {
              showToast('เข้าสู่ห้องในโหมดล่องหนเรียบร้อย 👻 สมาชิกในห้องจะไม่รู้ตัว', 'success');
            }
          }}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </React.Suspense>
    );
  }

  if (profileHandleRoute) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#11161d] flex items-center justify-center text-zinc-400 text-sm">กำลังโหลดโปรไฟล์...</div>}>
        <PublicProfileView
          handle={profileHandleRoute}
          currentUser={currentUser}
          onNavigateHome={() => {
            window.history.pushState({}, '', '/');
            setProfileHandleRoute(null);
            setCurrentView('home');
          }}
          onJoinRoom={(targetRoomId) => {
            window.history.pushState({}, '', `/#${targetRoomId}`);
            setProfileHandleRoute(null);
            handleSelectRoom(targetRoomId);
          }}
          onOpenEditProfile={() => {
            setSelectedUserForProfile(currentUser);
            setIsUserProfileModalOpen(true);
          }}
          onPlaySong={handlePlaySongFromProfile}
          onShowToast={showToast}
        />
        <UserProfileModal
          isOpen={isUserProfileModalOpen}
          onClose={() => setIsUserProfileModalOpen(false)}
          targetUser={selectedUserForProfile}
          currentUser={currentUser}
          onUpdateCurrentUser={(updated) => {
            setCurrentUser(updated);
            saveUser(updated);
            handleSaveProfile(updated);
          }}
          onPlaySong={handlePlaySongFromProfile}
          onOpenAuth={() => {
            setIsUserProfileModalOpen(false);
            setIsAuthModalOpen(true);
          }}
          onLogout={handleLogout}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          initialTab={authModalInitialTab}
          onLoginSuccess={handleLoginSuccess}
          onAdminLoginSuccess={() => {
            setIsSuperAdmin(true);
            setIsSuperAdminModalOpen(true);
            showToast('ยินดีต้อนรับท่านเจ้าของระบบ เข้าสู่ระบบหลังบ้านสำเร็จ 👑', 'success');
          }}
          onLogout={handleLogout}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </React.Suspense>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#0f0f13] text-gray-100 flex flex-col overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        roomId={roomId}
        roomName={roomMetadata.name}
        roomAnnouncement={roomMetadata.announcement}
        onSetAnnouncement={handleSetRoomAnnouncement}
        isPrivate={roomMetadata.isPrivate}
        onlineCount={onlineCount}
        currentUser={currentUser}
        myRole={myRole}
        isSuperAdmin={isSuperAdmin}
        isRefreshing={isRefreshing}
        isFavoriteRoom={favoriteRoomIds.has(roomId)}
        isGameActive={Boolean(gameState?.isActive)}
        onToggleGame={() => {
          if (gameState?.isActive) {
            if (window.confirm('คุณต้องการยุติเกมวาดรูปสำหรับทุกคนใช่หรือไม่?')) {
              handleStopGame();
            }
          } else {
            handleStartGame(3);
          }
        }}
        onToggleFavoriteRoom={handleToggleFavoriteCurrentRoom}
        onRefreshRoom={handleRefresh}
        onToggleOledSleep={() => setIsOledSleepMode(true)}
        onOpenShareCard={() => setIsShareCardModalOpen(true)}
        onInstallApp={() => setIsInstallModalOpen(true)}
        onOpenLiveTV={() => setIsLiveTVModalOpen(true)}
        onMinimizeRoom={handleMinimizeRoom}
        onLeaveRoom={handleLeaveRoom}
        onNavigateHome={handleNavigateHome}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenFullProfile={() => {
          setSelectedUserForProfile(currentUser);
          setIsUserProfileModalOpen(true);
        }}
        onOpenAuth={() => {
          setAuthModalInitialTab('member');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenSuperAdminDashboard={() => {
          window.history.pushState({}, '', '/admin');
          setIsAdminRoute(true);
        }}
        onOpenAdminLogin={() => {
          window.history.pushState({}, '', '/admin');
          setIsAdminRoute(true);
        }}
        onOpenSupport={() => setIsSupportModalOpen(true)}
        onShowToast={showToast}
      />

      {/* Admin Stealth Inspection HUD Banner */}
      {isStealthInspection && currentView === 'room' && (
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 border-b border-purple-500/40 px-4 py-2.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs z-40 shadow-lg animate-fade-in shrink-0">
          <div className="flex items-center gap-2.5 font-medium">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30">
              <Ghost className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <span className="text-purple-300 font-bold">โหมดล่องหน (Admin Stealth Inspection)</span>
              <span className="text-gray-300 text-[11px] block sm:inline sm:ml-2">
                คุณกำลังตรวจสอบห้องนี้แบบเงียบกริบ 100% (ไม่มีแจ้งเตือนในแชท / ไม่เพิ่มยอดคน / ไม่ปรากฏชื่อ)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAdminPanelOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>แผงควบคุมห้อง</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/admin');
                setIsStealthInspection(false);
                setIsAdminRoute(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากโหมดล่องหน</span>
            </button>
          </div>
        </div>
      )}

      {/* Pull-to-refresh floating indicator (Active on Home only) */}
      {currentView === 'home' && (pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            transform: `translate(-50%, ${pullDistance > 0 ? pullDistance - 25 : 8}px)`,
          }}
        >
          <div className="bg-[#1a1c2b]/95 border border-purple-500/40 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md">
            <RefreshCw
              className={`w-4 h-4 text-pink-400 ${
                isRefreshing || pullDistance >= 50 ? 'animate-spin' : ''
              }`}
              style={{
                transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)`,
              }}
            />
            <span className="text-gray-200">
              {isRefreshing
                ? currentView === 'home'
                  ? 'กำลังรีเฟรชหน้าหลัก...'
                  : 'กำลังรีเฟรชข้อมูลห้อง...'
                : pullDistance >= 50
                ? 'ปล่อยนิ้วเพื่อรีเฟรช 🚀'
                : 'แตะแล้วปัดลงเพื่อรีเฟรช ⬇️'}
            </span>
          </div>
        </div>
      )}

      {/* OLED Black Screen Mode (โหมดพักหน้าจอประหยัดแบตเตอรี่ - ดำสนิท 100% ฟังเพลงต่อเนื่องไม่ตัด) */}
      {isOledSleepMode && (
        <div
          onClick={() => {
            setIsOledSleepMode(false);
            showToast('กลับสู่โหมดปกติ ☀️', 'info');
          }}
          className="fixed inset-0 z-[99999] bg-black text-gray-400 flex flex-col items-center justify-between p-6 sm:p-10 cursor-pointer select-none animate-fade-in"
          style={{ backgroundColor: '#000000' }}
        >
          {/* Top Info */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-950/80 px-3.5 py-1.5 rounded-full border border-zinc-900">
            <Moon className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>โหมดพักหน้าจอประหยัดพลังงาน (OLED Screen Saver)</span>
          </div>

          {/* Center Info */}
          <div className="text-center space-y-4 max-w-sm sm:max-w-md mx-auto">
            <div className="text-5xl sm:text-6xl font-mono font-extralight text-zinc-400 tracking-widest">
              {oledTimeStr}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>กำลังเล่นเสียงในห้องอย่างต่อเนื่อง 🎵</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-300 truncate">
                {video.title}
              </h3>
              <p className="text-xs text-zinc-600 truncate">{video.channel}</p>
            </div>
          </div>

          {/* Bottom Hint */}
          <div className="text-center space-y-1">
            <p className="text-xs text-zinc-400 font-medium">
              แตะที่ใดก็ได้บนหน้าจอเพื่อเปิดหน้าจอ 👆
            </p>
            <p className="text-[11px] text-zinc-700">
              จอดำสนิท 100% พิกเซล OLED ดับประหยัดแบตเตอรี่และเปิดเพลงต่อเนื่อง
            </p>
          </div>
        </div>
      )}

      {/* Global System Announcement Banner */}
      {platformConfig.announcementBanner?.enabled &&
        platformConfig.announcementBanner.text &&
        !isBannerDismissed && (
          <div
            className={`relative w-full py-2 px-8 text-xs font-semibold flex items-center justify-center gap-2 border-b shadow-xs transition-all shrink-0 z-40 ${
              platformConfig.announcementBanner.type === 'alert'
                ? 'bg-rose-500 text-white border-rose-600'
                : platformConfig.announcementBanner.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-[#0075de] text-white border-[#005bab]'
            }`}
          >
            <span>📢</span>
            <span className="truncate">{platformConfig.announcementBanner.text}</span>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/15 text-white/90 hover:text-white transition-colors cursor-pointer"
              title="ปิดแถบประกาศ"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      {/* Main View Router */}
      {currentView === 'home' && (
        <HomeView
          rooms={roomsList}
          currentUser={currentUser}
          onSelectRoom={handleSelectRoom}
          onOpenCreateRoom={() => setIsCreateRoomModalOpen(true)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          onOpenLiveTV={() => setIsLiveTVModalOpen(true)}
        />
      )}

      {(currentView === 'room' || Boolean(roomId)) && (
        <main
          className={`flex-1 min-h-0 max-w-[1920px] w-full mx-auto p-2 sm:p-3 lg:p-3.5 flex flex-col lg:grid lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-3.5 overflow-hidden bg-[#f6f5f4] ${
            currentView === 'room'
              ? ''
              : 'fixed -left-[9999px] top-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden'
          }`}
        >
          {/* Left Column: Synchronized Video Player & Open Voice Bar (Desktop: 8 cols) */}
          <div className="w-full lg:col-span-8 flex flex-col shrink-0 lg:shrink lg:h-full min-h-0 gap-2 sm:gap-2.5">
            {/* Synchronized YouTube Video Player */}
            <div className={`w-full aspect-video max-h-[25vh] sm:max-h-[30vh] md:max-h-[32vh] lg:max-h-none lg:flex-1 min-h-0 flex items-center justify-center bg-black rounded-xl overflow-hidden border border-[#e6e6e6] shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative shrink-0 ${
              gameState?.isActive ? 'fixed -left-[9999px] top-0 w-1 h-1 opacity-0 pointer-events-none' : ''
            }`}>
              <VideoPlayer
                video={video}
                reactions={isReactionsEnabled ? reactions : []}
                onRemoveReaction={handleRemoveReaction}
                onSendReaction={handleSendReaction}
                isSomeoneSpeaking={isSomeoneSpeaking}
                isAudioDuckingEnabled={isAudioDuckingEnabled}
                isFavorite={isVideoFavorite}
                onToggleFavorite={handleToggleFavoriteCurrentSong}
                onToggleAudioDucking={() => {
                  setIsAudioDuckingEnabled((prev) => {
                    const next = !prev;
                    showToast(next ? 'เปิดระบบลดเสียงคลิปเวลาคนพูด (Audio Ducking) 🎧' : 'ปิดระบบลดเสียงคลิปเวลาคนพูด', 'info');
                    return next;
                  });
                }}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onSeek={handleVideoSeek}
                onTimeUpdate={(cur, dur) => {
                  if (!isScrubbing) {
                    setPlaybackCurrentTime(cur);
                  }
                  if (dur && dur > 0) {
                    setPlaybackDuration(dur);
                  }
                }}
                onVideoEnd={handleVideoEnd}
                onNextTrack={handleNextTrack}
                onPrevTrack={handlePrevTrack}
                onOpenLiveTV={() => setIsLiveTVModalOpen(true)}
                onShowToast={showToast}
              />
            </div>

            {/* Draw & Guess 2D Party Game Stage (When game is active, takes the stage in place of the video) */}
            {gameState?.isActive && (
              <div className="w-full h-[52vh] sm:h-[58vh] md:h-[62vh] lg:h-full min-h-[360px] flex-1 flex flex-col shrink-0 lg:shrink">
                <React.Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">กำลังโหลดเกมวาดรูป...</div>}>
                  <DrawAndGuessStage
                    gameState={gameState}
                    currentUser={currentUser}
                    myRole={myRole}
                    onSendStroke={handleSendGameStroke}
                    onClearCanvas={handleClearGameCanvas}
                    onSelectWord={handleSelectGameWord}
                    onGuess={handleGameGuess}
                    onStopGame={handleStopGame}
                  />
                </React.Suspense>
              </div>
            )}

            {/* Current Video Info Banner & Quick Controls - Notion White Surface */}
            <div className="bg-white border border-[#e6e6e6] rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 flex flex-col gap-2 shrink-0 shadow-xs">
              {/* Top Row: Video Title, Channel, Playlist position & Action Controls */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {/* Video Title & Channel */}
                <div className="min-w-0 flex-1 pr-2">
                  <h2 className="text-xs sm:text-sm font-bold text-[#000000] truncate" title={video.title || 'ห้องสแตนด์บาย (ยังไม่มีเพลงเล่น)'}>
                    {video.title || 'ห้องสแตนด์บาย (ยังไม่มีเพลงเล่น)'}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-[#615d59] mt-0.5">
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">{video.channel || 'pleng.online'}</span>
                    {playlist.length > 0 && (
                      <span className="text-[10px] text-[#0075de] font-mono bg-[#0075de]/10 px-1.5 py-0.5 rounded border border-[#0075de]/20 shrink-0">
                        คิว: {playlist.findIndex((p) => p.videoId === video.videoId) >= 0 ? playlist.findIndex((p) => p.videoId === video.videoId) + 1 : 1}/{playlist.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Playback Buttons (Previous, Shuffle, Loop, Next, Screen Saver) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Prev Track */}
                  <button
                    type="button"
                    onClick={handlePrevTrack}
                    title="เพลงก่อนหน้า (Previous Track)"
                    disabled={playlist.length === 0}
                    className="p-1.5 rounded-md bg-white hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6] disabled:opacity-30 transition-all cursor-pointer shadow-xs"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  {/* Shuffle Button */}
                  <button
                    type="button"
                    onClick={handleToggleShuffle}
                    title={isShuffle ? 'สุ่มเพลง: เปิด (คลิกเพื่อปิด)' : 'สุ่มเพลง: ปิด (คลิกเพื่อเปิด)'}
                    className={`p-1.5 rounded-md border transition-all cursor-pointer shadow-xs ${
                      isShuffle
                        ? 'bg-[#0075de]/10 text-[#0075de] border-[#0075de]/30'
                        : 'bg-white hover:bg-[#f6f5f4] text-[#a39e98] border-[#e6e6e6]'
                    }`}
                  >
                    <Shuffle className={`w-3.5 h-3.5 ${isShuffle ? 'text-[#0075de]' : 'opacity-60'}`} />
                  </button>

                  {/* Loop Mode Cycle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode: Record<LoopMode, LoopMode> = {
                        off: 'all',
                        all: 'single',
                        single: 'off',
                      };
                      handleSetLoopMode(nextMode[loopMode]);
                    }}
                    title={`โหมดเล่นวน: ${loopMode}`}
                    className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                      loopMode !== 'off'
                        ? 'bg-[#1aae39]/10 text-[#1aae39] border-[#1aae39]/30'
                        : 'bg-white hover:bg-[#f6f5f4] text-[#a39e98] border-[#e6e6e6]'
                    }`}
                  >
                    {loopMode === 'single' ? (
                      <>
                        <Repeat1 className="w-3.5 h-3.5 text-[#1aae39]" />
                        <span className="text-[10px] hidden sm:inline">ซ้ำ 1</span>
                      </>
                    ) : loopMode === 'all' ? (
                      <>
                        <Repeat className="w-3.5 h-3.5 text-[#1aae39]" />
                        <span className="text-[10px] hidden sm:inline">วนคิว</span>
                      </>
                    ) : (
                      <>
                        <Repeat className="w-3.5 h-3.5 opacity-60" />
                        <span className="text-[10px] hidden sm:inline">รอบเดียว</span>
                      </>
                    )}
                  </button>

                  {/* Next Track */}
                  <button
                    type="button"
                    onClick={handleNextTrack}
                    title="เพลงถัดไป (Next Track)"
                    disabled={playlist.length === 0}
                    className="p-1.5 rounded-md bg-white hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6] disabled:opacity-30 transition-all cursor-pointer shadow-xs"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  {/* OLED Screen Off / Sleep Mode Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOledSleepMode(true);
                      showToast('เข้าสู่โหมดพักหน้าจอ (OLED Black) แตะหน้าจอเพื่อปลดล็อค 🌙', 'info');
                    }}
                    title="โหมดพักหน้าจอประหยัดแบตเตอรี่ (หน้าจอดำสนิท ฟังเพลงไม่ตัด)"
                    className="px-2 py-1 rounded-md bg-white hover:bg-[#f6f5f4] text-[#615d59] border border-[#e6e6e6] text-xs font-medium transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                  >
                    <Moon className="w-3.5 h-3.5 text-[#615d59]" />
                    <span className="text-[10px] hidden sm:inline">พักจอ</span>
                  </button>

                  {/* Karaoke & Synced Lyrics Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!video.videoId) {
                        showToast('ไม่มีเพลงที่กำลังเล่นอยู่ 🎵', 'info');
                        return;
                      }
                      setIsKaraokeModalOpen(true);
                    }}
                    title="โหมดคาราโอเกะ & เนื้อเพลงสด (Synced Lyrics)"
                    className="px-2.5 py-1 rounded-md bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 border border-pink-500/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
                  >
                    <Mic2 className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                    <span className="text-[11px]">เนื้อเพลง</span>
                  </button>

                  {/* Sleep Timer Button */}
                  <button
                    type="button"
                    onClick={() => setIsSleepTimerModalOpen(true)}
                    title="ตัวตั้งเวลาปิดเพลงอัตโนมัติ (Sleep Timer)"
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 border ${
                      (sleepTimerSecondsLeft !== null && sleepTimerSecondsLeft > 0) || sleepTimerStopAtEnd
                        ? 'bg-indigo-600 text-white border-indigo-700 animate-pulse'
                        : 'bg-white hover:bg-[#f6f5f4] text-[#615d59] border-[#e6e6e6]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px]">
                      {sleepTimerStopAtEnd
                        ? 'จบเพลงนี้'
                        : sleepTimerSecondsLeft !== null && sleepTimerSecondsLeft > 0
                        ? `${Math.floor(sleepTimerSecondsLeft / 60)}:${(sleepTimerSecondsLeft % 60).toString().padStart(2, '0')}`
                        : 'ตั้งเวลาปิด'}
                    </span>
                  </button>

                  {/* Draw & Guess 2D Party Game Toggle Button (Host & Admin only) */}
                  {(myRole === 'owner' || myRole === 'admin' || isSuperAdmin) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (gameState?.isActive) {
                          if (window.confirm('คุณต้องการยุติเกมวาดรูปสำหรับทุกคนใช่หรือไม่?')) {
                            handleStopGame();
                          }
                        } else {
                          handleStartGame(3);
                        }
                      }}
                      title={gameState?.isActive ? 'ยุติเกมวาดรูปทายคำ' : 'เริ่มเกมวาดรูปทายคำ (Game Stage Mode)'}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs border ${
                        gameState?.isActive
                          ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                      }`}
                    >
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">
                        {gameState?.isActive ? 'ยุติเกม' : 'เริ่มเกมทายคำ'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Row: Scrubber Timeline, -10s, Play/Pause, +10s, Time Display (3.00/15.00) */}
              <div className="pt-1.5 border-t border-[#f0efed] flex items-center gap-2 sm:gap-2.5">
                {/* Play / Pause Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!video.videoId) return;
                    if (video.isPlaying) {
                      handleVideoPause(playbackCurrentTime || video.currentTime || 0, playbackDuration || video.duration || 0);
                    } else {
                      handleVideoPlay(playbackCurrentTime || video.currentTime || 0, playbackDuration || video.duration || 0);
                    }
                  }}
                  disabled={!video.videoId}
                  title={video.isPlaying ? 'หยุดชั่วคราว (Pause)' : 'เล่นต่อ (Play)'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0075de] hover:bg-[#005bab] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 shrink-0 shadow-xs"
                >
                  {video.isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                  )}
                </button>

                {/* Rewind 10 Seconds Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!video.videoId) return;
                    const maxDur = playbackDuration || video.duration || 0;
                    const current = isScrubbing ? scrubValue : (playbackCurrentTime || video.currentTime || 0);
                    const newTarget = Math.max(0, current - 10);
                    setPlaybackCurrentTime(newTarget);
                    handleVideoSeek(newTarget, maxDur);
                    showToast('ย้อนหลัง 10 วินาที ⏪', 'info');
                  }}
                  disabled={!video.videoId}
                  title="ย้อนหลัง 10 วินาที (-10s)"
                  className="p-1.5 rounded-lg bg-white hover:bg-[#f6f5f4] text-[#615d59] hover:text-[#000000] border border-[#e6e6e6] active:scale-95 transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1 shrink-0 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold leading-none hidden sm:inline">-10s</span>
                </button>

                {/* Forward 10 Seconds Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!video.videoId) return;
                    const maxDur = playbackDuration || video.duration || 0;
                    const current = isScrubbing ? scrubValue : (playbackCurrentTime || video.currentTime || 0);
                    const newTarget = maxDur > 0 ? Math.min(maxDur, current + 10) : current + 10;
                    setPlaybackCurrentTime(newTarget);
                    handleVideoSeek(newTarget, maxDur);
                    showToast('ไปข้างหน้า 10 วินาที ⏩', 'info');
                  }}
                  disabled={!video.videoId}
                  title="ไปข้างหน้า 10 วินาที (+10s)"
                  className="p-1.5 rounded-lg bg-white hover:bg-[#f6f5f4] text-[#615d59] hover:text-[#000000] border border-[#e6e6e6] active:scale-95 transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1 shrink-0 shadow-xs"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold leading-none hidden sm:inline">+10s</span>
                </button>

                {/* Progress Slider (Scrubber Bar) */}
                <div className="flex-1 flex items-center min-w-0 px-1">
                  <input
                    type="range"
                    min="0"
                    max={playbackDuration || video.duration || 100}
                    step="0.5"
                    value={isScrubbing ? scrubValue : (playbackCurrentTime || 0)}
                    disabled={!video.videoId || (playbackDuration === 0 && !video.duration)}
                    onMouseDown={() => {
                      setIsScrubbing(true);
                      setScrubValue(playbackCurrentTime || 0);
                    }}
                    onTouchStart={() => {
                      setIsScrubbing(true);
                      setScrubValue(playbackCurrentTime || 0);
                    }}
                    onChange={(e) => {
                      setScrubValue(parseFloat(e.target.value));
                    }}
                    onMouseUp={(e) => {
                      setIsScrubbing(false);
                      const seekTo = parseFloat((e.target as HTMLInputElement).value);
                      setPlaybackCurrentTime(seekTo);
                      handleVideoSeek(seekTo, playbackDuration || video.duration || 0);
                    }}
                    onTouchEnd={(e) => {
                      setIsScrubbing(false);
                      const seekTo = parseFloat((e.target as HTMLInputElement).value);
                      setPlaybackCurrentTime(seekTo);
                      handleVideoSeek(seekTo, playbackDuration || video.duration || 0);
                    }}
                    className="w-full h-1.5 sm:h-2 bg-[#e6e6e6] rounded-full appearance-none cursor-pointer accent-[#0075de] disabled:opacity-30 transition-all"
                  />
                </div>

                {/* Current Time / Total Duration Display (e.g. 3.00/15.00) */}
                <div className="font-mono text-xs font-semibold text-[#31302e] whitespace-nowrap px-2 py-0.5 bg-[#f6f5f4] rounded-md border border-[#e6e6e6] shrink-0 tracking-tight">
                  <span className="text-[#0075de] font-bold">
                    {formatTime(isScrubbing ? scrubValue : playbackCurrentTime)}
                  </span>
                  <span className="text-[#a39e98] mx-1">/</span>
                  <span className="text-[#615d59]">
                    {formatTime(playbackDuration || video.duration || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile / Tablet Tab Switcher (Visible on < lg screens only) - Notion Style */}
            <div className="flex lg:hidden items-center bg-white border border-[#e6e6e6] rounded-xl p-1 shrink-0 overflow-x-auto shadow-xs">
              {isVoiceStageEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveMobileTab('voice')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                    activeMobileTab === 'voice'
                      ? 'bg-[#0075de] text-white shadow-xs'
                      : 'text-[#615d59] hover:text-[#000000]'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>สายไมค์ ({seats.filter((s) => s.user).length})</span>
                </button>
              )}

              {isQueueEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveMobileTab('queue')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                    activeMobileTab === 'queue'
                      ? 'bg-[#0075de] text-white shadow-xs'
                      : 'text-[#615d59] hover:text-[#000000]'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>คิวเพลง ({playlist.length})</span>
                </button>
              )}

              {isChatEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveMobileTab('chat');
                    setUnreadChatCount(0);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap relative ${
                    activeMobileTab === 'chat'
                      ? 'bg-[#0075de] text-white shadow-xs'
                      : 'text-[#615d59] hover:text-[#000000]'
                  }`}
                >
                  <div className="relative flex items-center">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span>แชทสด</span>
                  {unreadChatCount > 0 && activeMobileTab !== 'chat' && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono shadow-xs animate-pulse">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveMobileTab('members')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                  activeMobileTab === 'members'
                    ? 'bg-[#0075de] text-white shadow-xs'
                    : 'text-[#615d59] hover:text-[#000000]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>สมาชิก ({members.length || onlineCount})</span>
              </button>
            </div>

            {/* Open Voice Channel (Visible on desktop or when mobileTab === 'voice') */}
            {isVoiceStageEnabled && (
              <div className={`${activeMobileTab === 'voice' ? 'flex-1 min-h-0 overflow-y-auto' : 'hidden'} lg:block shrink-0`}>
                <VoiceStage
                  seats={seats}
                  currentUser={currentUser}
                  myRole={myRole}
                  stageAccessMode={roomMetadata.stageAccessMode || 'everyone'}
                  pendingStageRequests={pendingStageRequests}
                  approvedSpeakerIds={approvedSpeakerIds}
                  onTakeSeat={handleTakeSeat}
                  onLeaveSeat={handleLeaveSeat}
                  onToggleMute={handleToggleMute}
                  onSpeakingState={handleSpeakingState}
                  onLocalStreamReady={handleLocalStreamReady}
                  onOpenProfile={() => setIsProfileModalOpen(true)}
                  onSelectUser={handleOpenUserCard}
                  onShowToast={showToast}
                  onRequestToSpeak={handleRequestToSpeak}
                  onApproveSpeakRequest={handleApproveSpeakRequest}
                  onRevokeSpeakPermission={handleRevokeSpeakPermission}
                  onVoiceVolumeChange={handleVoiceVolumeChange}
                />
              </div>
            )}
          </div>

          {/* Right Column: GroupTube Multi-Tab Sidebar (Desktop 4 cols, Mobile conditional) - Notion Card Style */}
          <div className={`w-full lg:col-span-4 flex-1 lg:h-full min-h-0 flex flex-col bg-white rounded-xl border border-[#e6e6e6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ${
            activeMobileTab === 'voice' ? 'hidden lg:flex' : 'flex'
          }`}>
            {/* Desktop Tab Switcher */}
            <div className="hidden lg:flex items-center p-1.5 border-b border-[#e6e6e6] bg-[#f6f5f4] shrink-0 gap-1">
              {isQueueEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveSidebarTab('queue')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSidebarTab === 'queue'
                      ? 'bg-white text-[#0075de] border border-[#e6e6e6] shadow-xs'
                      : 'text-[#615d59] hover:text-[#000000] hover:bg-black/5'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>คิวเพลง</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#f6f5f4] text-[#615d59] text-[10px] font-mono border border-[#e6e6e6]">
                    {playlist.length}
                  </span>
                </button>
              )}

              {isChatEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarTab('chat');
                    setUnreadChatCount(0);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                    activeSidebarTab === 'chat'
                      ? 'bg-white text-[#0075de] border border-[#e6e6e6] shadow-xs'
                      : 'text-[#615d59] hover:text-[#000000] hover:bg-black/5'
                  }`}
                >
                  <div className="relative flex items-center">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span>แชทสด</span>
                  {unreadChatCount > 0 && activeSidebarTab !== 'chat' && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono shadow-xs animate-pulse">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveSidebarTab('members')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSidebarTab === 'members'
                    ? 'bg-white text-[#0075de] border border-[#e6e6e6] shadow-xs'
                    : 'text-[#615d59] hover:text-[#000000] hover:bg-black/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>สมาชิก</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#f6f5f4] text-[#615d59] text-[10px] font-mono border border-[#e6e6e6]">
                  {members.length || onlineCount}
                </span>
              </button>
            </div>

            {/* Content: Queue & Search Tab */}
            <div className={`flex-1 min-h-0 overflow-hidden ${
              (activeSidebarTab === 'queue' && activeMobileTab !== 'chat' && activeMobileTab !== 'members') ||
              activeMobileTab === 'queue'
                ? 'block'
                : 'hidden'
            }`}>
              <SidebarQueue
                playlist={playlist}
                currentVideo={video}
                loopMode={loopMode}
                isShuffle={isShuffle}
                myRole={myRole}
                currentUser={currentUser}
                onlyAdminManagePlaylist={roomMetadata.onlyAdminManagePlaylist}
                onPlayNow={handleVideoChange}
                onAddToPlaylist={handleAddToPlaylist}
                onAddToPlaylistBatch={handleAddToPlaylistBatch}
                onRemoveItem={handleRemovePlaylistItem}
                onClearPlaylist={handleClearPlaylist}
                onSetLoopMode={handleSetLoopMode}
                onToggleShuffle={handleToggleShuffle}
                onNextTrack={handleNextTrack}
                onShowToast={showToast}
              />
            </div>

            {/* Content: Live Chat Tab */}
            <div className={`flex-1 min-h-0 overflow-hidden ${
              (activeSidebarTab === 'chat' && activeMobileTab !== 'queue' && activeMobileTab !== 'members') ||
              activeMobileTab === 'chat'
                ? 'flex flex-col'
                : 'hidden'
            }`}>
              <LiveChat
                messages={chat}
                currentUser={currentUser}
                enableChatImages={roomMetadata.widgets?.enableChatImages !== false}
                canClearChat={myRole === 'owner' || myRole === 'admin' || isSuperAdmin}
                onClearChat={handleClearChat}
                onSendMessage={handleSendMessage}
                onSendReaction={handleSendReaction}
                onSendGift={handleSendGift}
                activeGifts={activeGifts}
                onRemoveGift={handleRemoveGift}
                onSeekTo={handleVideoSeek}
                onOpenProfile={() => {
                  setSelectedUserForProfile(currentUser);
                  setIsUserProfileModalOpen(true);
                }}
                onSelectUser={handleOpenUserCard}
                onDeleteMessage={handleDeleteMessage}
                onShowToast={showToast}
              />
            </div>

            {/* Content: Members Tab */}
            <div className={`flex-1 min-h-0 overflow-y-auto p-3 space-y-2 ${
              (activeSidebarTab === 'members' && activeMobileTab !== 'queue' && activeMobileTab !== 'chat') ||
              activeMobileTab === 'members'
                ? 'block'
                : 'hidden'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-[#e6e6e6]">
                <span className="text-xs font-bold text-[#000000]">สมาชิกออนไลน์ทั้งหมด</span>
                <span className="text-[11px] text-[#0075de] font-semibold font-mono bg-[#0075de]/10 px-2 py-0.5 rounded-full border border-[#0075de]/20">
                  {uniqueMembers.length || onlineCount} คน
                </span>
              </div>

              {uniqueMembers.map((m) => {
                const isMemberInVoice = seats.some((s) => s.user?.id === m.user.id);
                const isMemberSpeaking = seats.some(
                  (s) => s.user?.id === m.user.id && s.isSpeaking && !s.isMuted
                );
                return (
                  <div
                    key={m.user.id}
                    onClick={() => {
                      if (m.user.id === currentUser.id) {
                        setIsProfileModalOpen(true);
                      } else {
                        handleOpenUserCard(m.user);
                      }
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#f6f5f4] hover:bg-white border border-[#e6e6e6] hover:border-[#0075de]/30 hover:shadow-xs transition-all cursor-pointer group"
                    title={`ดูโปรไฟล์ของ ${m.user.name}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 relative shadow-2xs bg-white"
                        style={{ borderColor: m.user.color || '#0075de' }}
                      >
                        <img
                          src={m.user.avatar}
                          alt={m.user.name}
                          className="w-full h-full object-cover"
                        />
                        {isMemberSpeaking && (
                          <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-bold text-[#000000] group-hover:text-[#0075de] transition-colors truncate max-w-[120px]"
                          >
                            {m.user.name}
                          </span>
                          {m.user.id === currentUser.id && (
                            <span className="text-[10px] text-[#0075de] font-semibold bg-[#0075de]/10 px-1.5 py-0.2 rounded-full">(คุณ)</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mt-0.5">
                          {m.role === 'owner' ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 text-[9px] font-bold border border-amber-500/25 flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5 text-amber-600" />
                              เจ้าของ
                            </span>
                          ) : m.role === 'admin' ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-700 text-[9px] font-bold border border-purple-500/25 flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5 text-purple-600" />
                              แอดมิน
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#615d59]">สมาชิก</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Voice indicator tag */}
                    <div>
                      {isMemberInVoice ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                          <Mic className="w-3 h-3 text-emerald-600" />
                          <span>ในสาย</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#a39e98] group-hover:text-[#615d59] font-medium transition-colors">ผู้ฟัง</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* Minimized Floating Room Card (Bottom-Left) */}
      {currentView === 'home' && Boolean(roomId) && (
        <MinimizedRoomCard
          roomId={roomId}
          roomName={roomMetadata.name}
          video={video}
          onlineCount={onlineCount}
          onMaximize={handleRestoreRoom}
          onTogglePlayPause={() => {
            if (video.isPlaying) {
              handleVideoPause(playbackCurrentTime, playbackDuration);
            } else {
              handleVideoPlay(playbackCurrentTime, playbackDuration);
            }
          }}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        initialTab={authModalInitialTab}
        onLoginSuccess={handleLoginSuccess}
        onAdminLoginSuccess={() => {
          setIsSuperAdmin(true);
          setIsSuperAdminModalOpen(true);
          showToast('ยินดีต้อนรับท่านเจ้าของระบบ เข้าสู่ระบบหลังบ้านสำเร็จ 👑', 'success');
        }}
        onLogout={handleLogout}
      />

      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        targetUser={selectedUserForProfile}
        currentUser={currentUser}
        onUpdateCurrentUser={(updated) => {
          setCurrentUser(updated);
          saveUser(updated);
          handleSaveProfile(updated);
        }}
        onPlaySong={handlePlaySongFromProfile}
        onOpenAuth={() => {
          setIsUserProfileModalOpen(false);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      <UserCardModal
        isOpen={isUserCardModalOpen}
        onClose={() => setIsUserCardModalOpen(false)}
        targetUser={selectedUserForCard}
        currentUser={currentUser}
        onViewFullProfile={(user) => {
          setIsUserCardModalOpen(false);
          handleViewFullProfile(user);
        }}
        onOpenAuth={() => {
          setIsUserCardModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSave={handleSaveProfile}
        onAddToPlaylist={handleAddToPlaylist}
        onPlayNow={handleVideoChange}
        onOpenSupport={() => setIsSupportModalOpen(true)}
        onOpenSuperAdmin={() => setIsSuperAdminUnlockModalOpen(true)}
        onShowToast={showToast}
      />

      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        playlist={playlist}
        currentVideo={video}
        loopMode={loopMode}
        isShuffle={isShuffle}
        onPlayNow={handleVideoChange}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveItem={handleRemovePlaylistItem}
        onClearPlaylist={handleClearPlaylist}
        onSetLoopMode={handleSetLoopMode}
        onToggleShuffle={handleToggleShuffle}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        onShowToast={showToast}
      />

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <PasswordGateModal
        isOpen={isPasswordGateOpen}
        roomName={passwordGateRoomName}
        errorMessage={passwordGateError}
        onSubmitPassword={handlePasswordSubmit}
        onBackToHome={handleNavigateHome}
      />

      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        myRole={myRole}
        myUserId={currentUser.id}
        metadata={roomMetadata}
        members={members}
        bannedUsers={bannedUsers}
        approvedSpeakerIds={approvedSpeakerIds}
        onSetAdminRole={handleSetAdminRole}
        onKickUser={handleKickUser}
        onBanUser={handleBanUser}
        onUnbanUser={handleUnbanUser}
        onForceMute={() => {}}
        onForceLeaveStage={handleForceLeaveStage}
        onRevokeSpeakerPermission={handleRevokeSpeakPermission}
        onUpdateSettings={handleUpdateRoomSettings}
        onCloseRoom={handleCloseRoom}
        onShowToast={showToast}
      />

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        currentUser={currentUser}
      />

      <SuperAdminUnlockModal
        isOpen={isSuperAdminUnlockModalOpen}
        onClose={() => setIsSuperAdminUnlockModalOpen(false)}
        onUnlockSuccess={() => {
          setIsSuperAdmin(true);
          setIsSuperAdminModalOpen(true);
          showToast('ยินดีต้อนรับสู่แดชบอร์ดเจ้าของเว็บ! 👑', 'success');
        }}
      />

      {isSuperAdminModalOpen && (
        <React.Suspense fallback={null}>
          <SuperAdminDashboardModal
            isOpen={isSuperAdminModalOpen}
            onClose={() => setIsSuperAdminModalOpen(false)}
            currentUser={currentUser}
            onShowToast={showToast}
          />
        </React.Suspense>
      )}

      <KaraokeLyricsModal
        isOpen={isKaraokeModalOpen}
        onClose={() => setIsKaraokeModalOpen(false)}
        videoId={video.videoId}
        videoTitle={video.title}
        videoChannel={video.channel}
        currentTime={playbackCurrentTime || video.currentTime || 0}
        duration={playbackDuration || video.duration || 0}
        isPlaying={video.isPlaying}
        onSeek={(seconds) => {
          setPlaybackCurrentTime(seconds);
          handleVideoSeek(seconds, playbackDuration || video.duration || 0);
        }}
        onTogglePlayPause={() => {
          if (video.isPlaying) {
            handleVideoPause(playbackCurrentTime || video.currentTime || 0, playbackDuration || video.duration || 0);
          } else {
            handleVideoPlay(playbackCurrentTime || video.currentTime || 0, playbackDuration || video.duration || 0);
          }
        }}
        onNextTrack={handleNextTrack}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerModalOpen}
        onClose={() => setIsSleepTimerModalOpen(false)}
        secondsLeft={sleepTimerSecondsLeft}
        stopAtEndOfTrack={sleepTimerStopAtEnd}
        onSetTimerMinutes={(mins) => {
          setSleepTimerStopAtEnd(false);
          setSleepTimerSecondsLeft(mins * 60);
          showToast(`ตั้งเวลาปิดเพลงในอีก ${mins} นาที 🌙`, 'success');
        }}
        onSetStopAtEnd={(enable) => {
          setSleepTimerSecondsLeft(null);
          setSleepTimerStopAtEnd(enable);
          showToast('ตั้งเวลาหยุดเล่นเมื่อจบเพลงปัจจุบันแล้ว 🌙', 'success');
        }}
        onCancelTimer={() => {
          setSleepTimerSecondsLeft(null);
          setSleepTimerStopAtEnd(false);
          showToast('ยกเลิกตัวตั้งเวลาปิดเพลงแล้ว', 'info');
        }}
        onAddMinutes={(mins) => {
          setSleepTimerSecondsLeft((prev) => (prev || 0) + mins * 60);
          showToast(`เพิ่มเวลาอีก ${mins} นาที ⏱️`, 'info');
        }}
      />

      {/* Social Story / Share Card Modal */}
      <ShareCardModal
        isOpen={isShareCardModalOpen}
        onClose={() => setIsShareCardModalOpen(false)}
        room={roomMetadata}
        currentVideo={video}
        onlineCount={onlineCount}
        onShowToast={showToast}
      />

      {/* Live TV Channels Modal (623 Channels with Country & Category Filters) */}
      <LiveTVModal
        isOpen={isLiveTVModalOpen}
        onClose={() => setIsLiveTVModalOpen(false)}
        currentVideo={video}
        onPlayChannel={handlePlayLiveChannel}
        onAddToQueue={handleAddLiveChannelToQueue}
        onShowToast={showToast}
      />

      {/* Install App Modal (APK Download & Instructions) */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Global Ad Popup for Website Visitors */}
      <AdPopupModal adPopup={platformConfig?.adPopup} />
    </div>
  );
}

export default App;
