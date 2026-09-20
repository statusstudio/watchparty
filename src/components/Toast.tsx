import React, { useEffect, useState } from 'react';
import { Info, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-20 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastMessage: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    info: <Info className="w-4 h-4 text-[#0075de] shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-[#1aae39] shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-[#dd5b00] shrink-0" />,
  };

  const bgStyles = {
    info: 'border-[#e6e6e6] bg-white text-[#000000] shadow-notion-modal',
    success: 'border-[#1aae39]/30 bg-white text-[#000000] shadow-notion-modal',
    warning: 'border-[#dd5b00]/30 bg-white text-[#000000] shadow-notion-modal',
  };

  const type = toast.type || 'info';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-notion-modal transition-all duration-300 text-sm ${
        bgStyles[type]
      } ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`}
    >
      {icons[type]}
      <span className="font-medium flex-1 text-xs sm:text-sm leading-snug text-[#000000]">{toast.message}</span>
    </div>
  );
};
