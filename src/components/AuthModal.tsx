import React, { useState, useEffect } from 'react';
import {
  X,
  LogOut,
  Sparkles,
  ShieldCheck,
  Heart,
  Users,
  Lock,
  KeyRound,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
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
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | 'email' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email Sign In States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Email Registration States
  const [registerStep, setRegisterStep] = useState<'form' | 'otp'>('form');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setRegisterStep('form');
      setOtpCode('');
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const isMember = currentUser.provider === 'google' || currentUser.provider === 'facebook' || currentUser.provider === 'email';

  // 1. Handle Member Sign In (Email + Password)
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoadingProvider('email');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMessage(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoadingProvider(null);
    }
  };

  // 2. Handle Register Step 1: Request Email OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim()) {
      setErrorMessage('กรุณาระบุชื่อที่ต้องการแสดง');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('กรุณาระบุอีเมลที่ถูกต้อง');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoadingProvider('email');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          name: regName.trim(),
          password: regPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRegisterStep('otp');
        setResendCooldown(60);
        setSuccessMessage(`ส่งรหัสยืนยัน 6 หลักไปยัง ${regEmail.trim()} แล้ว`);
      } else {
        setErrorMessage(data.error || 'ไม่สามารถส่งรหัสยืนยันได้');
      }
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาดในการส่งรหัส OTP');
    } finally {
      setLoadingProvider(null);
    }
  };

  // 3. Handle Register Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpCode.trim().length !== 6) {
      setErrorMessage('กรุณากรอกรหัสยืนยัน 6 หลักให้ครบถ้วน');
      return;
    }

    setLoadingProvider('email');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMessage(data.error || 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ');
      }
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาดในการยืนยันรหัส OTP');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Trigger Google Login
  const handleGoogleAuth = async () => {
    setLoadingProvider('google');
    setErrorMessage(null);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await signInWithGoogle();
        if (error) throw error;
      } else {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in text-[#31302e]">
      <div className="bg-white border border-[#e6e6e6] rounded-2xl w-full max-w-md overflow-hidden shadow-notion-modal flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 pt-5 pb-3 border-b border-[#e6e6e6] bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0075de]/10 border border-[#0075de]/20 text-[#0075de] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#000000] tracking-tight">
                  {authMode === 'signin' ? 'เข้าสู่ระบบสมาชิก' : 'สมัครสมาชิกใหม่ผ่าน Email'}
                </h2>
                <p className="text-xs text-[#615d59]">
                  {authMode === 'signin'
                    ? 'ยินดีต้อนรับกลับสู่ pleng.online'
                    : 'ยืนยันรหัส 6 หลักทางอีเมล ปลอดภัย ไร้สแปม'}
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

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-[#f6f5f4] p-1 rounded-xl border border-[#e6e6e6] mt-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-white text-[#0075de] shadow-xs'
                  : 'text-[#615d59] hover:text-[#000000]'
              }`}
            >
              <span>เข้าสู่ระบบ (Sign In)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setRegisterStep('form');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-[#0075de] shadow-xs'
                  : 'text-[#615d59] hover:text-[#000000]'
              }`}
            >
              <span>สมัครสมาชิก (Register)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
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
                {currentUser.provider === 'email' && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-[#0075de] border border-blue-200 text-[9px] font-bold">
                    Email Member
                  </span>
                )}
                {currentUser.provider === 'google' && (
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
                {currentUser.email || 'ยังไม่ได้ระบุอีเมล'}
              </p>
            </div>

            {isMember && (
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

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {authMode === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all shadow-xs"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านของคุณ"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono shadow-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingProvider !== null}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loadingProvider === 'email' ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* MODE 2: REGISTER (EMAIL + OTP VERIFICATION ONLY) */}
          {authMode === 'register' && registerStep === 'form' && (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">
                  ชื่อแสดงในห้อง (Display Name)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="เช่น Alex, น้องเมย์"
                    className="w-full pl-9 pr-3.5 py-2 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">
                  อีเมล (Email สำหรับรับรหัส OTP 6 หลัก)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#000000]">
                    รหัสผ่าน
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัว"
                    className="w-full px-3 py-2 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#000000]">
                    ยืนยันรหัสผ่าน
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="พิมพ์รหัสซ้ำ"
                    className="w-full px-3 py-2 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingProvider !== null}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>{loadingProvider === 'email' ? 'กำลังส่งรหัส...' : 'ขอรับรหัสยืนยัน OTP ทาง Email'}</span>
              </button>
            </form>
          )}

          {/* MODE 2: REGISTER STEP 2 - ENTER 6-DIGIT OTP */}
          {authMode === 'register' && registerStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#0075de] space-y-1 text-center">
                <p className="font-bold">รหัสยืนยัน 6 หลักถูกส่งไปยัง:</p>
                <p className="font-mono text-sm text-[#005bab]">{regEmail}</p>
                <p className="text-[11px] text-[#615d59]">
                  (รหัสยืนยันมีอายุ 10 นาที หากไม่พบในกล่องจดหมาย ให้ตรวจดูในโฟลเดอร์ Junk/Spam)
                </p>
              </div>

              <div className="space-y-1.5 text-center">
                <label className="block text-xs font-semibold text-[#000000]">
                  กรอกรหัสยืนยัน 6 หลัก (OTP Code)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-48 mx-auto text-center tracking-[8px] text-2xl font-bold font-mono py-2.5 px-3 bg-[#f6f5f4] focus:bg-white border-2 border-[#0075de] rounded-xl text-[#0075de] focus:outline-none shadow-xs"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loadingProvider !== null || otpCode.length !== 6}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loadingProvider === 'email' ? 'กำลังตรวจสอบรหัส...' : 'ยืนยันรหัสและเปิดใช้งานบัญชี'}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1 text-[#615d59]">
                <button
                  type="button"
                  onClick={() => setRegisterStep('form')}
                  className="hover:text-[#000000] underline cursor-pointer"
                >
                  ← แก้ไขอีเมล
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || loadingProvider !== null}
                  onClick={handleSendOtp}
                  className="hover:text-[#0075de] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{resendCooldown > 0 ? `ส่งรหัสใหม่ได้ใน ${resendCooldown}s` : 'ขอรหัส OTP ใหม่'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Social Sign-in Divider */}
          {authMode === 'signin' && (
            <div className="pt-2 border-t border-[#e6e6e6] space-y-2.5">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#e6e6e6]"></div>
                <span className="flex-shrink mx-2 text-[10px] text-[#a39e98] uppercase font-semibold">หรือเข้าสู่ระบบด้วย</span>
                <div className="flex-grow border-t border-[#e6e6e6]"></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loadingProvider !== null}
                  onClick={handleGoogleAuth}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-[#f6f5f4] text-[#000000] font-semibold text-xs border border-[#e6e6e6] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.2.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  disabled={loadingProvider !== null}
                  onClick={handleFacebookAuth}
                  className="py-2 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>
            </div>
          )}

          {/* Member Benefits */}
          <div className="p-3.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-1.5">
            <h3 className="text-xs font-semibold text-[#000000] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1aae39]" /> สิทธิพิเศษของสมาชิก pleng.online:
            </h3>
            <div className="text-[11px] text-[#615d59] space-y-1">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3 h-3 text-[#ff64c8] shrink-0" />
                <span>บันทึกเพลงโปรดและคลังเพลย์ลิสต์ส่วนตัว</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-[#0075de] shrink-0" />
                <span>ห้องพักและประวัติเพลงจะคงอยู่ตลอดไป ไม่ถูกลบเมื่อออกห้อง</span>
              </div>
            </div>
          </div>

          {/* Admin link notification */}
          <div className="pt-2 text-center border-t border-[#e6e6e6]">
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                window.location.pathname = '/admin';
              }}
              className="text-[11px] text-[#a39e98] hover:text-[#615d59] inline-flex items-center gap-1 transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>เข้าสู่ระบบเฉพาะเจ้าของเว็บไซต์ (Admin Portal /admin)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
