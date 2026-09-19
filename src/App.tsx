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
import { ListMusic, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { Navbar } from './components/Navbar.js';
import { VideoPlayer } from './components/VideoPlayer.js';
import { VoiceStage } from './components/VoiceStage.js';
import { LiveChat } from './components/LiveChat.js';
import { HomeView } from './components/HomeView.js';
import { ProfileModal } from './components/ProfileModal.js';
import { PlaylistModal } from './components/PlaylistModal.js';
import { SoundboardModal } from './components/SoundboardModal.js';
import { AuthModal } from './components/AuthModal.js';
import { CreateRoomModal, CreateRoomForm } from './components/CreateRoomModal.js';
import { PasswordGateModal } from './components/PasswordGateModal.js';
import { AdminPanelModal } from './components/AdminPanelModal.js';
import { SuperAdminUnlockModal } from './components/SuperAdminUnlockModal.js';
import { SuperAdminDashboardModal } from './components/SuperAdminDashboardModal.js';
import { SupportModal } from './components/SupportModal.js';
import { FloatingItem } from './components/FloatingReactions.js';
import { soundSynthesizer } from './services/soundEffects.js';
import { ToastContainer, ToastItem } from './components/Toast.js';

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
    videoId: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio - beats to relax/study to',
    channel: 'Lofi Girl',
    duration: 0,
    currentTime: 0,
    isPlaying: true,
    lastUpdated: Date.now(),
  });
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [loopMode, setLoopMode] = useState<LoopMode>('all');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [pendingStageRequests, setPendingStageRequests] = useState<StageRequest[]>([]);
  const [approvedSpeakerIds, setApprovedSpeakerIds] = useState<string[]>([]);
  const [activeMobileTab, setActiveMobileTab] = useState<'stage' | 'chat'>('stage');

  // Modals State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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

    seatedSpeakers.forEach((seat) => {
      if (seat.user) {
        // If both are seated: user with smaller ID initiates
        // If local user is audience listener: listener initiates to request audio from speaker
        const isInitiator = mySeat ? currentUser.id < seat.user.id : true;
        webrtcRef.current?.connectToPeer(seat.user.id, isInitiator);
      }
    });
  }, [seats, currentUser.id]);

  // Handle URL Hash change (Room vs Home)
  useEffect(() => {
    const handleHashChange = () => {
      const targetRoom = getHashRoomId();
      if (targetRoom) {
        setRoomId(targetRoom);
        setCurrentView('room');
        socketService.send({
          type: 'JOIN_ROOM',
          roomId: targetRoom,
          user: currentUser,
        });
      } else {
        setCurrentView('home');
        fetchPublicRooms();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, fetchPublicRooms]);

  // Setup WebSocket connection and event handlers
  useEffect(() => {
    socketService.connect(() => {
      if (currentView === 'room') {
        socketService.send({
          type: 'JOIN_ROOM',
          roomId,
          user: currentUser,
        });
      } else {
        socketService.send({ type: 'GET_ROOMS' });
      }
    });

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

        case 'PLAY_SOUND':
          soundSynthesizer.play(msg.soundId);
          showToast(`${msg.playedBy.name} เล่นเสียง "${msg.soundName}" 📢`, 'info');
          break;

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
      unsubscribe();
    };
  }, [roomId, currentUser, currentView, showToast, fetchPublicRooms]);

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
    socketService.send({
      type: 'JOIN_ROOM',
      roomId: targetRoomId,
      user: currentUser,
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
    socketService.send({
      type: 'TAKE_SEAT',
      seatNumber,
    });
  };

  const handleLeaveSeat = () => {
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
    socketService.send({
      type: 'SPEAKING_STATE',
      isSpeaking,
    });
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
    socketService.send({
      type: 'PLAYLIST_ADD',
      item,
    });
  };

  const handleRemovePlaylistItem = (id: string) => {
    socketService.send({
      type: 'PLAYLIST_REMOVE',
      id,
    });
  };

  const handleClearPlaylist = () => {
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

  const handleTriggerSound = (soundId: string, soundName: string) => {
    socketService.send({
      type: 'PLAY_SOUND',
      soundId,
      soundName,
    });
  };

  const handleRemoveReaction = (id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="h-screen max-h-screen bg-[#0f0f13] text-gray-100 flex flex-col overflow-hidden selection:bg-purple-500 selection:text-white">
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
        onNavigateHome={handleNavigateHome}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenPlaylist={() => setIsPlaylistModalOpen(true)}
        onOpenSoundboard={() => setIsSoundboardOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSupport={() => setIsSupportModalOpen(true)}
        onOpenSuperAdminDashboard={() => {
          if (isSuperAdmin) {
            setIsSuperAdminModalOpen(true);
          } else {
            setIsSuperAdminUnlockModalOpen(true);
          }
        }}
        onShowToast={showToast}
      />

      {/* Main View Router */}
      {currentView === 'home' ? (
        <HomeView
          rooms={roomsList}
          currentUser={currentUser}
          onSelectRoom={handleSelectRoom}
          onOpenCreateRoom={() => setIsCreateRoomModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      ) : (
        <main className="flex-1 min-h-0 max-w-[1920px] w-full mx-auto p-2 sm:p-3 lg:p-3.5 flex flex-col lg:grid lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-3.5 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Synchronized Video Player & 9-Seat Voice Stage */}
          <div className="w-full lg:col-span-8 flex flex-col shrink-0 lg:shrink lg:h-full min-h-0 gap-2 sm:gap-2.5">
            {/* Synchronized YouTube Video Player */}
            <div className="w-full aspect-video max-h-[36vh] sm:max-h-[46vh] lg:max-h-none lg:flex-1 min-h-0 flex items-center justify-center bg-black/50 rounded-2xl overflow-hidden border border-gray-800/80 shadow-2xl relative shrink-0">
              <VideoPlayer
                video={video}
                reactions={reactions}
                onRemoveReaction={handleRemoveReaction}
                isSomeoneSpeaking={isSomeoneSpeaking}
                isAudioDuckingEnabled={isAudioDuckingEnabled}
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
                onShowToast={showToast}
              />
            </div>

            {/* Current Video Info Banner & Quick Playback Controls */}
            <div className="bg-[#151722]/80 border border-gray-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between shrink-0 gap-2 overflow-x-auto">
              <div className="min-w-0 flex-1 pr-2">
                <h2 className="text-xs sm:text-sm font-semibold text-white truncate" title={video.title}>
                  {video.title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span className="truncate max-w-[140px] sm:max-w-[220px]">{video.channel}</span>
                  {playlist.length > 0 && (
                    <span className="text-[10px] text-purple-300 font-mono bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-500/30 shrink-0">
                      คิว: {playlist.findIndex((p) => p.videoId === video.videoId) >= 0 ? playlist.findIndex((p) => p.videoId === video.videoId) + 1 : 1}/{playlist.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Playback & Queue Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Prev Track */}
                <button
                  type="button"
                  onClick={handlePrevTrack}
                  title="เพลงก่อนหน้า (Previous Track)"
                  disabled={playlist.length === 0}
                  className="p-1.5 rounded-lg bg-gray-800/70 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                {/* Shuffle Button */}
                <button
                  type="button"
                  onClick={handleToggleShuffle}
                  title={isShuffle ? 'สุ่มเพลง: เปิด (คลิกเพื่อปิด)' : 'สุ่มเพลง: ปิด (คลิกเพื่อเปิด)'}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isShuffle
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-gray-800/70 text-gray-400 border-gray-700/60 hover:text-gray-200'
                  }`}
                >
                  <Shuffle className={`w-3.5 h-3.5 ${isShuffle ? 'text-amber-400' : 'opacity-60'}`} />
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
                  title={
                    loopMode === 'single'
                      ? 'โหมด: ซ้ำเพลงเดิม 🔂 (คลิกเพื่อเปลี่ยน)'
                      : loopMode === 'all'
                      ? 'โหมด: วนทุกเพลงตามคิว 🔁 (คลิกเพื่อเปลี่ยน)'
                      : 'โหมด: เล่นรอบเดียว ➡️ (คลิกเพื่อเปิดวนซ้ำ)'
                  }
                  className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all cursor-pointer ${
                    loopMode !== 'off'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-gray-800/70 text-gray-400 border-gray-700/60 hover:text-gray-200'
                  }`}
                >
                  {loopMode === 'single' ? (
                    <>
                      <Repeat1 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] hidden sm:inline">ซ้ำ 1</span>
                    </>
                  ) : loopMode === 'all' ? (
                    <>
                      <Repeat className="w-3.5 h-3.5 text-emerald-400" />
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
                  className="p-1.5 rounded-lg bg-gray-800/70 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                {/* Open Playlist Modal Button */}
                <button
                  type="button"
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ListMusic className="w-3.5 h-3.5 text-purple-400" />
                  <span>จัดการคิว</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-[10px] font-mono">
                    {playlist.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Mobile / Tablet Tab Switcher (Visible on < lg screens only) */}
            <div className="flex lg:hidden items-center bg-[#151722] border border-gray-800 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveMobileTab('stage')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeMobileTab === 'stage'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>🎙️ เวทีไมค์ 9 ที่นั่ง</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab('chat')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeMobileTab === 'chat'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>💬 แชทสด</span>
                {chat.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                    {chat.length}
                  </span>
                )}
              </button>
            </div>

            {/* 9-Seat Voice Stage */}
            <div className={`${activeMobileTab === 'stage' ? 'block' : 'hidden'} lg:block shrink-0`}>
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
                onShowToast={showToast}
                onRequestToSpeak={handleRequestToSpeak}
                onApproveSpeakRequest={handleApproveSpeakRequest}
                onRevokeSpeakPermission={handleRevokeSpeakPermission}
              />
            </div>
          </div>

          {/* Right Column: Live Chat Panel */}
          <div className={`${activeMobileTab === 'chat' ? 'flex' : 'hidden'} lg:flex w-full lg:col-span-4 h-[440px] sm:h-[500px] lg:h-full min-h-0 flex-col overflow-hidden`}>
            <LiveChat
              messages={chat}
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
              onSendReaction={handleSendReaction}
              onSeekTo={handleVideoSeek}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onShowToast={showToast}
            />
          </div>
        </main>
      )}

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSave={handleSaveProfile}
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

      <SoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
        onTriggerSound={handleTriggerSound}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
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
