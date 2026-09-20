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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#e6e6e6] rounded-2xl w-full max-w-sm overflow-hidden shadow-notion-modal p-6 text-center space-y-5 text-[#31302e]">
        <div className="w-14 h-14 rounded-2xl bg-[#0075de]/10 border border-[#0075de]/20 text-[#0075de] flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-base font-bold text-[#000000] mb-1">
            ห้องนี้ต้องใช้รหัสผ่าน 🔒
          </h2>
          <p className="text-xs text-[#0075de] font-semibold truncate px-2">
            "{roomName}"
          </p>
          <p className="text-[11px] text-[#615d59] mt-1">
            กรุณากรอกรหัสผ่านที่ได้รับจากเจ้าของห้องเพื่อเข้าร่วมปาร์ตี้
          </p>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-center gap-1.5">
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
              className="w-full px-4 py-2.5 bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-xl text-sm text-[#000000] text-center tracking-widest focus:outline-none shadow-xs transition-colors"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-full font-semibold text-xs bg-[#0075de] hover:bg-[#005bab] text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            ปลดล็อคและเข้าร่วมห้อง
          </button>
        </form>

        <button
          type="button"
          onClick={onBackToHome}
          className="text-xs text-[#615d59] hover:text-[#000000] flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับไปหน้าแรก (Back to Lobby)
        </button>
      </div>
    </div>
  );
};
