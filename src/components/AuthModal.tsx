import React, { useState } from 'react';
import { X, LogOut, Check, Sparkles, Music2, ShieldCheck, Heart, Users } from 'lucide-react';
import { UserProfile } from '../types/index.js';
import { createGoogleUser, createFacebookUser } from '../services/auth.js';
import { signInWithGoogle, signInWithFacebook, isSupabaseConfigured } from '../services/supabase.js';

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
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMember = currentUser.provider === 'google' || currentUser.provider === 'facebook';

  // Trigger Google Login
  const handleGoogleAuth = async () => {
    setLoadingProvider('google');
    setErrorMessage(null);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await signInWithGoogle();
        if (error) throw error;
      } else {
        // Instant Demo Google Account
        const demoUser = createGoogleUser(
          'Music Traveler 🎧',
          'music.fan@gmail.com',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
        );
        onLoginSuccess(demoUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Trigger Facebook Login
  const handleFacebookAuth = async () => {
    setLoadingProvider('facebook');
    setErrorMessage(null);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await signInWithFacebook();
        if (error) throw error;
      } else {
        // Instant Demo Facebook Account
        const demoUser = createFacebookUser(
          'Melody Lover 🎵',
          'melody.pleng@facebook.com',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
        );
        onLoginSuccess(demoUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Facebook login error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Facebook');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#12131a] border border-gray-800/90 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-800/80 bg-gradient-to-b from-rose-950/20 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-600 to-cyan-400 p-[1px] shadow-lg shadow-rose-500/20">
                <div className="w-full h-full bg-[#12131a] rounded-[15px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-rose-400" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">เข้าสู่ระบบ / สมัครสมาชิก</h2>
                <p className="text-xs text-gray-400">เริ่มต้นสัมผัสประสบการณ์ฟังเพลงร่วมกันบน pleng.online</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Current User Status Banner */}
          <div className="p-4 rounded-2xl bg-[#171924] border border-gray-800/80 flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-full overflow-hidden border-2 shrink-0 relative"
              style={{ borderColor: currentUser.color || '#f43f5e' }}
            >
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">{currentUser.name}</span>
                {currentUser.provider === 'google' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-medium">
                    Google
                  </span>
                )}
                {currentUser.provider === 'facebook' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-medium">
                    Facebook
                  </span>
                )}
                {(!currentUser.provider || currentUser.provider === 'guest') && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 text-[10px] font-medium">
                    Guest Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {currentUser.username ? `@${currentUser.username}` : (currentUser.email || 'ยังไม่ได้ระบุตัวตน')}
              </p>
            </div>

            {isMember && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                title="ออกจากระบบ"
                className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Social Sign In Buttons */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              {isMember ? 'สลับไปยังบัญชีอื่น' : 'เชื่อมต่อบัญชีของคุณได้ทันที'}
            </p>

            {/* Google Sign-in Button */}
            <button
              type="button"
              disabled={loadingProvider !== null}
              onClick={handleGoogleAuth}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
            >
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.2.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z"
                />
              </svg>
              <span>{loadingProvider === 'google' ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google Account'}</span>
            </button>

            {/* Facebook Sign-in Button */}
            <button
              type="button"
              disabled={loadingProvider !== null}
              onClick={handleFacebookAuth}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-md hover:shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {/* Facebook Logo SVG */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>{loadingProvider === 'facebook' ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Facebook Account'}</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
              {errorMessage}
            </div>
          )}

          {/* Member Benefits Perks */}
          <div className="p-4 rounded-2xl bg-[#151722]/80 border border-gray-800/80 space-y-3">
            <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> สิทธิพิเศษของสมาชิก pleng.online:
            </h3>
            <div className="grid grid-cols-1 gap-2.5 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>บันทึกเพลงโปรด ❤️ ไว้ฟังหรือเปิดในห้องได้ตลอดไป</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>มีหน้าโปรไฟล์ส่วนตัว (@username, Bio, แนวเพลง, ลิงก์โซเชียล)</span>
              </div>
              <div className="flex items-center gap-2">
                <Music2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>กดติดตามเพื่อน & รับการแจ้งเตือนเมื่อเพื่อนเปิดห้องฟังเพลง</span>
              </div>
            </div>
          </div>

          {/* Guest continue link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline cursor-pointer"
            >
              ดำเนินการต่อในฐานะ Guest (ฟังเพลงและแชทได้ทันทีโดยไม่ต้องเข้าสู่ระบบ)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
