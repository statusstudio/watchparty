import React, { useState } from 'react';

interface StitchRoomCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (code: string) => void;
}

export const StitchRoomCodeModal: React.FC<StitchRoomCodeModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError('กรุณากรอกรหัสห้อง');
      return;
    }
    onJoinRoom(clean);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-sm rounded-2xl dark:bg-[#1d1f26] dark:border-white/[0.08] bg-white border border-[#dae2fd] p-6 shadow-2xl flex flex-col gap-4 relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined dark:text-[#00daf3] text-[#006194] text-[22px]">key</span>
            <h3 className="font-bold text-lg dark:text-[#e2e2ea] text-[#131b2e]">ใส่รหัสห้องฟังเพลง</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full dark:bg-[#282a30] dark:text-[#c1c6d5] bg-[#eaedff] text-[#475569] hover:text-[#131b2e] dark:hover:text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p className="text-xs dark:text-[#94A3B8] text-[#64748b]">
          กรอกรหัส 6 หลักเพื่อเข้าร่วมปาร์ตี้ส่วนตัวกับเพื่อนได้ทันที (เช่น PLG-942 หรือชื่อห้อง)
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="PLG-942"
              maxLength={20}
              autoFocus
              className="w-full text-center tracking-widest font-mono text-xl py-3 px-4 rounded-xl dark:bg-[#0c0e14] dark:border-white/[0.08] dark:text-[#00daf3] bg-[#faf8ff] border border-[#dae2fd] text-[#006194] font-bold focus:outline-none focus:ring-2 focus:ring-[#0075de] transition-all uppercase"
            />
            {error && <span className="text-xs text-[#ba1a1a] dark:text-[#ffb4ab] text-center">{error}</span>}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0075de] to-[#00daf3] text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,117,222,0.4)] active:scale-95 transition-all hover:brightness-110"
          >
            <span>เข้าร่วมทันที</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  );
};
