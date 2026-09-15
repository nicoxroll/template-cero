// Side-panel de edición del admin (ADMIN-01/02): entra desde la derecha con GSAP,
// overlay, cierre por Esc/overlay, scroll interno.

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { gsap } from '../../../lib/gsapReveal';
import { pauseSmoothScroll, resumeSmoothScroll } from '../../../lib/smoothScroll';
import { prefersReducedMotion } from '../../../lib/useReducedMotion';

interface SidePanelProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function SidePanel({ open, title, subtitle, onClose, children }: SidePanelProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    if (!prefersReducedMotion()) {
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      }
      if (panelRef.current) {
        gsap.fromTo(
          panelRef.current,
          { x: 48, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' },
        );
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    // `overflow: hidden` NO frena el fondo: Lenis scrollea la ventana por su
    // cuenta e ignora ese overflow, así que con el panel abierto la página de
    // atrás seguía moviéndose. Hay que frenar a Lenis además del overflow —el
    // overflow sigue sirviendo con reduced-motion, donde Lenis ni se instancia.
    document.body.style.overflow = 'hidden';
    pauseSmoothScroll();

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      resumeSmoothScroll();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-paper shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-line px-6 py-5 md:px-8">
          <div>
            <h2
              id="panel-title"
              className="text-xl font-light uppercase tracking-wide text-ink"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs font-light text-ink-soft">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="rounded-sm p-2 text-ink-soft transition-colors duration-300 hover:bg-paper-soft hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        {/* data-lenis-prevent: Lenis intercepta la rueda a nivel documento, así
            que sin este atributo el gesto adentro del panel scrolleaba la
            página de atrás en vez del formulario. Es el arreglo que Lenis
            documenta para contenedores anidados. */}
        {/* Sin padding ABAJO: la barra de acciones va `sticky bottom-0` y se
            pega al borde inferior de este contenedor. Con padding-bottom, el
            borde queda 24 px más arriba del piso visible del panel y la barra
            se ve flotando, con formulario asomando por debajo. El respiro lo
            pone la propia barra con su py-4. */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto px-6 pt-6 md:px-8">
          {children}
        </div>
      </aside>
    </div>
  );
}
