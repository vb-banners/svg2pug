import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const toastVariants = cva(
  'relative flex items-start gap-3 rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        success: 'bg-[#232937] border border-[#CAFF6C]/30 text-[#CAFF6C]',
        error: 'bg-[#232937] border border-[#FF3333]/30 text-[#FF3333]',
        warning: 'bg-[#232937] border border-[#FFC94F]/30 text-[#FFC94F]',
        info: 'bg-[#232937] border border-[#73D0FF]/30 text-[#73D0FF]',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const progressColors = {
  success: '#CAFF6C',
  error: '#FF3333',
  warning: '#FFC94F',
  info: '#73D0FF',
};

export interface ToastProps extends VariantProps<typeof toastVariants> {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  variant = 'info',
  title,
  description,
  duration = 5000,
  onClose,
}) => {
  const [isExiting, setIsExiting] = React.useState(false);
  const [progress, setProgress] = React.useState(100);
  const Icon = iconMap[variant || 'info'];
  const progressColor = progressColors[variant || 'info'];

  React.useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const handleClose = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 200);
  }, [id, onClose]);

  return (
    <div
      className={cn(
        toastVariants({ variant }),
        'animate-in slide-in-from-right-full',
        isExiting && 'animate-out slide-out-to-right-full opacity-0'
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[#C5C5C5]">{title}</p>
        {description && <p className="mt-1 text-xs text-[#6E7A8F]">{description}</p>}
      </div>
      <button
        onClick={handleClose}
        className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
        aria-label="Close notification"
      >
        <X className="w-4 h-4 text-[#6E7A8F] hover:text-[#C5C5C5]" />
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-lg overflow-hidden">
          <div
            className="h-full transition-all duration-100 ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
      )}
    </div>
  );
};
