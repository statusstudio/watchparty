import React, { useState } from 'react';
import { X, LogIn, Mail, User, Check, Sparkles, LogOut } from 'lucide-react';
import { UserProfile } from '../types/index.js';
import { createGoogleUser, saveUser } from '../services/auth.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isCustomInput, setIsCustomInput] = useState(false);

  if (!isOpen) return null;

  const isGoogleLoggedIn = currentUser.provider === 'google';

  const handleGoogleQuickLogin = (email: string, name: string, photo: string) => {
    const user = createGoogleUser(name, email, photo);
    onLoginSuccess(user);
    onClose();
  };

  const handleCustomGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !nameInput.trim()) return;

    const email = emailInput.trim();
    const formattedEmail = email.includes('@') ? email : `${email}@gmail.com`;
    const photo = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formattedEmail)}`;

    const user = createGoogleUser(nameInput.trim(), formattedEmail, photo);
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#151722] border border-gray-800/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">ระบบสมาชิก Google & Gmail</h2>
              <p className="text-xs text-gray-400">เข้าสู่ระบบเพื่อสร้างห้องและรับสิทธิ์ผู้ดูแล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Currently logged in info */}
          <div className="p-4 rounded-xl bg-[#1a1d2d]/90 border border-gray-800/80 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full overflow-hidden border-2 shrink-0"
              style={{ borderColor: currentUser.color }}
            >
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white truncate">{currentUser.name}</span>
                {isGoogleLoggedIn ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium">
                    Google
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-md bg-gray-700/50 text-gray-300 text-[10px] font-medium">
                    Guest
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">
                {currentUser.email || 'ใช้งานแบบไม่ระบุตัวตน (Guest Mode)'}
              </p>
            </div>

            {isGoogleLoggedIn && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                title="ออกจากระบบ"
                className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Google Sign In */}
          {!isGoogleLoggedIn ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-300">
                เลือกเข้าสู่ระบบด้วยบัญชี Google / Gmail ได้ทันที:
              </p>

              {/* Sample Google Accounts for instant 1-click test */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    handleGoogleQuickLogin(
                      'alex.squad@gmail.com',
                      'Alex (Squad Leader)',
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'
                    )
                  }
                  className="w-full p-2.5 rounded-xl border border-gray-800 bg-[#0f0f13] hover:bg-gray-800/80 hover:border-gray-700 flex items-center gap-3 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                    G
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      Alex (Squad Leader)
                    </p>
                    <p className="text-[11px] text-gray-400">alex.squad@gmail.com</p>
                  </div>
                  <span className="text-xs text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    คลิกเพื่อเข้า
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleGoogleQuickLogin(
                      'sarah.music@gmail.com',
                      'Sarah Chill',
                      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80'
                    )
                  }
                  className="w-full p-2.5 rounded-xl border border-gray-800 bg-[#0f0f13] hover:bg-gray-800/80 hover:border-gray-700 flex items-center gap-3 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    G
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      Sarah Chill
                    </p>
                    <p className="text-[11px] text-gray-400">sarah.music@gmail.com</p>
                  </div>
                  <span className="text-xs text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    คลิกเพื่อเข้า
                  </span>
                </button>
              </div>

              {/* Or enter custom Gmail */}
              {!isCustomInput ? (
                <button
                  type="button"
                  onClick={() => setIsCustomInput(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-gray-700 hover:border-purple-500 text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-purple-400" />
                  หรือพิมพ์ Gmail ของคุณเอง
                </button>
              ) : (
                <form onSubmit={handleCustomGoogleLogin} className="space-y-2.5 pt-2 border-t border-gray-800">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">
                      ชื่อแสดงของคุณ
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="เช่น ธนพล พรเทพ"
                      className="w-full px-3 py-2 bg-[#0f0f13] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">
                      Gmail Address
                    </label>
                    <input
                      type="text"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="username@gmail.com"
                      className="w-full px-3 py-2 bg-[#0f0f13] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    เข้าสู่ระบบด้วย Gmail นี้
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-medium text-emerald-300">
                คุณเข้าสู่ระบบในฐานะสมาชิกเรียบร้อยแล้ว
              </p>
              <p className="text-[11px] text-gray-400">
                สามารถสร้างห้องปาร์ตี้ใหม่ กำหนดรหัสผ่าน และได้รับสิทธิ์เป็นเจ้าของห้อง (Owner) เต็มรูปแบบ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
