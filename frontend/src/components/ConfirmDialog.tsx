import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  content: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  content,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  visible,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  const handleCancel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onCancel();
    }, 200);
  };

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onConfirm();
    }, 200);
  };

  if (!visible && !isClosing) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-all duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-sm transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(10,10,10,1)_100%)] shadow-2xl">
          {/* Accent glow */}
          <div className="pointer-events-none absolute right-[-20%] top-[-20%] h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 p-5">
            {/* Icon + Title */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <AlertCircle size={20} className="text-primary" />
              </div>
              <h3 className="text-base font-black text-white">{title}</h3>
            </div>

            {/* Content */}
            <div className="mb-4 text-sm leading-normal text-neutral-400">
              {typeof content === 'string' ? <p>{content}</p> : content}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 py-2.5 text-sm font-bold text-neutral-300 transition-all hover:border-neutral-600 hover:bg-neutral-800 active:scale-[0.98]"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-black transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;

export const useConfirmDialog = () => {
  const [config, setConfig] = useState<{
    visible: boolean;
    title: string;
    content: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    content: '',
  });

  const show = (options: {
    title: string;
    content: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({
        ...options,
        visible: true,
        onConfirm: () => {
          setConfig((prev) => ({ ...prev, visible: false }));
          resolve(true);
        },
      });
    });
  };

  const handleCancel = () => {
    setConfig((prev) => ({ ...prev, visible: false }));
    if (config.onConfirm) {
      Promise.resolve(false);
    }
  };

  const handleConfirm = () => {
    if (config.onConfirm) {
      config.onConfirm();
    }
  };

  const DialogComponent = () => (
    <ConfirmDialog
      {...config}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { show, DialogComponent };
};
