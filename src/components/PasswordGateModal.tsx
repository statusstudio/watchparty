import React, { useState } from 'react';
import { Lock, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';

interface PasswordGateModalProps {
  isOpen: boolean;
  roomName: string;
  errorMessage?: string | null;
  onSubmitPassword: (password: string) => void;
  onBackToHome: () => void;
}

export const PasswordGateModal: React.FC<PasswordGateModalProps> = ({
  isOpen,
  roomName,
  errorMessage,
  onSubmitPassword,
  onBackToHome,
}) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onSubmitPassword(password.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#151722] border border-gray-800/80 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/10">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-1">
            ห้องนี้ต้องใช้รหัสผ่าน 🔒
          </h2>
          <p className="text-xs text-purple-300 font-semibold truncate px-2">
            "{roomName}"
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            กรุณากรอกรหัสผ่านที่ได้รับจากเจ้าของห้องเพื่อเข้าร่วมปาร์ตี้
          </p>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านห้อง..."
              className="w-full px-4 py-2.5 bg-[#0f0f13] border border-gray-700 focus:border-purple-500 rounded-xl text-sm text-white text-center tracking-widest focus:outline-none transition-colors"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-medium text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            ปลดล็อคและเข้าร่วมห้อง
          </button>
        </form>

        <button
          type="button"
          onClick={onBackToHome}
          className="text-xs text-gray-400 hover:text-gray-200 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับไปหน้าแรก (Back to Lobby)
        </button>
      </div>
    </div>
  );
};
