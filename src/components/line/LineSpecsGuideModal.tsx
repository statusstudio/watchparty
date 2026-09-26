import React from 'react';
import { X, BookOpen, Check, AlertCircle, ExternalLink, HelpCircle } from 'lucide-react';
import { STICKER_SPECS } from '../../types/sticker';

interface LineSpecsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LineSpecsGuideModal: React.FC<LineSpecsGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-['Prompt']">
                คู่มือสเปคและข้อกำหนดทางการ LINE Creators Market
              </h3>
              <p className="text-xs text-slate-400">
                ขนาดรูปภาพ ขอบโปร่งใส และระยะขอบ 10px ที่ต้องรู้
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-300">
          {/* Comparison Table */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white font-['Prompt']">
              1. สรุปขนาดรูปภาพตามประเภทสติกเกอร์
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-200">
                    <th className="p-3 font-semibold">ประเภท</th>
                    <th className="p-3 font-semibold">ขนาด Sticker</th>
                    <th className="p-3 font-semibold">main.png</th>
                    <th className="p-3 font-semibold">tab.png</th>
                    <th className="p-3 font-semibold">Margin ปลอดภัย</th>
                    <th className="p-3 font-semibold">รูปแบบชื่อไฟล์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="p-3 font-sans text-emerald-400 font-semibold">Standard</td>
                    <td className="p-3">370 × 320 px</td>
                    <td className="p-3 text-amber-400">240 × 240 px</td>
                    <td className="p-3 text-sky-400">96 × 74 px</td>
                    <td className="p-3 font-sans">10 px</td>
                    <td className="p-3 text-slate-400">01.png - 40.png</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans text-emerald-400 font-semibold">Big Sticker</td>
                    <td className="p-3">396 × 660 px</td>
                    <td className="p-3 text-amber-400">240 × 240 px</td>
                    <td className="p-3 text-sky-400">96 × 74 px</td>
                    <td className="p-3 font-sans">10 px</td>
                    <td className="p-3 text-slate-400">01.png - 40.png</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans text-emerald-400 font-semibold">Emoji</td>
                    <td className="p-3">180 × 180 px</td>
                    <td className="p-3 text-slate-500 font-sans">ไม่มี</td>
                    <td className="p-3 text-sky-400">96 × 74 px</td>
                    <td className="p-3 font-sans">2 px</td>
                    <td className="p-3 text-slate-400">001.png - 040.png</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Golden Rules */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white font-['Prompt']">
              2. กฎเหล็ก 4 ข้อที่ระบบ LINE Sticker Studio จัดการให้อัตโนมัติ
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>เว้นระยะขอบ (Margin) อย่างน้อย 10px</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  LINE กำหนดให้เว้นขอบว่างโปร่งใสรอบตัวละครประมาณ 10px เพื่อไม่ให้สติกเกอร์ถูกตัดหรือชนขอบบอลลูนแชท
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>ขนาดพิกเซลต้องเป็น "เลขคู่" เสมอ</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ระบบจะปรับให้ขนาด W และ H เป็นเลขคู่ทั้งหมด ป้องกันการถูกปฏิเสธ (Reject) จากระบบตรวจของ LINE
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>พื้นหลังต้องโปร่งใส 100% (PNG RGB Alpha)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  อัลกอริทึม 5 ขั้นตอนจะเจาะพื้นหลัง กัดขอบ และลบสีรั่ว เพื่อให้สติกเกอร์กลมกลืนกับทุกสีพื้นหลังแชท
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>ขนาดไฟล์ไม่เกิน 1 MB ต่อรูป</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ระบบแปลงและบีบอัดภาพ PNG ให้คมชัดสูงสุดในขณะที่ไฟล์มีขนาดเฉลี่ยเพียง 30-150 KB เท่านั้น
                </p>
              </div>
            </div>
          </div>

          {/* Submission Steps */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-200 space-y-2">
            <h5 className="font-semibold text-emerald-400 font-['Prompt']">
              ขั้นตอนการส่งขายบน LINE Creators Market:
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
              <li>คลิกปุ่ม "แพ็กไฟล์ ZIP" ในแอพนี้เพื่อดาวน์โหลดไฟล์ ZIP ที่สมบูรณ์</li>
              <li>ล็อกอินที่ <a href="https://creator.line.me" target="_blank" rel="noreferrer" className="text-emerald-400 underline">creator.line.me</a> ด้วยบัญชี LINE ของคุณ</li>
              <li>เลือก "สร้างรายการใหม่" &gt; "สติกเกอร์" กรอกชื่อและคำอธิบาย</li>
              <li>ไปที่แท็บ "รูปภาพสติกเกอร์" แล้วกด "อัปโหลดไฟล์ ZIP" เลือกไฟล์ ZIP ที่ดาวน์โหลดไป</li>
              <li>ตรวจสอบพรีวิว แล้วกด "ส่งคำขอ (Submit)" เพื่อรอระบบ LINE ตรวจสอบและอนุมัติ</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <a
            href="https://creator.line.me/th/guideline/sticker/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
          >
            <span>อ่านคู่มือทางการบน LINE Official</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
};
