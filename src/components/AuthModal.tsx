import React, { useState } from 'react';
import {
  X,
  LogOut,
  Sparkles,
  ShieldCheck,
  Heart,
  Music,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { UserProfile } from '../types/index.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  initialTab?: 'member' | 'admin';
  onAdminLoginSuccess?: () => void;
}

const GOOGLE_CLIENT_ID = '165899640178-luq7cv4bes1vn0dv3dmlhkelbn46rhjs.apps.googleusercontent.com';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fallback direct email prompt if Google popup is blocked
  const [showManualGoogle, setShowManualGoogle] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');

  if (!isOpen) return null;

  const isMember = currentUser.provider === 'google' || currentUser.provider === 'email';

  // Handle Official Google OAuth 2.0 Sign In
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // 1. Google OAuth 2.0 Popup via initTokenClient (Official Google Account Chooser)
      if (typeof (window as any).google !== 'undefined' && (window as any).google.accounts?.oauth2) {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setIsLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setErrorMessage('การเข้าสู่ระบบ Google ถูกยกเลิก: ' + (tokenResponse.error_description || tokenResponse.error));
              }
              return;
            }
            if (tokenResponse && tokenResponse.access_token) {
              try {
                // Fetch verified profile directly from Google
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();
                if (userInfo && userInfo.email) {
                  const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: userInfo.email,
                      name: userInfo.name || userInfo.email.split('@')[0],
                      picture: userInfo.picture,
                      googleId: userInfo.sub,
                    }),
                  });
                  const data = await res.json();
                  if (res.ok && data.success && data.user) {
                    onLoginSuccess(data.user);
                    onClose();
                  } else {
                    setErrorMessage(data.error || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
                  }
                } else {
                  setErrorMessage('ไม่สามารถรับข้อมูลโปรไฟล์จาก Google ได้');
                }
              } catch (err) {
                setErrorMessage('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์กับ Google');
              } finally {
                setIsLoading(false);
              }
            }
          },
        });
        tokenClient.requestAccessToken();
        setIsLoading(false);
        return;
      }

      // 2. Fallback to Google ID Token One Tap prompt
      if (typeof (window as any).google !== 'undefined' && (window as any).google.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (response.credential) {
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
              });
              const data = await res.json();
              if (res.ok && data.success && data.user) {
                onLoginSuccess(data.user);
                onClose();
              } else {
                setErrorMessage(data.error || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
              }
            }
          },
        });
        (window as any).google.accounts.id.prompt();
        setIsLoading(false);
        return;
      }

      // 3. Fallback dialog if SDK is blocked or offline
      setShowManualGoogle(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Google Sign In error:', err);
      setShowManualGoogle(true);
      setIsLoading(false);
    }
  };

  const handleManualGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualEmail.includes('@')) {
      setErrorMessage('กรุณาระบุอีเมล Google ให้ถูกต้อง (เช่น name@gmail.com)');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: manualEmail.trim(),
          name: manualName.trim() || manualEmail.split('@')[0],
          picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(manualEmail.trim())}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMessage(data.error || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      }
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-[#131b2e] dark:text-[#e2e2ea]">
      <div className="bg-white dark:bg-[#191b22] border border-[#dae2fd] dark:border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-[#dae2fd]/60 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0075de]/15 to-[#00daf3]/15 border border-[#0075de]/20 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#131b2e] dark:text-[#e2e2ea]">
                เข้าสู่ระบบสมาชิก
              </h2>
              <p className="text-xs text-[#64748b] dark:text-[#94A3B8]">
                ผ่านบัญชี Google Account (เชื่อมต่อทันที)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer text-[#64748b] dark:text-[#94A3B8]"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Current User Status Card */}
          <div className="p-3.5 rounded-2xl bg-[#faf8ff] dark:bg-[#111319] border border-[#dae2fd]/70 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 relative bg-white dark:bg-[#191b22] shadow-xs"
                style={{ borderColor: currentUser.color || '#0075de' }}
              >
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold truncate max-w-[150px]">{currentUser.name}</span>
                  {currentUser.provider === 'google' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[#4285F4] border border-[#4285F4]/30 text-[9px] font-bold flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Google
                    </span>
                  )}
                  {(!currentUser.provider || currentUser.provider === 'guest') && (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 text-[9px] font-semibold">
                      โหมดผู้ฟังทั่วไป (Guest)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#64748b] dark:text-[#94A3B8] truncate mt-0.5">
                  {currentUser.email || 'ยังไม่ได้เชื่อมต่อบัญชีสมาชิก'}
                </p>
              </div>
            </div>

            {isMember && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                title="ออกจากระบบ"
                className="px-2.5 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออก</span>
              </button>
            )}
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Primary Google Login Button */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-50 dark:bg-[#191b22] dark:hover:bg-[#20232b] border-2 border-[#dae2fd] dark:border-white/10 hover:border-[#4285F4] dark:hover:border-[#4285F4] text-[#131b2e] dark:text-[#e2e2ea] font-bold text-sm shadow-[0_4px_16px_rgba(0,117,222,0.1)] hover:shadow-[0_6px_24px_rgba(66,133,244,0.25)] transition-all flex items-center justify-center gap-3 cursor-pointer group active:scale-98"
            >
              <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isLoading ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google Account'}</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-[#64748b] dark:text-[#94A3B8]">
                คลิกเดียวเข้าใช้งานได้ทันที ทั้งสมาชิกเดิมและสมาชิกใหม่
              </span>
            </div>
          </div>

          {/* Benefits Feature Box */}
          <div className="p-4 rounded-2xl bg-[#f2f3ff]/60 dark:bg-white/[0.03] border border-[#dae2fd]/50 dark:border-white/[0.06] space-y-2.5">
            <h4 className="text-xs font-bold text-[#006194] dark:text-[#00daf3] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>สิทธิประโยชน์เมื่อเข้าสู่ระบบด้วย Google</span>
            </h4>
            <ul className="text-xs space-y-1.5 text-[#475569] dark:text-[#c1c6d5]">
              <li className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>บันทึกเพลงโปรดและคลัง Playlist ถาวรในบัญชี</span>
              </li>
              <li className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-[#0075de] dark:text-[#00daf3] shrink-0" />
                <span>สิทธิ์สร้างและดูแลห้องปาร์ตี้ของตนเอง</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>ปลอดภัย 100% ไม่ต้องจำหรือกรอกรหัสผ่าน</span>
              </li>
            </ul>
          </div>

          {/* Manual Google Fallback (only shown if Google popup is blocked) */}
          {showManualGoogle && (
            <form onSubmit={handleManualGoogleSubmit} className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0075de] dark:text-[#00daf3] flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  ยืนยันอีเมล Google ของคุณ
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualGoogle(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  อีเมล Google (Gmail)
                </label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3 py-2 bg-white dark:bg-[#111319] border border-[#dae2fd] dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0075de]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  ชื่อโปรไฟล์ที่ต้องการแสดง
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="เช่น DJ Music Lover"
                  className="w-full px-3 py-2 bg-white dark:bg-[#111319] border border-[#dae2fd] dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0075de]"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>ยืนยันเข้าใช้งาน</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Footer note */}
          <p className="text-center text-[10px] text-[#85807a] dark:text-[#64748b] pt-1">
            การเข้าสู่ระบบถือว่าคุณยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวของ pleng.online
          </p>
        </div>
      </div>
    </div>
  );
};
