import React, { useState, useEffect } from 'react';
import {
  X,
  LogOut,
  Sparkles,
  Music2,
  ShieldCheck,
  Heart,
  Users,
  Crown,
  Lock,
  KeyRound,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { UserProfile } from '../types/index.js';
import { createGoogleUser, createFacebookUser } from '../services/auth.js';
import { signInWithGoogle, signInWithFacebook, isSupabaseConfigured } from '../services/supabase.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  initialTab?: 'member' | 'admin';
  onAdminLoginSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  initialTab = 'member',
  onAdminLoginSuccess,
}) => {
  const [authTab, setAuthTab] = useState<'member' | 'admin'>(initialTab);
  const [showAdminTab, setShowAdminTab] = useState(initialTab === 'admin');
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin Login States
  const [adminUsername, setAdminUsername] = useState('System Admin');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAuthTab(initialTab);
      setShowAdminTab(initialTab === 'admin');
      setErrorMessage(null);
      setAdminPasscode('');
    }
  }, [isOpen, initialTab]);

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

  // Trigger Owner / Super Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasscode.trim()) {
      setErrorMessage('กรุณากรอกรหัสผ่านเจ้าของระบบ');
      return;
    }

    setAdminLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/platform/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername.trim() || 'System Admin',
          passcode: adminPasscode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('watchparty_superadmin', 'true');
        onLoginSuccess(data.user);
        if (onAdminLoginSuccess) {
          onAdminLoginSuccess();
        }
        onClose();
      } else {
        setErrorMessage(data.error || 'รหัสผ่านเจ้าของระบบ (Master Passcode) ไม่ถูกต้อง');
      }
    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in text-[#31302e]">
      <div className="bg-white border border-[#e6e6e6] rounded-2xl w-full max-w-md overflow-hidden shadow-notion-modal flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 pt-5 pb-3 border-b border-[#e6e6e6] bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                authTab === 'admin'
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-600'
                  : 'bg-[#0075de]/10 border border-[#0075de]/20 text-[#0075de]'
              }`}>
                {authTab === 'admin' ? <Crown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-[#000000] tracking-tight">
                  {authTab === 'admin' ? 'เข้าสู่ระบบเจ้าของเว็บ 👑' : 'เข้าสู่ระบบ / สมัครสมาชิก'}
                </h2>
                <p className="text-xs text-[#615d59]">
                  {authTab === 'admin'
                    ? 'สิทธิ์ Super Admin และควบคุมระบบหลังบ้าน'
                    : 'สัมผัสประสบการณ์ฟังเพลงร่วมกันบน pleng.online'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs (Visible when Stealth Admin mode is unlocked) */}
          {(showAdminTab || authTab === 'admin') && (
            <div className="flex items-center bg-[#f6f5f4] p-1 rounded-xl border border-[#e6e6e6] mt-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('member');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authTab === 'member'
                    ? 'bg-white text-[#0075de] shadow-xs'
                    : 'text-[#615d59] hover:text-[#000000]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>สมาชิกทั่วไป</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('admin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authTab === 'admin'
                    ? 'bg-white text-amber-600 shadow-xs'
                    : 'text-[#615d59] hover:text-[#000000]'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>เจ้าของเว็บ (Owner)</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Current User Status Banner */}
          <div className="p-3 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] flex items-center gap-3 shadow-xs">
            <div
              className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 relative bg-white shadow-xs"
              style={{ borderColor: currentUser.color || '#0075de' }}
            >
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#000000] truncate">{currentUser.name}</span>
                {currentUser.isSuperAdmin && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-bold">
                    Super Admin
                  </span>
                )}
                {currentUser.provider === 'google' && !currentUser.isSuperAdmin && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-medium">
                    Google
                  </span>
                )}
                {currentUser.provider === 'facebook' && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-[#1877F2] border border-blue-200 text-[9px] font-medium">
                    Facebook
                  </span>
                )}
                {(!currentUser.provider || currentUser.provider === 'guest') && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-[#615d59] border border-[#e6e6e6] text-[9px] font-medium">
                    Guest Mode
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#615d59] truncate mt-0.5">
                {currentUser.username ? `@${currentUser.username}` : (currentUser.email || 'ยังไม่ได้ระบุตัวตน')}
              </p>
            </div>

            {(isMember || currentUser.isSuperAdmin) && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                title="ออกจากระบบ"
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* TAB 1: MEMBER LOGIN */}
          {authTab === 'member' && (
            <div className="space-y-4">
              {/* Social Sign In Buttons */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold text-[#615d59] uppercase tracking-wider">
                  {isMember ? 'สลับไปยังบัญชีอื่น' : 'เชื่อมต่อบัญชีของคุณได้ทันที'}
                </p>

                {/* Google Sign-in Button */}
                <button
                  type="button"
                  disabled={loadingProvider !== null}
                  onClick={handleGoogleAuth}
                  className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-[#f6f5f4] text-[#000000] font-semibold text-xs border border-[#e6e6e6] flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  className="w-full py-2.5 px-4 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-xs flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>{loadingProvider === 'facebook' ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Facebook Account'}</span>
                </button>
              </div>

              {/* Member Benefits Perks */}
              <div className="p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-2.5">
                <h3 className="text-xs font-semibold text-[#000000] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1aae39]" /> สิทธิพิเศษของสมาชิก pleng.online:
                </h3>
                <div className="grid grid-cols-1 gap-2 text-xs text-[#615d59]">
                  <div className="flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-[#ff64c8] shrink-0" />
                    <span>บันทึกเพลงโปรด ❤️ ไว้ฟังหรือเปิดในห้องได้ตลอดไป</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#0075de] shrink-0" />
                    <span>มีหน้าโปรไฟล์ส่วนตัว (@username, Bio, แนวเพลง)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OWNER / SUPER ADMIN LOGIN */}
          {authTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>เข้าสู่ระบบเฉพาะเจ้าของเว็บไซต์ (Super Admin Gate)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  สำหรับผู้ดูแลระบบสูงสุดเพื่อจัดการหลังบ้าน ดูสถิติคนเข้าเว็บ เปิด/ปิดฟีเจอร์ และควบคุมห้องทั้งหมด
                </p>
              </div>

              {/* Admin Username */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">
                  ชื่อแอดมินหรือฉายา (Admin Display Name)
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="เช่น System Admin, เจ้าของระบบ"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 shadow-xs"
                  required
                />
              </div>

              {/* Master Passcode */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000] flex items-center justify-between">
                  <span>รหัสผ่านเจ้าของระบบ (Master Passcode)</span>
                  <span className="text-[10px] text-amber-600 font-normal">* ปลอดภัยผ่าน .env (ADMIN_MASTER_KEY)</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="กรอกรหัส Master Passcode..."
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 shadow-xs font-mono"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={adminLoading || !adminPasscode.trim()}
                  className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Crown className="w-4 h-4" />
                  <span>{adminLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบในฐานะเจ้าของระบบ (Login as Owner)'}</span>
                </button>
              </div>
            </form>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
              {errorMessage}
            </div>
          )}

          {/* Guest continue link */}
          <div className="text-center pt-1 space-y-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#a39e98] hover:text-[#31302e] transition-colors underline cursor-pointer"
            >
              ดำเนินการต่อในฐานะ Guest (ฟังเพลงและแชทได้ทันทีโดยไม่ต้องเข้าสู่ระบบ)
            </button>

            {/* Discreet Admin Portal Link */}
            {!showAdminTab && authTab === 'member' && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminTab(true);
                    setAuthTab('admin');
                  }}
                  className="text-[10px] text-[#c5c2bc] hover:text-[#615d59] inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="สำหรับผู้ดูแลระบบ (Admin Portal)"
                >
                  <Lock className="w-2.5 h-2.5" />
                  <span>ผู้ดูแลระบบ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
