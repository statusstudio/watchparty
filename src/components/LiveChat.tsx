import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Clock } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types/index.js';

interface LiveChatProps {
  messages: ChatMessage[];
  currentUser: UserProfile;
  onSendMessage: (text: string) => void;
  onSendReaction?: (emoji: string) => void;
  onSeekTo: (seconds: number) => void;
  onOpenProfile: () => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😂', '🎵', '🍿', '🚀', '🎉', '🙌', '💯'];

export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  currentUser,
  onSendMessage,
  onSendReaction,
  onSeekTo,
  onOpenProfile,
  onShowToast,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText('');
  };

  const handleQuickEmoji = (emoji: string) => {
    onSendReaction?.(emoji);
    onSendMessage(emoji);
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
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-mono text-xs border border-purple-500/30 transition-colors align-middle cursor-pointer"
            title={`คลิกเพื่อข้ามวิดีโอไปที่ ${part}`}
          >
            <Clock className="w-3 h-3 text-purple-400 inline" />
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
    <div className="bg-[#151722]/80 backdrop-blur-md rounded-2xl border border-gray-800/80 flex flex-col h-full min-h-0 shadow-xl overflow-hidden">
      {/* Tab Header - strictly without message count badge as requested */}
      <div className="px-4 py-2.5 sm:py-3 border-b border-gray-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            แชทสด
          </h3>
        </div>
        <span className="text-[11px] text-gray-500">Live Chat</span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatContainerRef} className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender.id === currentUser.id;
          const isSystem = msg.sender.id === 'system';

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200 text-center"
              >
                {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex items-start gap-2.5 group">
              {/* Sender Profile Avatar */}
              <div
                className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 mt-0.5"
                style={{ borderColor: msg.sender.color }}
              >
                <img
                  src={msg.sender.avatar}
                  alt={msg.sender.name}
                  className="w-full h-full object-cover bg-gray-900"
                />
              </div>

              {/* Message Bubble */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span
                    className="text-xs font-semibold truncate max-w-[130px]"
                    style={{ color: msg.sender.color }}
                  >
                    {msg.sender.name}
                    {isMe && <span className="text-[10px] text-gray-500 ml-1">(คุณ)</span>}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatMessageTime(msg.timestamp)}
                  </span>
                </div>

                <div className="text-xs text-gray-200 bg-[#1a1d2d]/80 border border-gray-800/80 rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full break-words leading-relaxed">
                  {renderMessageWithTimestamps(msg.text)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Reaction Bar */}
      <div className="px-3 py-1 bg-[#12141d]/70 border-t border-gray-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] text-gray-400 shrink-0 mr-0.5">ด่วน:</span>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            className="text-sm px-1.5 py-0.5 rounded-lg hover:bg-gray-800 transition-transform active:scale-125 cursor-pointer shrink-0"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Area with Profile Avatar in front */}
      <form onSubmit={handleSend} className="p-2.5 sm:p-3 bg-[#151722] border-t border-gray-800/80 shrink-0">
        <div className="flex items-center gap-2">
          {/* User Profile Avatar in front of chat input */}
          <button
            type="button"
            onClick={onOpenProfile}
            title="คลิกเพื่อแก้ไขโปรไฟล์ของคุณ"
            className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 hover:opacity-80 transition-opacity cursor-pointer group relative"
            style={{ borderColor: currentUser.color }}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover bg-gray-900"
            />
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="พิมพ์ข้อความ... หรือใส่เวลา เช่น 01:23"
              className="w-full pl-3.5 pr-10 py-2 bg-[#0f0f13] border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-purple-400 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
