// Toast sutil de feedback (ADMIN-01/02): fade in con GSAP, auto-dismiss.
// Uso: const { toastEl, showToast } = useToast(); … {toastEl}

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { gsap } from '../../../lib/gsapReveal';
import { prefersReducedMotion } from '../../../lib/useReducedMotion';

type ToastKind = 'success' | 'error';

interface ToastState {
  id: number;
  kind: ToastKind;
  message: string;
}

function ToastItem({ toast, onDone }: { toast: ToastState; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && !prefersReducedMotion()) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
      );
    }
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [toast.id, onDone]);

  const Icon = toast.kind === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-center gap-3 rounded-sm border bg-paper px-4 py-3 shadow-lg ${
        toast.kind === 'success' ? 'border-hairline' : 'border-red-200 dark:border-red-900/50'
      }`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${toast.kind === 'success' ? 'text-brand-500' : 'text-red-600'}`}
        aria-hidden
      />
      <p className="text-sm font-light text-ink">{toast.message}</p>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    setToast({ id: Date.now(), kind, message });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  const toastEl = toast ? (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[70]">
      <ToastItem key={toast.id} toast={toast} onDone={dismiss} />
    </div>
  ) : null;

  return { toastEl, showToast };
}
