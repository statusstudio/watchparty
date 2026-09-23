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

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'forgot'>('signin');
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setRegisterStep('form');
      setForgotStep('email');
      setOtpCode('');
      setForgotOtpCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let timer: any;
    if (forgotResendCooldown > 0) {
      timer = setTimeout(() => setForgotResendCooldown(forgotResendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [forgotResendCooldown]);

  if (!isOpen) return null;

  const isMember = currentUser.provider === 'email';

  // 1. Handle Member Sign In (Email + Password)
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

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
      setIsLoading(false);
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

    setIsLoading(true);
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
      setIsLoading(false);
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

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // 4. Handle Forgot Password Step 1: Send Reset OTP
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setForgotStep('reset');
        setForgotResendCooldown(60);
        setSuccessMessage(`ส่งรหัสยืนยัน 6 หลักไปยัง ${forgotEmail.trim()} แล้ว`);
      } else {
        setErrorMessage(data.error || 'ไม่สามารถส่งรหัสรีเซ็ตได้');
      }
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาดในการส่งรหัส OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Handle Forgot Password Step 2: Verify OTP & Reset Password
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (forgotOtpCode.trim().length !== 6) {
      setErrorMessage('กรุณากรอกรหัสยืนยัน 6 หลักให้ครบถ้วน');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setErrorMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: forgotOtpCode.trim(),
          newPassword: forgotNewPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMessage(data.error || 'รหัสยืนยันไม่ถูกต้องหรือเกิดข้อผิดพลาด');
      }
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    } finally {
      setIsLoading(false);
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
                {authMode === 'forgot' ? <KeyRound className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-[#000000] tracking-tight">
                  {authMode === 'signin'
                    ? 'เข้าสู่ระบบสมาชิก'
                    : authMode === 'register'
                    ? 'สมัครสมาชิกใหม่ผ่าน Email'
                    : 'รีเซ็ตรหัสผ่าน (ลืมรหัสผ่าน)'}
                </h2>
                <p className="text-xs text-[#615d59]">
                  {authMode === 'signin'
                    ? 'ยินดีต้อนรับกลับสู่ pleng.online'
                    : authMode === 'register'
                    ? 'ยืนยันรหัส 6 หลักทางอีเมล ปลอดภัย ไร้สแปม'
                    : 'กู้คืนรหัสผ่านด้วยรหัสยืนยัน OTP 6 หลัก'}
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
          {authMode !== 'forgot' ? (
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
          ) : (
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-[#0075de] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>← กลับไปหน้าเข้าสู่ระบบ</span>
              </button>
            </div>
          )}
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
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#000000]">
                    รหัสผ่าน (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setForgotStep('email');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setForgotEmail(loginEmail);
                    }}
                    className="text-[11px] text-[#0075de] hover:underline cursor-pointer"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
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
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
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

              {/* Reminder banner about Gmail Junk/Spam/Trash */}
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed text-[11px]">
                  <p className="font-bold text-amber-950">💡 คำแนะนำสำหรับการรับรหัส OTP:</p>
                  <p>
                    เมื่อกดขอรหัสแล้ว หากไม่พบอีเมลในกล่องจดหมายหลัก (Inbox) <strong>โปรดตรวจดูในโฟลเดอร์ "จดหมายขยะ (Spam / Junk Mail)" หรือ "ถังขยะ (Trash)"</strong> ด้วยนะครับ เนื่องจากระบบของ Gmail หรือผู้ให้บริการอีเมลอาจคัดกรองผิดพลาด
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>{isLoading ? 'กำลังส่งรหัส...' : 'ขอรับรหัสยืนยัน OTP ทาง Email'}</span>
              </button>
            </form>
          )}

          {/* MODE 2: REGISTER STEP 2 - ENTER 6-DIGIT OTP */}
          {authMode === 'register' && registerStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold">
                  <Mail className="w-4 h-4 text-[#0075de]" />
                  <span>รหัสยืนยัน 6 หลักถูกส่งไปยัง:</span>
                </div>
                <p className="font-mono text-sm font-bold text-[#0075de]">{regEmail}</p>

                <div className="p-2.5 rounded-lg bg-white/95 border border-amber-300 text-[11px] text-amber-900 text-left space-y-1 shadow-xs">
                  <p className="font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>สำคัญมาก: หากไม่พบอีเมลในกล่องเข้า (Inbox)</span>
                  </p>
                  <p className="leading-relaxed text-[#5a4810]">
                    กรุณาคลิกตรวจดูในโฟลเดอร์ <strong>"จดหมายขยะ / สแปม (Spam / Junk Mail)" หรือ "ถังขยะ (Trash)"</strong> ด้วยนะครับ เนื่องจากระบบกรองอีเมลของ Gmail/Outlook อาจคัดแยกผิดกล่อง
                  </p>
                </div>

                <p className="text-[10px] text-[#8c7430]">
                  (รหัสยืนยันมีอายุ 10 นาที สามารถกดขอรหัสใหม่ได้หากยังไม่ได้รับ)
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
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isLoading ? 'กำลังตรวจสอบรหัส...' : 'ยืนยันรหัสและเปิดใช้งานบัญชี'}</span>
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
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleSendOtp}
                  className="hover:text-[#0075de] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{resendCooldown > 0 ? `ส่งรหัสใหม่ได้ใน ${resendCooldown}s` : 'ขอรหัส OTP ใหม่'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD (RESET PASSWORD) */}
          {authMode === 'forgot' && forgotStep === 'email' && (
            <form onSubmit={handleForgotSendOtp} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs leading-relaxed">
                ระบุอีเมลที่คุณใช้ลงทะเบียน เราจะส่งรหัสยืนยัน OTP 6 หลักเพื่อใช้ตั้งรหัสผ่านใหม่
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">
                  อีเมลของคุณ (Registered Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all shadow-xs"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>{isLoading ? 'กำลังส่งรหัส...' : 'ขอรับรหัส OTP เพื่อรีเซ็ตรหัสผ่าน'}</span>
              </button>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD STEP 2 - ENTER OTP & NEW PASSWORD */}
          {authMode === 'forgot' && forgotStep === 'reset' && (
            <form onSubmit={handleForgotResetPassword} className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold">
                  <Mail className="w-4 h-4 text-[#0075de]" />
                  <span>ส่งรหัสรีเซ็ตรหัสผ่านไปยัง:</span>
                </div>
                <p className="font-mono text-sm font-bold text-[#0075de]">{forgotEmail}</p>

                <div className="p-2.5 rounded-lg bg-white/95 border border-amber-300 text-[11px] text-amber-900 text-left space-y-1 shadow-xs">
                  <p className="font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>สำคัญมาก: หากไม่พบอีเมลในกล่องเข้า (Inbox)</span>
                  </p>
                  <p className="leading-relaxed text-[#5a4810]">
                    กรุณาตรวจดูในโฟลเดอร์ <strong>"จดหมายขยะ / สแปม (Spam / Junk)" หรือ "ถังขยะ (Trash)"</strong> ด้วยนะครับ
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-center">
                <label className="block text-xs font-semibold text-[#000000]">
                  กรอกรหัสยืนยัน 6 หลัก (OTP Code)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={forgotOtpCode}
                  onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-48 mx-auto text-center tracking-[8px] text-2xl font-bold font-mono py-2 px-3 bg-[#f6f5f4] focus:bg-white border-2 border-[#0075de] rounded-xl text-[#0075de] focus:outline-none shadow-xs"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#000000]">
                    รหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัว"
                    className="w-full px-3 py-2 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#000000]">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="พิมพ์รหัสซ้ำ"
                    className="w-full px-3 py-2 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || forgotOtpCode.length !== 6}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่และเข้าสู่ระบบ'}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1 text-[#615d59]">
                <button
                  type="button"
                  onClick={() => setForgotStep('email')}
                  className="hover:text-[#000000] underline cursor-pointer"
                >
                  ← แก้ไขอีเมล
                </button>

                <button
                  type="button"
                  disabled={forgotResendCooldown > 0 || isLoading}
                  onClick={handleForgotSendOtp}
                  className="hover:text-[#0075de] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{forgotResendCooldown > 0 ? `ส่งรหัสใหม่ได้ใน ${forgotResendCooldown}s` : 'ขอรหัส OTP ใหม่'}</span>
                </button>
              </div>
            </form>
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
