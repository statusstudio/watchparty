import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageSquare, Clock, Image as ImageIcon, X, Loader2, Trash2, Smile } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types/index.js';
import { compressChatImage } from '../services/imageCompressor.js';
import { ANIMATED_EMOJIS, GRAFFITI_STICKERS, ALL_CHAT_STICKERS, parseStickerMessage, AnimatedSticker, getStickerThumbUrl } from '../data/chatStickers.js';

interface LiveChatProps {
  messages: ChatMessage[];
  currentUser: UserProfile;
  enableChatImages?: boolean;
  canClearChat?: boolean;
  onClearChat?: () => void;
  onSendMessage: (text: string, imageUrl?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onSendReaction?: (emoji: string) => void;
  onSeekTo: (seconds: number) => void;
  onOpenProfile: () => void;
  onSelectUser?: (user: UserProfile) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  currentUser,
  enableChatImages = true,
  canClearChat,
  onClearChat,
  onSendMessage,
  onDeleteMessage,
  onSendReaction,
  onSeekTo,
  onOpenProfile,
  onSelectUser,
  onShowToast,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [confirmModalImage, setConfirmModalImage] = useState<string | null>(null);
  const [confirmModalCaption, setConfirmModalCaption] = useState('');
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [activeStickerTab, setActiveStickerTab] = useState<'emoji' | 'graffiti' | 'all'>('emoji');
  const [hoveredStickerId, setHoveredStickerId] = useState<string | null>(null);
  const [animateAllStickers, setAnimateAllStickers] = useState(false);
  const stickerPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Close sticker picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (stickerPickerRef.current && !stickerPickerRef.current.contains(e.target as Node)) {
        setIsStickerPickerOpen(false);
      }
    };
    if (isStickerPickerOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isStickerPickerOpen]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120;
  };

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      if (behavior === 'auto') {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive:
  // Scroll if user is near bottom, or the message is from current user, or on initial messages load
  useEffect(() => {
    const latestMsg = messages[messages.length - 1];
    const isFromMe = latestMsg?.sender?.id === currentUser.id;
    if (isNearBottomRef.current || isFromMe || messages.length <= 1) {
      scrollToBottom('smooth');
    }
  }, [messages, currentUser.id, scrollToBottom]);

  // Keep scrolled to bottom on initial mount and when chat tab becomes visible or keyboard opens
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    scrollToBottom('auto');
    const timer = setTimeout(() => scrollToBottom('auto'), 80);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (container.clientHeight > 0 && isNearBottomRef.current) {
          scrollToBottom('auto');
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver?.disconnect();
    };
  }, [scrollToBottom]);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImage(true);
    try {
      const dataUri = await compressChatImage(file, 800, 0.75);
      // Open confirmation modal so user can preview and verify before sending
      setConfirmModalImage(dataUri);
      setConfirmModalCaption(inputText);
    } catch (err: any) {
      onShowToast(err.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', 'warning');
    } finally {
      setIsCompressingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmSendImage = () => {
    if (!confirmModalImage) return;
    onSendMessage(confirmModalCaption.trim(), confirmModalImage);
    setConfirmModalImage(null);
    setConfirmModalCaption('');
    setInputText('');
    setSelectedImage(null);
    isNearBottomRef.current = true;
    setTimeout(() => scrollToBottom('smooth'), 50);
    onShowToast('ส่งรูปภาพเรียบร้อย 📷', 'success');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    onSendMessage(inputText.trim(), selectedImage || undefined);
    setInputText('');
    setSelectedImage(null);
    isNearBottomRef.current = true;
    setTimeout(() => scrollToBottom('smooth'), 50);
  };

  // Parses timestamps like "01:23", "2:45", "1:15:30" into clickable buttons
  const renderMessageWithTimestamps = (text: string) => {
    const timeRegex = /(\b(?:(?:\d{1,2}:)?\d{1,2}:\d{2})\b)/g;
    const parts = text.split(timeRegex);

    return parts.map((part, idx) => {
      if (timeRegex.test(part)) {
        // Parse time into seconds
        const subParts = part.split(':').map((num) => parseInt(num, 10));
        let totalSeconds = 0;
        if (subParts.length === 2) {
          totalSeconds = subParts[0] * 60 + subParts[1];
        } else if (subParts.length === 3) {
          totalSeconds = subParts[0] * 3600 + subParts[1] * 60 + subParts[2];
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSeekTo(totalSeconds);
              onShowToast(`กระโดดข้ามวิดีโอไปที่ ${part} ⏱️`, 'info');
            }}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md bg-[#0075de]/10 hover:bg-[#0075de]/20 text-[#0075de] font-mono text-xs border border-[#0075de]/20 transition-colors align-middle cursor-pointer"
            title={`คลิกเพื่อข้ามวิดีโอไปที่ ${part}`}
          >
            <Clock className="w-3 h-3 text-[#0075de] inline" />
            {part}
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white flex flex-col h-full min-h-0 overflow-hidden">
      {/* Tab Header - visible on desktop, or when clear chat is available on mobile */}
      <div className={`${canClearChat && onClearChat && messages.length > 1 ? 'flex' : 'hidden lg:flex'} px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[#e6e6e6] bg-[#f6f5f4] items-center justify-between shrink-0`}>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#0075de]" />
          <h3 className="text-xs font-semibold text-[#000000] tracking-wide">
            แชทสด
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {canClearChat && onClearChat && messages.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('คุณต้องการล้างข้อความแชททั้งหมดในห้องนี้ใช่หรือไม่?')) {
                  onClearChat();
                }
              }}
              title="ล้างข้อความแชททั้งหมดในห้อง"
              className="text-[11px] font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              ล้างแชท
            </button>
          )}
          <span className="hidden sm:inline text-[11px] text-[#615d59]">Live Chat</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        id="live-chat-messages"
        data-chat-scroll="true"
        onScroll={handleScroll}
        className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[#f6f5f4]/50 overscroll-contain select-text"
        style={{ overscrollBehaviorY: 'contain' }}
      >
        {messages.map((msg) => {
          const isMe = msg.sender.id === currentUser.id;
          const isSystem = msg.sender.id === 'system';

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="p-2 rounded-xl bg-white border border-[#e6e6e6] text-xs text-[#615d59] text-center font-medium shadow-xs"
              >
                {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex items-start gap-2.5 group">
              {/* Sender Profile Avatar */}
              <button
                type="button"
                onClick={() => {
                  if (isMe) {
                    onOpenProfile();
                  } else if (onSelectUser) {
                    onSelectUser(msg.sender);
                  }
                }}
                className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 mt-0.5 hover:opacity-80 transition-opacity cursor-pointer bg-[#f6f5f4] shadow-xs"
                style={{ borderColor: msg.sender.color }}
                title={`ดูโปรไฟล์ของ ${msg.sender.name}`}
              >
                <img
                  src={msg.sender.avatar}
                  alt={msg.sender.name}
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Message Bubble */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (isMe) {
                          onOpenProfile();
                        } else if (onSelectUser) {
                          onSelectUser(msg.sender);
                        }
                      }}
                      className="text-xs font-semibold truncate max-w-[130px] hover:underline cursor-pointer text-left"
                      style={{ color: msg.sender.color }}
                      title={`ดูโปรไฟล์ของ ${msg.sender.name}`}
                    >
                      {msg.sender.name}
                      {isMe && <span className="text-[10px] text-[#a39e98] ml-1">(คุณ)</span>}
                    </button>

                    {/* Listener Level Badge */}
                    {(() => {
                      const lvl =
                        msg.sender.level ||
                        (msg.sender.xp ? Math.floor(Math.sqrt(msg.sender.xp / 25)) + 1 : 1);
                      return (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono border shrink-0 ${
                            lvl >= 50
                              ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                              : lvl >= 30
                              ? 'bg-purple-500/15 text-purple-600 border-purple-500/30'
                              : lvl >= 20
                              ? 'bg-indigo-500/15 text-indigo-600 border-indigo-500/30'
                              : lvl >= 10
                              ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                              : lvl >= 5
                              ? 'bg-[#0075de]/15 text-[#0075de] border-[#0075de]/30'
                              : 'bg-black/5 text-[#615d59] border-black/10'
                          }`}
                          title={`เลเวลผู้ฟัง: Lv.${lvl}`}
                        >
                          Lv.{lvl}
                        </span>
                      );
                    })()}

                    <span className="text-[10px] text-[#a39e98]">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Delete button (sender can delete their own message) */}
                  {onDeleteMessage && isMe && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('คุณต้องการลบข้อความนี้ใช่หรือไม่? (คนอื่นจะไม่เห็นอีก)')) {
                          onDeleteMessage(msg.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#a39e98] hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                      title="ลบข้อความ/รูปภาพนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Animated Sticker or Normal Message Bubble */}
                {(() => {
                  const sticker = parseStickerMessage(msg.text);
                  if (sticker) {
                    return (
                      <div className="py-1 inline-block select-none min-w-[80px] min-h-[80px]">
                        <img
                          src={sticker.url || getStickerThumbUrl(sticker)}
                          alt={sticker.name}
                          decoding="async"
                          className="w-24 h-24 sm:w-28 sm:h-28 object-contain cursor-pointer transition-transform hover:scale-105 active:scale-95 drop-shadow-md"
                          title={sticker.name}
                          onError={(e) => {
                            const fallback = getStickerThumbUrl(sticker);
                            if (e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback;
                            }
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div className={`text-xs rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full break-words leading-relaxed border shadow-xs ${
                      isMe
                        ? 'bg-[#0075de]/8 text-[#000000] border-[#0075de]/20'
                        : 'bg-white text-[#31302e] border-[#e6e6e6]'
                    }`}>
                      {msg.imageUrl && (
                        <div className="relative mb-1.5 inline-block group/img">
                          <img
                            src={msg.imageUrl}
                            alt="แนบรูปภาพ"
                            className="max-w-[200px] sm:max-w-[260px] max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-black/10 shadow-xs"
                            onClick={() => setLightboxImage(msg.imageUrl || null)}
                          />
                          {onDeleteMessage && isMe && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('ต้องการลบรูปภาพนี้ใช่หรือไม่? ผู้ใช้อื่นในห้องจะไม่เห็นรูปนี้ทันที')) {
                                  onDeleteMessage(msg.id);
                                }
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/65 hover:bg-rose-600 text-white transition-colors shadow-md cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                              title="ลบรูปภาพนี้ทันที"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="hidden sm:inline">ลบรูป</span>
                            </button>
                          )}
                        </div>
                      )}
                      {msg.text && renderMessageWithTimestamps(msg.text)}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview Bar before sending */}
      {selectedImage && (
        <div className="px-3 py-2 bg-[#f6f5f4] border-t border-[#e6e6e6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#e6e6e6] bg-white shrink-0 shadow-xs">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="text-[11px] text-[#615d59]">
              <p className="font-semibold text-[#000000]">แนบรูปภาพพร้อมส่ง</p>
              <p>รูปภาพชั่วคราวจะถูกลบเมื่อปิดห้อง</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="p-1 rounded-full hover:bg-black/5 text-[#615d59] hover:text-rose-600 transition-colors cursor-pointer"
            title="ยกเลิกรูปภาพ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Area with Profile Avatar in front */}
      <form onSubmit={handleSend} className="p-2 sm:p-3 bg-white border-t border-[#e6e6e6] shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] relative">
        <div className="flex items-center gap-2">
          {/* User Profile Avatar in front of chat input */}
          <button
            type="button"
            onClick={onOpenProfile}
            title="คลิกเพื่อแก้ไขโปรไฟล์ของคุณ"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0 border-2 hover:opacity-80 transition-opacity cursor-pointer group relative shadow-xs"
            style={{ borderColor: currentUser.color }}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          </button>

          {/* Attach Image Button */}
          {enableChatImages && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFile}
              />
              <button
                type="button"
                disabled={isCompressingImage}
                onClick={() => fileInputRef.current?.click()}
                title="แนบรูปภาพส่งในแชท (ลบอัตโนมัติเมื่อห้องปิด)"
                className="p-2 rounded-full text-[#615d59] hover:text-[#0075de] hover:bg-[#0075de]/10 border border-[#e6e6e6] transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
              >
                {isCompressingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0075de]" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </button>
            </>
          )}

          {/* Cute Animated Sticker Picker Button */}
          <div ref={stickerPickerRef} className="shrink-0">
            <button
              type="button"
              onClick={() => setIsStickerPickerOpen(!isStickerPickerOpen)}
              title="ส่งสติกเกอร์และอีโมจิดุ๊กดิ๊ก (99 แบบ)"
              className={`p-2 rounded-full border transition-all cursor-pointer shrink-0 shadow-xs flex items-center justify-center ${
                isStickerPickerOpen
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'text-[#615d59] hover:text-amber-500 hover:bg-amber-500/10 border-[#e6e6e6]'
              }`}
            >
              <Smile className={`w-4 h-4 ${isStickerPickerOpen ? 'animate-bounce' : ''}`} />
            </button>

            {/* Sticker Picker Drawer Popup (full width of chat form, scrollable grid with category tabs) */}
            {isStickerPickerOpen && (
              <>
                {/* Mobile Backdrop to tap outside and dismiss cleanly */}
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] sm:hidden animate-fade-in"
                  onClick={() => setIsStickerPickerOpen(false)}
                />

                <div className="fixed inset-x-2 bottom-2 z-50 max-h-[72vh] sm:absolute sm:inset-x-2 sm:bottom-full sm:mb-2 sm:max-h-[380px] bg-white border border-[#e6e6e6] rounded-2xl shadow-2xl p-2.5 sm:p-3 animate-scale-up text-[#31302e] flex flex-col overflow-hidden">
                  {/* Header with Segmented Category Tabs and Close Button */}
                  <div className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-[#f0efed] shrink-0">
                    <div className="grid grid-cols-2 gap-1 flex-1 bg-[#f0efed] p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setActiveStickerTab('emoji')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          activeStickerTab === 'emoji'
                            ? 'bg-white text-amber-600 shadow-xs'
                            : 'text-[#615d59] hover:text-[#000000]'
                        }`}
                      >
                        <span>😀 อีโมจิ</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          activeStickerTab === 'emoji' ? 'bg-amber-100 text-amber-700' : 'bg-black/5 text-[#888]'
                        }`}>
                          {ANIMATED_EMOJIS.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveStickerTab('graffiti')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          activeStickerTab === 'graffiti'
                            ? 'bg-white text-amber-600 shadow-xs'
                            : 'text-[#615d59] hover:text-[#000000]'
                        }`}
                      >
                        <span>🎨 กราฟฟิตี้</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          activeStickerTab === 'graffiti' ? 'bg-amber-100 text-amber-700' : 'bg-black/5 text-[#888]'
                        }`}>
                          {GRAFFITI_STICKERS.length}
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsStickerPickerOpen(false)}
                      className="p-1.5 rounded-full text-[#a39e98] hover:text-[#000000] hover:bg-black/5 transition-colors cursor-pointer shrink-0 ml-0.5"
                      title="ปิด"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Grid of Animated Stickers / Emojis (optimized for 60fps lag-free opening) */}
                  {(() => {
                    const currentStickers = activeStickerTab === 'emoji' ? ANIMATED_EMOJIS : GRAFFITI_STICKERS;
                    return (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 p-1 flex-1 min-h-0 overflow-y-auto overscroll-contain">
                        {currentStickers.map((stk) => {
                          const isHovered = hoveredStickerId === stk.id;
                          const shouldAnimate = animateAllStickers || isHovered;
                          const imageSrc = shouldAnimate ? stk.url : getStickerThumbUrl(stk);

                          return (
                            <button
                              key={stk.id}
                              type="button"
                              onMouseEnter={() => setHoveredStickerId(stk.id)}
                              onMouseLeave={() => setHoveredStickerId(null)}
                              onClick={() => {
                                onSendMessage(`[sticker:${stk.id}]`);
                                setIsStickerPickerOpen(false);
                                isNearBottomRef.current = true;
                                setTimeout(() => scrollToBottom('smooth'), 50);
                                onShowToast(`ส่ง ${stk.name} เรียบร้อย ✨`, 'success');
                              }}
                              className="group/stk flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-amber-50/90 border border-transparent hover:border-amber-300 transition-all cursor-pointer relative active:scale-95"
                              title={stk.name}
                            >
                              <img
                                src={imageSrc}
                                alt={stk.name}
                                loading="lazy"
                                decoding="async"
                                className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-xs transition-transform group-hover/stk:scale-115 pointer-events-none"
                                onError={(e) => {
                                  if (stk.gifUrl && e.currentTarget.src !== stk.gifUrl) {
                                    e.currentTarget.src = stk.gifUrl;
                                  }
                                }}
                              />
                              <span className="text-[9px] text-[#888] truncate max-w-full mt-0.5 group-hover/stk:text-amber-700">
                                {stk.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Footer with Performance Mode Toggle */}
                  <div className="mt-2 pt-1.5 border-t border-[#f0efed] flex items-center justify-between text-[10px] text-[#a39e98] px-1 shrink-0">
                    <span>
                      {activeStickerTab === 'emoji' ? 'อีโมจิ 3D 54 แบบ' : 'สติกเกอร์กราฟฟิตี้ 45 แบบ'} (แตะเพื่อส่ง)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAnimateAllStickers(!animateAllStickers)}
                      className="text-[#0075de] hover:underline font-medium cursor-pointer"
                      title={animateAllStickers ? 'สลับเป็นโหมดประหยัดพลังงาน (ไม่ค้าง)' : 'เล่นอนิเมชั่นทั้งหมดพร้อมกัน'}
                    >
                      {animateAllStickers ? '⚡ โหมดลื่นไหล' : '✨ ขยับทั้งหมด'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Text Input */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={selectedImage ? 'ใส่ข้อความบรรยายภาพ...' : 'พิมพ์ข้อความ... หรือใส่เวลา เช่น 01:23'}
              className="w-full px-3.5 py-2 bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-full text-base sm:text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none shadow-xs transition-colors h-10 sm:h-9"
            />
          </div>

          {/* Send Message Button (Dedicated large button for easy tapping) */}
          <button
            type="submit"
            disabled={!inputText.trim() && !selectedImage}
            title="ส่งข้อความ (Enter)"
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-[#0075de] hover:bg-[#005bab] active:scale-90 text-white flex items-center justify-center shrink-0 shadow-sm disabled:opacity-30 disabled:hover:bg-[#0075de] disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Send className="w-5 h-5 sm:w-4.5 sm:h-4.5 ml-0.5" />
          </button>
        </div>
      </form>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Full view"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Image Send Confirmation Modal (Prevents accidental uploads) */}
      {confirmModalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setConfirmModalImage(null)}
        >
          <div
            className="bg-white border border-[#e6e6e6] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-[#31302e] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-[#e6e6e6] flex items-center justify-between bg-[#f6f5f4]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0075de]" />
                <h3 className="text-sm font-bold text-[#000000]">
                  ตรวจสอบรูปภาพก่อนส่ง
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalImage(null)}
                className="p-1 rounded-full text-[#615d59] hover:text-[#000000] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3">
              {/* Preview Image */}
              <div className="relative w-full max-h-[48vh] flex items-center justify-center bg-black/5 rounded-xl overflow-hidden border border-[#e6e6e6] p-1">
                <img
                  src={confirmModalImage}
                  alt="Confirmation Preview"
                  className="max-h-[42vh] w-auto object-contain rounded-lg shadow-xs"
                />
              </div>

              {/* Caption Input */}
              <div>
                <label className="block text-xs font-semibold text-[#31302e] mb-1">
                  ข้อความประกอบรูปภาพ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={confirmModalCaption}
                  onChange={(e) => setConfirmModalCaption(e.target.value)}
                  placeholder="พิมพ์ข้อความบรรยายรูป..."
                  className="w-full px-3 py-2 bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-xl text-xs text-[#000000] focus:outline-none shadow-xs transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmSendImage();
                    }
                  }}
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                <span className="text-base leading-none">🛡️</span>
                <span>
                  ตรวจสอบให้แน่ใจว่าเป็นรูปที่ต้องการส่ง (หากส่งผิด คุณสามารถกดปุ่มลบรูปที่มุมรูปในแชทได้ตลอดเวลา)
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#e6e6e6] bg-[#f6f5f4] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModalImage(null)}
                className="px-4 py-2 rounded-full text-xs font-medium text-[#615d59] hover:text-[#000000] hover:bg-black/5 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmSendImage}
                className="px-5 py-2 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ยืนยันส่งรูปภาพ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
