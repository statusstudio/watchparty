import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { AdPopupConfig } from '../types/index.js';

interface AdPopupModalProps {
  adPopup?: AdPopupConfig;
  isPreview?: boolean;
  onClose?: () => void;
}

export const AdPopupModal: React.FC<AdPopupModalProps> = ({ adPopup, isPreview, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!adPopup || !adPopup.imageUrl) {
      setIsOpen(false);
      return;
    }

    if (isPreview) {
      setIsOpen(true);
      return;
    }

    if (!adPopup.enabled) {
      setIsOpen(false);
      return;
    }

    // Unique key per ad revision
    const dismissKey = `pleng_ad_dismissed_${adPopup.updatedAt || 'v1'}`;

    // Check if dismissed in this session or today
    const sessionDismissed = sessionStorage.getItem(dismissKey);
    const localDismissed = localStorage.getItem(dismissKey);

    if (sessionDismissed || localDismissed) {
      setIsOpen(false);
      return;
    }

    // Show popup after brief 1-second delay so page settles nicely
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [adPopup, isPreview]);

  if (!isOpen || !adPopup || (!isPreview && !adPopup.enabled) || !adPopup.imageUrl) {
    return null;
  }

  const handleClose = (dontShowToday = false) => {
    if (!isPreview) {
      const dismissKey = `pleng_ad_dismissed_${adPopup.updatedAt || 'v1'}`;
      sessionStorage.setItem(dismissKey, 'true');
      if (dontShowToday) {
        localStorage.setItem(dismissKey, 'true');
      }
    }
    setIsOpen(false);
    onClose?.();
  };

  const handleAdClick = () => {
    if (adPopup.linkUrl && adPopup.linkUrl.trim()) {
      let targetUrl = adPopup.linkUrl.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
      window.open(targetUrl, adPopup.openInNewTab !== false ? '_blank' : '_self', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={() => handleClose(false)}
    >
      <div
        className="relative bg-white border border-[#e6e6e6] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={() => handleClose(false)}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors cursor-pointer z-20 shadow-md"
          title="ปิดโฆษณา"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Optional Title Banner */}
        {adPopup.title && adPopup.title.trim() && (
          <div className="px-5 py-2.5 bg-[#f6f5f4] border-b border-[#e6e6e6] pr-12 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#0075de]/10 text-[#0075de] text-[10px] font-bold">
              SPONSORED
            </span>
            <h4 className="text-xs font-semibold text-[#000000] truncate">
              {adPopup.title}
            </h4>
          </div>
        )}

        {/* Clickable Ad Banner */}
        <div
          onClick={handleAdClick}
          className={`relative max-h-[70vh] flex items-center justify-center bg-black/5 overflow-hidden ${
            adPopup.linkUrl ? 'cursor-pointer group' : ''
          }`}
        >
          <img
            src={adPopup.imageUrl}
            alt={adPopup.title || 'Advertisement'}
            className="w-full h-auto max-h-[65vh] object-contain block transition-transform group-hover:scale-[1.01]"
          />

          {/* Hover overlay hint if link exists */}
          {adPopup.linkUrl && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="px-4 py-2 rounded-full bg-white/95 text-[#000000] text-xs font-semibold shadow-xl flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                <span>เปิดดูข้อมูลเพิ่มเติม</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#0075de]" />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-2.5 bg-[#f6f5f4] border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#615d59]">
          <button
            type="button"
            onClick={() => handleClose(true)}
            className="text-[11px] text-[#a39e98] hover:text-[#31302e] hover:underline cursor-pointer"
          >
            ไม่ต้องแสดงอีกในวันนี้
          </button>

          <div className="flex items-center gap-2">
            {adPopup.linkUrl && (
              <button
                type="button"
                onClick={handleAdClick}
                className="px-3 py-1 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <span>ไปยังเว็บไซต์</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleClose(false)}
              className="px-3 py-1 rounded-full bg-white hover:bg-[#e6e6e6] border border-[#e6e6e6] text-[#31302e] text-[11px] font-medium transition-colors cursor-pointer shadow-xs"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
