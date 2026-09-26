import React, { useState } from 'react';
import {
  X,
  Send,
  Trash2,
  ChevronLeft,
  Phone,
  Search,
  Menu,
  Smile,
  Plus,
  Mic,
  Camera,
  Check,
} from 'lucide-react';
import { StickerItem } from '../../types/sticker';

interface LineChatSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  stickers: StickerItem[];
}

interface ChatMessage {
  id: string;
  type: 'sticker' | 'text';
  content: string;
  sender: 'me' | 'friend';
  timestamp: string;
  isRead: boolean;
}

export const LineChatSimulator: React.FC<LineChatSimulatorProps> = ({
  isOpen,
  onClose,
  stickers,
}) => {
  const [theme, setTheme] = useState<'blue' | 'dark' | 'pink' | 'green'>('blue');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      type: 'text',
      content: 'สติกเกอร์ชุดใหม่น่ารักจัง! ขอลองดูหน่อยได้มั้ยครับ 🎉',
      sender: 'friend',
      timestamp: '09:40',
      isRead: true,
    },
  ]);

  if (!isOpen) return null;

  const handleSendSticker = (stickerUrl: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'sticker',
      content: stickerUrl,
      sender: 'me',
      timestamp: timeStr,
      isRead: true,
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  const handleClearMessages = () => {
    setMessages([
      {
        id: 'msg-init',
        type: 'text',
        content: 'ทดลองกดส่งสติกเกอร์จากแถบด้านล่างได้เลยครับ!',
        sender: 'friend',
        timestamp: '09:41',
        isRead: true,
      },
    ]);
  };

  const getThemeBg = () => {
    switch (theme) {
      case 'dark':
        return 'bg-[#181B20] text-slate-100';
      case 'pink':
        return 'bg-[#FCE7F3] text-slate-800';
      case 'green':
        return 'bg-[#E8F5E9] text-slate-800';
      case 'blue':
      default:
        return 'bg-[#849EBF] text-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md h-[92vh] max-h-[760px] bg-slate-900 border border-slate-700/80 rounded-[36px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
        {/* Phone Bezel Header / Status bar */}
        <div className="pt-2 px-6 pb-1 bg-slate-950 flex items-center justify-between text-[11px] font-medium text-slate-400 select-none">
          <span>09:41</span>
          <div className="w-20 h-4 bg-black rounded-full mx-auto" />
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* LINE Chat Header */}
        <div className="px-3 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 -ml-1 text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-400">
                LINE
              </div>
              <div>
                <h4 className="text-xs font-semibold leading-tight font-['Prompt']">
                  ห้องแชทจำลอง (LINE Chat)
                </h4>
                <p className="text-[10px] text-emerald-400">ออนไลน์</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme switcher dots */}
            <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-full border border-slate-800">
              <button
                onClick={() => setTheme('blue')}
                className={`w-3.5 h-3.5 rounded-full bg-[#849EBF] border ${theme === 'blue' ? 'border-white scale-110' : 'border-transparent'}`}
                title="LINE Blue Theme"
              />
              <button
                onClick={() => setTheme('dark')}
                className={`w-3.5 h-3.5 rounded-full bg-[#181B20] border ${theme === 'dark' ? 'border-white scale-110' : 'border-transparent'}`}
                title="Dark Theme"
              />
              <button
                onClick={() => setTheme('pink')}
                className={`w-3.5 h-3.5 rounded-full bg-[#FCE7F3] border ${theme === 'pink' ? 'border-pink-500 scale-110' : 'border-transparent'}`}
                title="Pink Theme"
              />
              <button
                onClick={() => setTheme('green')}
                className={`w-3.5 h-3.5 rounded-full bg-[#06C755] border ${theme === 'green' ? 'border-white scale-110' : 'border-transparent'}`}
                title="Green Theme"
              />
            </div>

            <button
              onClick={handleClearMessages}
              className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
              title="ล้างข้อความ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream Area */}
        <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${getThemeBg()}`}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-1.5 ${
                msg.sender === 'me' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Friend Avatar */}
              {msg.sender === 'friend' && (
                <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                  เพื่อน
                </div>
              )}

              {/* Timestamp for Me */}
              {msg.sender === 'me' && (
                <div className="text-[10px] text-slate-600 dark:text-slate-400 text-right leading-none flex flex-col items-end gap-0.5">
                  <span className="text-[9px] text-emerald-800 dark:text-emerald-400 font-medium">อ่านแล้ว</span>
                  <span>{msg.timestamp}</span>
                </div>
              )}

              {/* Message Bubble / Sticker */}
              {msg.type === 'text' ? (
                <div
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'me'
                      ? 'bg-[#06C755] text-white rounded-br-none'
                      : 'bg-white text-slate-900 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              ) : (
                <div className="relative group max-w-[170px] select-none">
                  <img
                    src={msg.content}
                    alt="LINE Sticker"
                    className="w-full h-auto drop-shadow-md hover:scale-105 transition-transform duration-150"
                  />
                </div>
              )}

              {/* Timestamp for Friend */}
              {msg.sender === 'friend' && (
                <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-none">
                  {msg.timestamp}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Sticker Keyboard / Picker Tray */}
        <div className="bg-slate-950 border-t border-slate-800 p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="text-[11px] font-medium text-slate-300 font-['Prompt']">
              แตะสติกเกอร์เพื่อส่งในห้องแชท ({stickers.length} รูป)
            </span>
            <span className="text-[10px] text-emerald-400">LINE Sticker Tray</span>
          </div>

          {/* Horizontal Sticker Scroller */}
          {stickers.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1 scrollbar-thin">
              {stickers.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => handleSendSticker(s.processedDataUrl)}
                  className="w-16 h-16 shrink-0 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 p-1.5 flex items-center justify-center transition-all active:scale-95 group shadow-xs"
                  title={`คลิกเพื่อส่งสติกเกอร์ #${idx + 1}`}
                >
                  <img
                    src={s.processedDataUrl}
                    alt={`Sticker ${idx + 1}`}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-500">
              ยังไม่มีสติกเกอร์ กรุณาตัดหรืออัปโหลดสติกเกอร์ก่อน
            </div>
          )}

          {/* Fake LINE input bar */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-900 text-slate-400">
            <div className="flex items-center gap-2 text-slate-400">
              <Plus className="w-5 h-5 hover:text-white cursor-pointer" />
              <Camera className="w-5 h-5 hover:text-white cursor-pointer" />
            </div>
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 text-xs text-slate-400 flex items-center justify-between">
              <span>แตะสติกเกอร์ด้านบนเพื่อส่ง...</span>
              <Smile className="w-4 h-4 text-emerald-400" />
            </div>
            <Mic className="w-5 h-5 hover:text-white cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};
