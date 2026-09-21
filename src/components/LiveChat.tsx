import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Clock, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types/index.js';
import { compressChatImage } from '../services/imageCompressor.js';

interface LiveChatProps {
  messages: ChatMessage[];
  currentUser: UserProfile;
  enableChatImages?: boolean;
  onSendMessage: (text: string, imageUrl?: string) => void;
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
  onSendMessage,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImage(true);
    try {
      const dataUri = await compressChatImage(file, 800, 0.75);
      setSelectedImage(dataUri);
    } catch (err: any) {
      onShowToast(err.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', 'warning');
    } finally {
      setIsCompressingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    onSendMessage(inputText.trim(), selectedImage || undefined);
    setInputText('');
    setSelectedImage(null);
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
      {/* Tab Header - visible on desktop, hidden on mobile to maximize chat view */}
      <div className="hidden lg:flex px-4 py-2.5 sm:py-3 border-b border-[#e6e6e6] bg-[#f6f5f4] items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#0075de]" />
          <h3 className="text-xs font-semibold text-[#000000] tracking-wide">
            แชทสด
          </h3>
        </div>
        <span className="text-[11px] text-[#615d59]">Live Chat</span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatContainerRef} className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[#f6f5f4]/50">
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
                <div className="flex items-baseline gap-2 mb-0.5">
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
                  <span className="text-[10px] text-[#a39e98]">
                    {formatMessageTime(msg.timestamp)}
                  </span>
                </div>

                <div className={`text-xs rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full break-words leading-relaxed border shadow-xs ${
                  isMe
                    ? 'bg-[#0075de]/8 text-[#000000] border-[#0075de]/20'
                    : 'bg-white text-[#31302e] border-[#e6e6e6]'
                }`}>
                  {msg.imageUrl && (
                    <div className="mb-1.5">
                      <img
                        src={msg.imageUrl}
                        alt="แนบรูปภาพ"
                        className="max-w-[200px] sm:max-w-[260px] max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-black/10 shadow-xs"
                        onClick={() => setLightboxImage(msg.imageUrl || null)}
                      />
                    </div>
                  )}
                  {msg.text && renderMessageWithTimestamps(msg.text)}
                </div>
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
      <form onSubmit={handleSend} className="p-2 sm:p-3 bg-white border-t border-[#e6e6e6] shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={selectedImage ? 'ใส่ข้อความบรรยายภาพ (หรือไม่ใส่ก็ได้)...' : 'พิมพ์ข้อความ... หรือใส่เวลา เช่น 01:23'}
              className="w-full pl-3.5 pr-10 py-2 bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-full text-base sm:text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none shadow-xs transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() && !selectedImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#0075de] text-white hover:bg-[#005bab] disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
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
    </div>
  );
};
