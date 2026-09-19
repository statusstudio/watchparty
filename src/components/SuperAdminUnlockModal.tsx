import React, { useState } from 'react';
import { ShieldCheck, Lock, X, KeyRound, AlertCircle } from 'lucide-react';

interface SuperAdminUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

export const SuperAdminUnlockModal: React.FC<SuperAdminUnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/platform/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('watchparty_superadmin', 'true');
        onUnlockSuccess();
        onClose();
      } else {
        setError(data.error || 'รหัส Master Passcode ไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#151722] border border-amber-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-1">
            แดชบอร์ดเจ้าของเว็บ (Platform Owner) 👑
          </h2>
          <p className="text-xs text-gray-400">
            กรุณากรอกรหัสผ่าน Master Passcode เพื่อยืนยันสิทธิ์ในการเข้าถึงแดชบอร์ดจัดการระบบ
          </p>
          <div className="mt-2 inline-block px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 font-mono">
            รหัสผ่านเริ่มต้น: <span className="font-bold underline">admin888</span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="กรอก Master Passcode..."
              className="w-full px-4 py-2.5 bg-[#0f0f13] border border-gray-700 focus:border-amber-500 rounded-xl text-sm text-white text-center tracking-widest focus:outline-none transition-colors"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !passcode.trim()}
            className="w-full py-2.5 rounded-xl font-medium text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่แดชบอร์ดเจ้าของเว็บ'}
          </button>
        </form>
      </div>
    </div>
  );
};
