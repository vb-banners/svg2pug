import React from 'react';
import { createPortal } from 'react-dom';
import { Toast } from './ui/toast';
import { useAppStore } from '../store/useAppStore';

export const ToastContainer: React.FC = () => {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            variant={toast.type}
            title={toast.title}
            description={toast.description}
            duration={toast.duration}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>,
    document.body
  );
};
