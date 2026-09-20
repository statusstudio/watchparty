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
} from './types/index.js';
import { getStoredUser, saveUser, clearUser } from './services/auth.js';
import { socketService } from './services/socket.js';
import { WebRTCVoiceEngine } from './services/webrtc.js';
import { ListMusic, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, MessageSquare, Users, Crown, Shield, Mic, Plus, Radio, RefreshCw, Moon } from 'lucide-react';
import { Navbar } from './components/Navbar.js';
import { VideoPlayer } from './components/VideoPlayer.js';
import { VoiceStage } from './components/VoiceStage.js';
import { LiveChat } from './components/LiveChat.js';
import { SidebarQueue } from './components/SidebarQueue.js';
import { HomeView } from './components/HomeView.js';
import { ProfileModal } from './components/ProfileModal.js';
import { AuthModal } from './components/AuthModal.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import { UserCardModal } from './components/UserCardModal.js';
import { PlaylistModal } from './components/PlaylistModal.js';
import { CreateRoomModal, CreateRoomForm } from './components/CreateRoomModal.js';
import { PasswordGateModal } from './components/PasswordGateModal.js';
import { AdminPanelModal } from './components/AdminPanelModal.js';
import { SuperAdminUnlockModal } from './components/SuperAdminUnlockModal.js';
import { SuperAdminDashboardModal } from './components/SuperAdminDashboardModal.js';
import { SupportModal } from './components/SupportModal.js';
import { FloatingItem } from './components/FloatingReactions.js';
import { ToastContainer, ToastItem } from './components/Toast.js';
import {
  isSupabaseConfigured,
  supabase,
  fetchProfile,
  addFavorite,
  removeFavorite,
  checkIsFavorite,
} from './services/supabase.js';

function getHashRoomId(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/room=([a-zA-Z0-9_-]+)/);
  return match && match[1] ? match[1] : null;
}

export function App() {
  const initialRoom = getHashRoomId();
  const [currentView, setCurrentView] = useState<'home' | 'room'>(initialRoom ? 'room' : 'home');
  const [roomId, setRoomId] = useState<string>(initialRoom || 'squad-chill');
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
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [myRole, setMyRole] = useState<UserRole>('member');

  // Password Gate
  const [isPasswordGateOpen, setIsPasswordGateOpen] = useState(false);
  const [passwordGateRoomName, setPasswordGateRoomName] = useState('');
  const [passwordGateError, setPasswordGateError] = useState<string | null>(null);

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
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<UserProfile | null>(null);
  const [isUserCardModalOpen, setIsUserCardModalOpen] = useState(false);
  const [selectedUserForCard, setSelectedUserForCard] = useState<UserProfile | null>(null);
  const [isVideoFavorite, setIsVideoFavorite] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAudioDuckingEnabled, setIsAudioDuckingEnabled] = useState(true);

  // Super Admin & Support State
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    return localStorage.getItem('watchparty_superadmin') === 'true' || currentUser.id === 'usr-admin-system';
  });
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [isSuperAdminUnlockModalOpen, setIsSuperAdminUnlockModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Interactive Reactions
  const [reactions, setReactions] = useState<FloatingItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const isSomeoneSpeaking = seats.some((s) => s.isSpeaking && !s.isMuted);

  // WebRTC engine reference
  const webrtcRef = useRef<WebRTCVoiceEngine | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = 't-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
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

  // Refresh Room & Pull-to-Refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const isPullingRef = useRef(false);

  // Unified Refresh (Home Lobby or Room)
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    if (currentView === 'home') {
      showToast('กำลังรีเฟรชรายการห้อง... 🔄', 'info');
      fetchPublicRooms();
      socketService.send({ type: 'GET_ROOMS' });

      setTimeout(() => {
        setIsRefreshing(false);
        showToast('รีเฟรชหน้าหลักเรียบร้อยแล้ว ✨', 'success');
      }, 600);
    } else {
      showToast('กำลังรีเฟรชข้อมูลห้อง... 🔄', 'info');

      const currentRoom = roomId || getHashRoomId();
      if (currentRoom) {
        socketService.send({
          type: 'JOIN_ROOM',
          roomId: currentRoom,
          user: currentUser,
        });
      }
      fetchPublicRooms();

      setTimeout(() => {
        setIsRefreshing(false);
        showToast('รีเฟรชห้องสำเร็จ เรียลไทม์พร้อมใช้งาน! ✨', 'success');
      }, 800);
    }
  }, [isRefreshing, currentView, roomId, currentUser, showToast, fetchPublicRooms]);

  // Pull-to-refresh listener on touch devices (Supported on both Home and Room)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartYRef.current = touch.clientY;
      touchStartXRef.current = touch.clientX;
      isPullingRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isRefreshing) return;
      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartYRef.current;
      const deltaX = touch.clientX - touchStartXRef.current;

      // Detect downward drag when page is scrolled to top
      if (deltaY > 15 && deltaY > Math.abs(deltaX) * 1.2) {
        // If touching inside a scrollable container (e.g. chat messages or queue) that is scrolled down, do not trigger pull-to-refresh
        let target = e.target as HTMLElement | null;
        let isInnerScrolled = false;
        while (target && target !== document.body) {
          if (target.scrollTop > 5) {
            isInnerScrolled = true;
            break;
          }
          target = target.parentElement;
        }
        if (isInnerScrolled) return;

        const mainEl = document.querySelector('main');
        const homeEl = document.getElementById('home-view-scroll');
        const currentScrollTop = currentView === 'home'
          ? (homeEl ? homeEl.scrollTop : window.scrollY || 0)
          : (mainEl ? mainEl.scrollTop : 0);

        if (currentScrollTop <= 5) {
          isPullingRef.current = true;
          const distance = Math.min(85, (deltaY - 15) * 0.45);
          setPullDistance(distance);
        }
      }
    };

    const handleTouchEnd = () => {
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
  }, [isRefreshing, pullDistance, handleRefresh]);

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

  // Instant Room State Sync via REST API (Dual-Channel with WebSocket)
  const syncRoomState = useCallback((targetRoomId: string) => {
    fetch(`/api/room/${targetRoomId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((state: RoomState) => {
        if (state && (state.roomId === targetRoomId || !state.roomId)) {
          setIsPasswordGateOpen(false);
          setPasswordGateError(null);
          if (state.metadata) setRoomMetadata(state.metadata);
          if (state.seats) setSeats(state.seats);
          if (state.video) setVideo(state.video);
          if (state.playlist) setPlaylist(state.playlist);
          if (state.loopMode) setLoopMode(state.loopMode);
          if (state.isShuffle !== undefined) setIsShuffle(state.isShuffle);
          if (state.chat) setChat(state.chat);
          if (state.members) setMembers(state.members);
          if (state.bannedUsers) setBannedUsers(state.bannedUsers);
          if (state.onlineCount) setOnlineCount(state.onlineCount);
          if (state.myRole) setMyRole(state.myRole);
          if (state.approvedSpeakerIds) setApprovedSpeakerIds(state.approvedSpeakerIds);
          if (state.pendingStageRequests) setPendingStageRequests(state.pendingStageRequests);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch room state via REST:', err);
      });
  }, []);

  // Handle URL Hash change (Room vs Home)
  useEffect(() => {
    const handleHashChange = () => {
      const targetRoom = getHashRoomId();
      if (targetRoom) {
        setRoomId(targetRoom);
        setCurrentView('room');
        syncRoomState(targetRoom);
        socketService.send({
          type: 'JOIN_ROOM',
          roomId: targetRoom,
          user: currentUserRef.current,
        });
      } else {
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
        socketService.send({
          type: 'JOIN_ROOM',
          roomId: activeRoom,
          user: currentUserRef.current,
        });
        syncRoomState(activeRoom);
      } else {
        socketService.send({ type: 'GET_ROOMS' });
      }
    });

    socketService.connect();

    // Immediate initial sync if starting directly inside a room
    const initialHashRoom = getHashRoomId();
    if (initialHashRoom) {
      syncRoomState(initialHashRoom);
    }

    const unsubscribe = socketService.subscribe((msg: WSServerMessage) => {
      switch (msg.type) {
        case 'ROOMS_LIST':
          setRoomsList(msg.rooms);
          break;

        case 'PASSWORD_REQUIRED':
          setIsPasswordGateOpen(true);
          setPasswordGateRoomName(msg.roomName);
          setPasswordGateError(null);
          break;

        case 'PASSWORD_ERROR':
          setPasswordGateError(msg.message);
          break;

        case 'YOU_WERE_KICKED':
          showToast(msg.reason, 'warning');
          setIsPasswordGateOpen(false);
          setIsAdminPanelOpen(false);
          window.location.hash = '';
          setCurrentView('home');
          fetchPublicRooms();
          break;

        case 'YOU_WERE_BANNED':
          showToast(msg.reason, 'warning');
          setIsPasswordGateOpen(false);
          setIsAdminPanelOpen(false);
          window.location.hash = '';
          setCurrentView('home');
          fetchPublicRooms();
          break;

        case 'YOU_WERE_SUSPENDED':
          showToast(msg.reason, 'warning');
          setIsPasswordGateOpen(false);
          setIsAdminPanelOpen(false);
          setIsSuperAdminModalOpen(false);
          window.location.hash = '';
          setCurrentView('home');
          fetchPublicRooms();
          break;

        case 'ROOM_FORCE_CLOSED':
          showToast(msg.reason, 'warning');
          setIsPasswordGateOpen(false);
          setIsAdminPanelOpen(false);
          window.location.hash = '';
          setCurrentView('home');
          fetchPublicRooms();
          break;

        case 'ROOM_INIT':
          setIsPasswordGateOpen(false);
          setPasswordGateError(null);
          setRoomMetadata(msg.state.metadata);
          setSeats(msg.state.seats);
          setVideo(msg.state.video);
          setPlaylist(msg.state.playlist);
          setLoopMode(msg.state.loopMode);
          setIsShuffle(msg.state.isShuffle ?? false);
          setChat(msg.state.chat);
          setMembers(msg.state.members);
          setBannedUsers(msg.state.bannedUsers);
          setOnlineCount(msg.state.onlineCount);
          setMyRole(msg.state.myRole);
          setUnreadChatCount(0);
          if (msg.state.approvedSpeakerIds) {
            setApprovedSpeakerIds(msg.state.approvedSpeakerIds);
          }
          if (msg.state.pendingStageRequests) {
            setPendingStageRequests(msg.state.pendingStageRequests);
          }
          break;

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

        case 'MEMBERS_UPDATED':
          setMembers(msg.members);
          setOnlineCount(msg.onlineCount);
          // Re-evaluate my role
          const me = msg.members.find((m) => m.user.id === currentUser.id);
          if (me) {
            setMyRole(me.role);
          }
          break;

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
            const actionText = {
              play: 'กดเล่นวิดีโอ ▶️',
              pause: 'กดพักวิดีโอ ⏸️',
              seek: 'เลื่อนแถบเวลา ⏩',
              change: 'เปลี่ยนเพลงใหม่ 🎵',
            }[msg.actionType];
            showToast(`${msg.triggeredByName} ${actionText}`, 'info');
          }
          break;

        case 'PLAYLIST_UPDATED':
          setPlaylist(msg.playlist);
          setLoopMode(msg.loopMode);
          setIsShuffle(msg.isShuffle ?? false);
          break;

        case 'NEW_CHAT':
          setChat((prev) => [...prev, msg.message]);
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

        case 'SIGNAL_DATA':
          webrtcRef.current?.handleSignal(msg.senderId, msg.data);
          break;

        case 'SYNC_TOAST':
          showToast(msg.message, msg.toastType);
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

  // Navigate actions
  const handleNavigateHome = () => {
    setIsPasswordGateOpen(false);
    setPasswordGateError(null);
    window.location.hash = '';
    setCurrentView('home');
    fetchPublicRooms();
  };

  const handleSelectRoom = (targetRoomId: string) => {
    window.location.hash = `#room=${targetRoomId}`;
    setRoomId(targetRoomId);
    setCurrentView('room');
    syncRoomState(targetRoomId);
    socketService.send({
      type: 'JOIN_ROOM',
      roomId: targetRoomId,
      user: currentUserRef.current,
    });
  };

  // Auth actions
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    saveUser(user);
    socketService.send({
      type: 'UPDATE_PROFILE',
      user,
    });
    showToast(`ยินดีต้อนรับคุณ ${user.name}! เข้าสู่ระบบสำเร็จ 🎉`, 'success');
  };

  const handleLogout = () => {
    clearUser();
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
        showToast(`สร้างห้อง "${form.name}" สำเร็จ! 🎉`, 'success');
        handleSelectRoom(data.roomId);
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการสร้างห้อง', 'warning');
    }
  };

  // Password Gate submit
  const handlePasswordSubmit = (password: string) => {
    socketService.send({
      type: 'VERIFY_ROOM_PASSWORD',
      roomId,
      password,
      user: currentUser,
    });
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
  }) => {
    socketService.send({
      type: 'UPDATE_ROOM_SETTINGS',
      settings,
    });
    showToast('บันทึกการตั้งค่าห้องเรียบร้อยแล้ว 🎉', 'success');
  };

  // Profile Save
  const handleSaveProfile = (updated: UserProfile) => {
    setCurrentUser(updated);
    saveUser(updated);
    socketService.send({
      type: 'UPDATE_PROFILE',
      user: updated,
    });
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

  // Stage speak request interactions
  const handleRequestToSpeak = (seatNumber?: number) => {
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

  // Handle Video End (Server-authoritative auto advance playlist)
  const handleVideoEnd = () => {
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
  const handleSendMessage = (text: string) => {
    socketService.send({
      type: 'SEND_CHAT',
      text,
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

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#0f0f13] text-gray-100 flex flex-col overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        roomId={roomId}
        roomName={roomMetadata.name}
        isPrivate={roomMetadata.isPrivate}
        onlineCount={onlineCount}
        currentUser={currentUser}
        myRole={myRole}
        isSuperAdmin={isSuperAdmin}
        isRefreshing={isRefreshing}
        onRefreshRoom={handleRefresh}
        onToggleOledSleep={() => setIsOledSleepMode(true)}
        onNavigateHome={handleNavigateHome}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenFullProfile={() => {
          setSelectedUserForProfile(currentUser);
          setIsUserProfileModalOpen(true);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenSuperAdminDashboard={() => {
          if (isSuperAdmin) {
            setIsSuperAdminModalOpen(true);
          } else {
            setIsSuperAdminUnlockModalOpen(true);
          }
        }}
        onShowToast={showToast}
      />

      {/* Pull-to-refresh floating indicator (Active on both Home and Room) */}
      {(pullDistance > 0 || isRefreshing) && (
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

      {/* Main View Router */}
      {currentView === 'home' ? (
        <HomeView
          rooms={roomsList}
          currentUser={currentUser}
          onSelectRoom={handleSelectRoom}
          onOpenCreateRoom={() => setIsCreateRoomModalOpen(true)}
        />
      ) : (
        <main className="flex-1 min-h-0 max-w-[1920px] w-full mx-auto p-2 sm:p-3 lg:p-3.5 flex flex-col lg:grid lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-3.5 overflow-hidden bg-[#f6f5f4]">
          {/* Left Column: Synchronized Video Player & Open Voice Bar (Desktop: 8 cols) */}
          <div className="w-full lg:col-span-8 flex flex-col shrink-0 lg:shrink lg:h-full min-h-0 gap-2 sm:gap-2.5">
            {/* Synchronized YouTube Video Player */}
            <div className="w-full aspect-video max-h-[25vh] sm:max-h-[34vh] lg:max-h-none lg:flex-1 min-h-0 flex items-center justify-center bg-black rounded-xl overflow-hidden border border-[#e6e6e6] shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative shrink-0">
              <VideoPlayer
                video={video}
                reactions={reactions}
                onRemoveReaction={handleRemoveReaction}
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
                onVideoEnd={handleVideoEnd}
                onNextTrack={handleNextTrack}
                onPrevTrack={handlePrevTrack}
                onShowToast={showToast}
              />
            </div>

            {/* Current Video Info Banner & Quick Controls - Notion White Surface */}
            <div className="bg-white border border-[#e6e6e6] rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center justify-between shrink-0 gap-1.5 sm:gap-2 shadow-xs">
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

              {/* Quick Playback Buttons */}
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
              </div>
            </div>

            {/* Mobile / Tablet Tab Switcher (Visible on < lg screens only) - Notion Style */}
            <div className="flex lg:hidden items-center bg-white border border-[#e6e6e6] rounded-xl p-1 shrink-0 overflow-x-auto shadow-xs">
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
          </div>

          {/* Right Column: GroupTube Multi-Tab Sidebar (Desktop 4 cols, Mobile conditional) - Notion Card Style */}
          <div className={`w-full lg:col-span-4 flex-1 lg:h-full min-h-0 flex flex-col bg-white rounded-xl border border-[#e6e6e6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ${
            activeMobileTab === 'voice' ? 'hidden lg:flex' : 'flex'
          }`}>
            {/* Desktop Tab Switcher */}
            <div className="hidden lg:flex items-center p-1.5 border-b border-[#e6e6e6] bg-[#f6f5f4] shrink-0 gap-1">
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
                onSendMessage={handleSendMessage}
                onSendReaction={handleSendReaction}
                onSeekTo={handleVideoSeek}
                onOpenProfile={() => setIsProfileModalOpen(true)}
                onSelectUser={handleOpenUserCard}
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
              <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
                <span className="text-xs font-semibold text-gray-300">สมาชิกออนไลน์ทั้งหมด</span>
                <span className="text-[11px] text-violet-400 font-mono">
                  {members.length || onlineCount} คน
                </span>
              </div>

              {members.map((m) => {
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
                    className="flex items-center justify-between p-2 rounded-xl bg-[#171824]/60 hover:bg-[#1a1c2b] border border-gray-800/60 transition-colors cursor-pointer group"
                    title={`ดูโปรไฟล์ของ ${m.user.name}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 relative"
                        style={{ borderColor: m.user.color }}
                      >
                        <img
                          src={m.user.avatar}
                          alt={m.user.name}
                          className="w-full h-full object-cover"
                        />
                        {isMemberSpeaking && (
                          <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-semibold truncate max-w-[110px]"
                            style={{ color: m.user.color }}
                          >
                            {m.user.name}
                          </span>
                          {m.user.id === currentUser.id && (
                            <span className="text-[10px] text-gray-500">(คุณ)</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mt-0.5">
                          {m.role === 'owner' ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 text-[9px] font-bold border border-amber-500/20 flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5 text-amber-400" />
                              เจ้าของ
                            </span>
                          ) : m.role === 'admin' ? (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 text-[9px] font-bold border border-purple-500/20 flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5 text-purple-400" />
                              แอดมิน
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500">สมาชิก</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Voice indicator tag */}
                    <div>
                      {isMemberInVoice ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                          <Mic className="w-3 h-3" />
                          <span>ในสาย</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500">ผู้ฟัง</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
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
        onPlaySong={(videoId, title, channel) => {
          handleVideoChange(videoId, title, channel);
          setIsUserProfileModalOpen(false);
          showToast(`เปิดเพลง: ${title} 🎵`, 'success');
        }}
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
        onOpenSupport={() => setIsSupportModalOpen(true)}
        onOpenSuperAdmin={() => setIsSuperAdminUnlockModalOpen(true)}
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

      <SuperAdminDashboardModal
        isOpen={isSuperAdminModalOpen}
        onClose={() => setIsSuperAdminModalOpen(false)}
        currentUser={currentUser}
        onShowToast={showToast}
      />
    </div>
  );
}

export default App;
