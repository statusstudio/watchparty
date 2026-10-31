import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Image as ImageIcon,
  Radio,
  Search,
  User,
  Check,
  CheckCheck,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Plus,
  Loader2,
  Phone,
  Video,
} from 'lucide-react';
import { UserProfile, DirectMessage, ConversationSummary } from '../../types/index.js';
import { socketService } from '../../services/socket.js';

interface DirectMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialPartner?: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    color?: string;
  } | null;
  currentRoomId?: string | null;
  currentRoomName?: string | null;
  onJoinRoom?: (roomId: string) => void;
  onNavigateToProfile?: (usernameOrId: string) => void;
  onStartCall?: (partner: { id: string; name: string; username?: string; avatar: string; color?: string }, isVideo: boolean) => void;
}

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialPartner,
  currentRoomId,
  currentRoomName,
  onJoinRoom,
  onNavigateToProfile,
  onStartCall,
}) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activePartner, setActivePartner] = useState<{
    id: string;
    name: string;
    username?: string;
    avatar: string;
    color?: string;
    activeRoom?: { roomId: string; roomName: string } | null;
  } | null>(null);

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [includeRoomInvite, setIncludeRoomInvite] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations list
  const loadConversations = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/dm/conversations?userId=${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to load DM conversations:', err);
    }
  };

  // Fetch messages between currentUser and activePartner
  const loadMessages = async (partnerId: string) => {
    if (!currentUser?.id || !partnerId) return;
    setIsLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/dm/messages?userId=${encodeURIComponent(currentUser.id)}&partnerId=${encodeURIComponent(partnerId)}&limit=100`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Mark conversation as read
        markAsRead(partnerId);
      }
    } catch (err) {
      console.error('Failed to load DM messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const markAsRead = async (partnerId: string) => {
    if (!currentUser?.id || !partnerId) return;
    try {
      await fetch('/api/dm/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, partnerId }),
      });
      // Locally update conversation unread count
      setConversations((prev) =>
        prev.map((c) => (c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to mark DM read:', err);
    }
  };

  // On open or initial partner changed
  useEffect(() => {
    if (isOpen && currentUser?.id) {
      loadConversations();
      if (initialPartner && initialPartner.id !== currentUser.id) {
        setActivePartner({
          id: initialPartner.id,
          name: initialPartner.name,
          username: initialPartner.username,
          avatar: initialPartner.avatar,
          color: initialPartner.color || '#0075de',
          activeRoom: null,
        });
        loadMessages(initialPartner.id);
      }
    }
  }, [isOpen, initialPartner, currentUser?.id]);

  // Handle active partner change
  useEffect(() => {
    if (activePartner && currentUser?.id) {
      loadMessages(activePartner.id);
    }
  }, [activePartner?.id]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingMessages]);

  // Realtime WebSocket listener for new DM messages
  useEffect(() => {
    const unsubscribe = socketService.subscribe((msg: any) => {
      if (!msg) return;

      if (msg.type === 'DM_NEW_MESSAGE' && msg.message) {
        const newDm: DirectMessage = msg.message;
        const myId = currentUser?.id;

        // Is this message relevant to me?
        if (newDm.senderId === myId || newDm.recipientId === myId) {
          // If message is in currently open chat thread:
          if (
            activePartner &&
            (newDm.senderId === activePartner.id || newDm.recipientId === activePartner.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newDm.id)) return prev;
              return [...prev, newDm];
            });
            // If I'm the recipient and chat is active, mark read immediately
            if (newDm.recipientId === myId) {
              markAsRead(activePartner.id);
            }
          }
          // Refresh conversation summaries
          loadConversations();
        }
      } else if (msg.type === 'DM_CONVERSATION_READ') {
        if (activePartner && msg.readerId === activePartner.id) {
          // Partner read our messages! Update read status on messages
          setMessages((prev) =>
            prev.map((m) => (m.senderId === currentUser?.id ? { ...m, read: true } : m))
          );
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activePartner, currentUser?.id]);

  // Image upload handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 1200px width/height for fast transfer
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setAttachedImage(compressed);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activePartner || !currentUser?.id) return;

    const trimmed = inputText.trim();
    if (!trimmed && !attachedImage && !includeRoomInvite) return;

    setIsSending(true);

    const payload: any = {
      senderId: currentUser.id,
      senderName: currentUser.name || 'ฉัน',
      senderAvatar: currentUser.avatar || '',
      senderColor: currentUser.color || '#0075de',
      recipientId: activePartner.id,
      recipientName: activePartner.name,
      recipientAvatar: activePartner.avatar,
      recipientColor: activePartner.color || '#0075de',
      text: trimmed,
    };

    if (attachedImage) {
      payload.imageUrl = attachedImage;
    }

    if (includeRoomInvite && currentRoomId && currentRoomName) {
      payload.roomInvite = {
        roomId: currentRoomId,
        roomName: currentRoomName,
      };
    }

    try {
      const res = await fetch('/api/dm/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        setInputText('');
        setAttachedImage(null);
        setIncludeRoomInvite(false);
        loadConversations();
      } else {
        alert('ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      console.error('Failed to send DM:', err);
      alert('เกิดข้อผิดพลาดในการส่งข้อความ');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  // Filter conversations by search
  const filteredConversations = conversations.filter(
    (c) =>
      c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.partnerUsername && c.partnerUsername.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[780px] bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#1e293b]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                ข้อความส่วนตัว (Direct Messages)
              </h2>
              <p className="text-xs text-white/50">คุย 1 ต่อ 1 เรียลไทม์ และแชร์ห้องปาร์ตี้</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Responsive 2 Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Conversations List */}
          <div
            className={`w-full md:w-80 lg:w-88 flex-shrink-0 border-r border-white/10 bg-[#0b1120] flex flex-col ${
              activePartner ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Box */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="ค้นหาบทสนทนา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50"
                />
              </div>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-white/40 flex flex-col items-center">
                  <MessageCircle className="w-10 h-10 mb-2 opacity-30 text-pink-400" />
                  <p className="text-sm font-medium">ยังไม่มีบทสนทนา</p>
                  <p className="text-xs text-white/30 mt-1">
                    เข้าสู่หน้าโปรไฟล์ของเพื่อนแล้วกด "ส่งข้อความ" เพื่อเริ่มต้นแชท!
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = activePartner?.id === c.partnerId;
                  return (
                    <button
                      key={c.partnerId}
                      onClick={() => {
                        setActivePartner({
                          id: c.partnerId,
                          name: c.partnerName,
                          username: c.partnerUsername,
                          avatar: c.partnerAvatar,
                          color: c.partnerColor,
                          activeRoom: c.activeRoom,
                        });
                      }}
                      className={`w-full p-3 flex items-center gap-3 text-left transition-colors relative ${
                        isSelected
                          ? 'bg-pink-500/15 border-l-4 border-pink-500'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Avatar with status */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={c.partnerAvatar || '/default-avatar.png'}
                          alt={c.partnerName}
                          className="w-11 h-11 rounded-full object-cover border border-white/20"
                          style={{ borderColor: c.partnerColor || '#0075de' }}
                        />
                        {c.activeRoom && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0b1120] rounded-full animate-pulse"
                            title="กำลังฟังเพลงในห้องปาร์ตี้"
                          />
                        )}
                      </div>

                      {/* Info & Last Message */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-sm text-white truncate">
                            {c.partnerName}
                          </span>
                          <span className="text-[10px] text-white/40 ml-2 whitespace-nowrap">
                            {formatTimeAgo(c.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-white/60 truncate pr-2">
                            {c.lastMessage}
                          </p>
                          {c.unreadCount > 0 && (
                            <span className="min-w-4.5 px-1.5 py-0.5 rounded-full bg-pink-500 text-[10px] font-bold text-white text-center flex-shrink-0">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                        {c.activeRoom && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1 truncate">
                            <Radio className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">ฟังใน {c.activeRoom.roomName}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation */}
          <div
            className={`flex-1 flex flex-col bg-[#0f172a] ${
              !activePartner ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activePartner ? (
              <>
                {/* Active Partner Top Bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#162033]/80">
                  <div className="flex items-center gap-3">
                    {/* Back Button on Mobile */}
                    <button
                      onClick={() => setActivePartner(null)}
                      className="md:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="relative">
                      <img
                        src={activePartner.avatar || '/default-avatar.png'}
                        alt={activePartner.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                        style={{ borderColor: activePartner.color || '#0075de' }}
                      />
                      {activePartner.activeRoom && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#162033] rounded-full" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{activePartner.name}</h3>
                        {activePartner.username && (
                          <span className="text-xs text-white/40">@{activePartner.username}</span>
                        )}
                      </div>
                      {activePartner.activeRoom ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                          <Radio className="w-3 h-3 animate-pulse" />
                          <span>กำลังฟังในห้อง: {activePartner.activeRoom.roomName}</span>
                          {onJoinRoom && (
                            <button
                              onClick={() => {
                                if (activePartner.activeRoom) {
                                  onJoinRoom(activePartner.activeRoom.roomId);
                                  onClose();
                                }
                              }}
                              className="ml-1 px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-semibold border border-emerald-500/40"
                            >
                              เข้าฟังด้วย
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-white/40">ออนไลน์</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {onStartCall && (
                      <>
                        <button
                          onClick={() => {
                            onStartCall(activePartner, false);
                          }}
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                          title="โทรด้วยเสียง (Voice Call)"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            onStartCall(activePartner, true);
                          }}
                          className="p-2 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 transition-colors"
                          title="วิดีโอคอล (Video Call)"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {onNavigateToProfile && activePartner.username && (
                      <button
                        onClick={() => {
                          onNavigateToProfile(activePartner.username || activePartner.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>โปรไฟล์</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {isLoadingMessages ? (
                    <div className="h-full flex items-center justify-center text-white/40">
                      <Loader2 className="w-6 h-6 animate-spin text-pink-500 mr-2" />
                      <span>กำลังโหลดข้อความ...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/40 p-8 text-center">
                      <div className="w-14 h-14 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center mb-3">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <p className="font-semibold text-white">เริ่มต้นบทสนทนากับ {activePartner.name}</p>
                      <p className="text-xs text-white/40 mt-1 max-w-xs">
                        ทักทาย แบ่งปันเพลงที่ชอบ หรือส่งคำชวนมาสนุกด้วยกันในห้องปาร์ตี้ได้เลย!
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === currentUser.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMe && (
                            <img
                              src={m.senderAvatar || '/default-avatar.png'}
                              alt={m.senderName}
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
                              style={{ borderColor: m.senderColor || '#0075de' }}
                            />
                          )}

                          <div
                            className={`max-w-[78%] sm:max-w-[68%] rounded-2xl p-3 ${
                              isMe
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-md'
                                : 'bg-[#1e293b] text-white rounded-tl-none border border-white/10'
                            }`}
                          >
                            {/* Attached Image */}
                            {m.imageUrl && (
                              <div className="mb-2 rounded-xl overflow-hidden border border-black/20">
                                <a
                                  href={m.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={m.imageUrl}
                                    alt="แนบรูป"
                                    className="max-h-60 w-full object-cover hover:scale-105 transition-transform duration-200"
                                  />
                                </a>
                              </div>
                            )}

                            {/* Room Invite Card */}
                            {m.roomInvite && (
                              <div className="mb-2 p-3 bg-black/30 rounded-xl border border-white/15 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-pink-400 text-xs font-bold">
                                  <Radio className="w-4 h-4 animate-pulse" />
                                  <span>คำชวนเข้าห้องปาร์ตี้ 🎵</span>
                                </div>
                                <p className="font-semibold text-sm text-white">
                                  {m.roomInvite.roomName}
                                </p>
                                {onJoinRoom && (
                                  <button
                                    onClick={() => {
                                      onJoinRoom(m.roomInvite!.roomId);
                                      onClose();
                                    }}
                                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow hover:brightness-110 flex items-center justify-center gap-1.5 transition-all"
                                  >
                                    <span>เข้าร่วมห้องนี้</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Call Log Card */}
                            {m.callInfo && (
                              <div className="flex items-center gap-3 py-1 px-1">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    m.callInfo.status === 'completed'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {m.callInfo.isVideo ? (
                                    <Video className="w-4 h-4" />
                                  ) : (
                                    <Phone className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="text-left min-w-0">
                                  <p className="text-xs font-bold leading-tight">
                                    {m.callInfo.status === 'completed'
                                      ? `การโทร${m.callInfo.isVideo ? 'วิดีโอ' : 'ด้วยเสียง'}`
                                      : 'สายที่ไม่ได้รับ'}
                                  </p>
                                  <p className="text-[10px] text-white/60 mt-0.5">
                                    {m.callInfo.status === 'completed' && m.callInfo.durationSeconds
                                      ? `${Math.floor(m.callInfo.durationSeconds / 60)}:${(
                                          m.callInfo.durationSeconds % 60
                                        )
                                          .toString()
                                          .padStart(2, '0')} นาที`
                                      : 'ไม่ได้เชื่อมต่อ'}
                                  </p>
                                </div>
                                {onStartCall && !isMe && (
                                  <button
                                    onClick={() => onStartCall(activePartner, !!m.callInfo?.isVideo)}
                                    className="ml-auto px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white transition-colors"
                                  >
                                    โทรกลับ
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Text message */}
                            {m.text && (
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {m.text}
                              </p>
                            )}

                            {/* Time & Read Receipts */}
                            <div
                              className={`flex items-center gap-1 text-[10px] mt-1 ${
                                isMe ? 'text-blue-200 justify-end' : 'text-white/40 justify-start'
                              }`}
                            >
                              <span>{formatMessageTime(m.createdAt)}</span>
                              {isMe && (
                                <span>
                                  {m.read ? (
                                    <span title="อ่านแล้ว">
                                      <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                                    </span>
                                  ) : (
                                    <span title="ส่งแล้ว">
                                      <Check className="w-3.5 h-3.5 text-white/50" />
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-3 border-t border-white/10 bg-[#162033]/90">
                  {/* Staged attachments preview */}
                  {(attachedImage || includeRoomInvite) && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-white/5 rounded-xl border border-white/10">
                      {attachedImage && (
                        <div className="relative inline-block">
                          <img
                            src={attachedImage}
                            alt="preview"
                            className="w-14 h-14 object-cover rounded-lg border border-white/20"
                          />
                          <button
                            onClick={() => setAttachedImage(null)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {includeRoomInvite && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 border border-pink-500/40 rounded-lg text-xs text-pink-300">
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>ชวนเข้าห้อง: {currentRoomName}</span>
                          <button
                            onClick={() => setIncludeRoomInvite(false)}
                            className="text-white/60 hover:text-white ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    {/* Image Attachment Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      title="แนบรูปภาพ"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>

                    {/* Room Invite Button */}
                    {currentRoomId && (
                      <button
                        type="button"
                        onClick={() => setIncludeRoomInvite(!includeRoomInvite)}
                        className={`p-2 rounded-xl transition-colors ${
                          includeRoomInvite
                            ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                        title="ชวนเพื่อนเข้าห้องปาร์ตี้ที่ฉันอยู่"
                      >
                        <Radio className="w-5 h-5" />
                      </button>
                    )}

                    {/* Text Field */}
                    <input
                      type="text"
                      placeholder="พิมพ์ข้อความ... (กด Enter เพื่อส่ง)"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isSending}
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-pink-500/60 transition-colors"
                    />

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={
                        isSending || (!inputText.trim() && !attachedImage && !includeRoomInvite)
                      }
                      className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 shadow transition-all flex items-center justify-center"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-white/40">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/30">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-white/80 mb-1">
                  เลือกบทสนทนาเพื่อเริ่มคุย
                </h3>
                <p className="text-xs text-white/40 max-w-sm">
                  เลือกเพื่อนจากรายการด้านซ้าย หรือเปิดหน้าโปรไฟล์ของคนที่คุณอยากคุยแล้วกด "ส่งข้อความ (DM)" ได้เลย
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format timestamp
function formatTimeAgo(ts: number): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เมื่อสักครู่';
  if (mins < 60) return `${mins}น.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ชม.`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'เมื่อวาน';
  if (days < 7) return `${days}วัน`;
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatMessageTime(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}
