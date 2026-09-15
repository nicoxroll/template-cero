// Diálogo de confirmación elegante para acciones destructivas (ADMIN-01/02).

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { gsap } from '../../../lib/gsapReveal';
import { prefersReducedMotion } from '../../../lib/useReducedMotion';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (!prefersReducedMotion()) {
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      }
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' },
        );
      }
    }
    const onKey = (e: KeyboardEvent) => {
      // Igual que el click en overlay: no cerrar mientras el borrado está en curso
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={busy ? undefined : onCancel}
        aria-hidden
      />
      <div
        ref={cardRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-md rounded-sm border border-line bg-paper p-8"
      >
        <h2
          id="confirm-title"
          className="text-xl font-light uppercase tracking-wide text-ink"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-none border border-ink px-6 py-2.5 text-sm font-medium uppercase tracking-widest text-ink transition-all duration-300 hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-none bg-brand-900 px-6 py-2.5 text-sm font-medium uppercase tracking-widest text-white transition-all duration-300 hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
