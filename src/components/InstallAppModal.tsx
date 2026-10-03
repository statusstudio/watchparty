import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Apple,
  Monitor,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc'>('android');

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    // Trigger direct APK download
    const link = document.createElement('a');
    link.href = '/download/apk';
    link.download = 'pleng.online.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) {
      onShowToast('กำลังเริ่มดาวน์โหลดไฟล์ pleng.online.apk (2.9 MB)... 🚀', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden animate-scale-up text-gray-900"
      >
        {/* Header */}
        <div className="relative p-4 sm:p-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  ดาวน์โหลดแอป pleng.online
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                  v1.0 (APK)
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                ใช้งานเต็มจอ ไร้แถบเบราว์เซอร์ ลื่นไหลและประหยัดแบตเตอรี่ยิ่งขึ้น
              </p>
            </div>
          </div>

          {/* Quick Download CTA Button */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadApk}
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>ดาวน์โหลดไฟล์ APK (ขนาด 2.9 MB)</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-gray-100 bg-gray-50/80 px-4 shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'android'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>วิธีติดตั้ง Android (.APK)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'ios'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iPhone / iPad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pc')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'pc'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>คอมพิวเตอร์ (PC / Mac)</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {activeTab === 'android' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  ไฟล์ APK นี้สร้างและรับรองความปลอดภัยโดยตรงจากระบบของ <strong>pleng.online</strong> ไม่มีโฆษณาแอบแฝง ปลอดภัย 100%
                </p>
              </div>

              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-emerald-700">
                ขั้นตอนการติดตั้งบนมือถือ Android ง่ายๆ ใน 4 ขั้นตอน:
              </h4>

              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">กดดาวน์โหลดไฟล์ .APK</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    แตะที่ปุ่ม <span className="text-emerald-700 font-semibold">"ดาวน์โหลดไฟล์ APK"</span> ด้านบน หรือดาวน์โหลดผ่านลิงก์{' '}
                    <code className="px-1.5 py-0.5 bg-gray-200 rounded text-[11px] font-mono text-gray-800">
                      https://pleng.online/download/apk
                    </code>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">แตะเปิดไฟล์ที่ดาวน์โหลดเสร็จแล้ว</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    เปิดจากแถบแจ้งเตือนด้านบนหน้าจอมือถือ หรือเปิดผ่านแอป <strong>"ไฟล์ (Files)"</strong> &rarr; โฟลเดอร์ <strong>"ดาวน์โหลด (Downloads)"</strong>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-gray-900">กดยินยอมติดตั้ง (หากขึ้นแจ้งเตือนความปลอดภัย)</p>
                  </div>
                  <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">
                    เนื่องจากเป็นการติดตั้งไฟล์ตรงนอก Play Store ระบบ Android จะขึ้นเตือนเป็นปกติ:
                  </p>
                  <div className="mt-2 p-2.5 bg-white border border-gray-200 rounded-xl space-y-1 text-xs text-gray-700">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>หากขึ้น "ไฟล์นี้อาจเป็นอันตราย":</span>
                    </div>
                    <p className="pl-5 text-gray-600">
                      ให้กด <strong>"ดาวน์โหลดต่อไป"</strong> หรือ <strong>"รายละเอียดเพิ่มเติม"</strong> &rarr; เลือก <strong>"ติดตั้งต่อไป (Install anyway)"</strong>
                    </p>
                    <div className="flex items-center gap-1.5 font-semibold text-gray-900 pt-1">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>หากขึ้น "ไม่อนุญาตให้ติดตั้งจากแหล่งนี้":</span>
                    </div>
                    <p className="pl-5 text-gray-600">
                      แตะ <strong>"การตั้งค่า (Settings)"</strong> &rarr; เปิดสวิตช์ <strong>"อนุญาตจากแหล่งที่มานี้"</strong> แล้วกดกลับมาติดตั้ง
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                  4
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">เสร็จสิ้น พร้อมใช้งาน!</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    กด <strong>"ติดตั้ง"</strong> รอประมาณ 2 วินาที ไอคอนแอป <strong>pleng.online</strong> จะปรากฏบนหน้าจอหลัก เปิดใช้งานได้ทันทีแบบเต็มจอ
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-blue-50/80 border border-blue-200/90 rounded-2xl text-blue-900 text-xs leading-relaxed">
                <p>
                  สำหรับ <strong>iPhone และ iPad</strong> สามารถติดตั้งเป็นแอปผ่านระบบ PWA บนเบราว์เซอร์ <strong>Safari</strong> ได้ง่ายๆ โดยไม่ต้องโหลดไฟล์ APK ครับ
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">เปิดเว็บใน Safari</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      เปิดเว็บ <code className="text-blue-600 font-semibold">https://pleng.online</code> ด้วยเบราว์เซอร์ Safari บน iPhone
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">แตะปุ่มแชร์ (Share)</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      แตะที่ไอคอนรูปสี่เหลี่ยมที่มีลูกศรชี้ขึ้น <strong>(Share)</strong> บริเวณแถบเมนูด้านล่างของ Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">เลือก "เพิ่มไปยังหน้าจอโฮม"</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      เลื่อนลงมาแล้วแตะเมนู <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong> จากนั้นแตะ <strong>"เพิ่ม" (Add)</strong> มุมบนขวา
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pc' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-purple-50/80 border border-purple-200/90 rounded-2xl text-purple-900 text-xs leading-relaxed">
                <p>
                  สำหรับ <strong>คอมพิวเตอร์ (Windows / Mac)</strong> สามารถติดตั้งแอปผ่านเบราว์เซอร์ Chrome หรือ Edge เพื่อเปิดใช้งานเป็นหน้าต่างโปรแกรมแยกได้ทันที
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">แตะไอคอนติดตั้งที่แถบ URL</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      สังเกตที่มุมขวาสุดของช่องกรอกที่อยู่เว็บ (URL Bar) บน Google Chrome หรือ Microsoft Edge จะมีไอคอนรูป <strong>คอมพิวเตอร์พร้อมลูกศรลง</strong> หรือเครื่องหมายบวก <strong>(+)</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">คลิก "ติดตั้ง (Install)"</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      คลิกปุ่มติดตั้ง pleng.online จะถูกเพิ่มเป็นโปรแกรมบนเดสก์ท็อปและทาสก์บาร์ของคุณทันที
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500">
            pleng.online &bull; ฟรี 100% ไม่มีโฆษณา
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
