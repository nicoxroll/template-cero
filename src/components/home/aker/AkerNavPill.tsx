// Navigation Pill + Navigation Cards — DESIGN-AKER.md § Componentes clave.
// Pill Char (~32px alto, radio full, "PUNTO CERO" 12px w500 ls 0.12px +
// hamburger) flotante top-right que abre un panel Char de Navigation Cards,
// DOS por fila: thumbnail 4:3 a la izquierda + título 15px Paper +
// descripción 12px Mist + flecha 14px. Apertura/cierre animados con GSAP,
// Escape y click-outside cierran, scroll bloqueado mientras está abierto.
// Coexiste con el <Header/> público normal (ver Home.tsx) — es la navegación
// propia del hero Aker, no un reemplazo del header del sitio.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Menu, X } from 'lucide-react';
import { gsap } from '../../../lib/gsapReveal';
import { prefersReducedMotion } from '../../../lib/useReducedMotion';
import { AKER_NAV_THUMBS } from './akerImages';

interface NavCard {
  title: string;
  desc: string;
  to: string;
  thumb: string;
}

const NAV_CARDS: NavCard[] = [
  {
    title: 'Proyectos',
    desc: 'Torres, oficinas e infraestructura en ejecución y entregados.',
    to: '/proyectos',
    thumb: AKER_NAV_THUMBS.proyectos,
  },
  {
    title: 'Inversiones',
    desc: 'Fideicomisos y oportunidades con retorno estimado en USD.',
    to: '/inversiones',
    thumb: AKER_NAV_THUMBS.inversiones,
  },
  {
    title: 'Quiénes somos',
    desc: 'Un equipo, todas las etapas del desarrollo inmobiliario.',
    to: '/#quienes-somos',
    thumb: AKER_NAV_THUMBS.quienesSomos,
  },
  {
    title: 'Contacto',
    desc: 'Hablemos de tu próximo desarrollo o tu próxima inversión.',
    to: '/contacto',
    thumb: AKER_NAV_THUMBS.contacto,
  },
  {
    title: 'Equipo',
    desc: 'Operaciones, diseño, construcción y finanzas en una sola mesa.',
    to: '/#equipo',
    thumb: AKER_NAV_THUMBS.equipo,
  },
  {
    title: 'La historia',
    desc: 'De la primera obra al desarrollo de comunidades enteras.',
    to: '/#quienes-somos',
    thumb: AKER_NAV_THUMBS.historia,
  },
];

export default function AkerNavPill() {
  const [open, setOpen] = useState(false);
  // rendered ≠ open: el panel queda montado durante la animación de salida.
  const [rendered, setRendered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const openMenu = useCallback(() => {
    closingRef.current = false;
    setOpen(true);
    setRendered(true);
  }, []);

  const closeMenu = useCallback(() => {
    if (closingRef.current || !panelRef.current) {
      setOpen(false);
      setRendered(false);
      return;
    }
    setOpen(false);
    if (prefersReducedMotion()) {
      setRendered(false);
      return;
    }
    closingRef.current = true;
    gsap.to(panelRef.current, {
      opacity: 0,
      y: -10,
      scale: 0.98,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        closingRef.current = false;
        setRendered(false);
      },
    });
  }, []);

  // Animación de entrada: panel + stagger de cards.
  useEffect(() => {
    if (!rendered || !open || !panelRef.current) return;
    if (prefersReducedMotion()) return;
    const panel = panelRef.current;
    const cards = Array.from(panel.querySelectorAll('a'));
    const tl = gsap.timeline();
    tl.fromTo(
      panel,
      { opacity: 0, y: -10, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' },
    ).fromTo(
      cards,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out', stagger: 0.04 },
      '-=0.2',
    );
    return () => {
      tl.kill();
    };
  }, [rendered, open]);

  // Scroll lock mientras el menú está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape + click-outside cierran.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, closeMenu]);

  return (
    // top-16: debajo del header global del sitio (coexisten — ver nota
    // arriba); el pill flota solo sobre la foto como en la referencia.
    <div ref={rootRef} className="absolute top-16 right-4 z-30 sm:right-8">
      {/* Navigation Pill: Char bg, ~32px alto, radio full, 12px w500 ls 0.12px. */}
      <button
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        aria-expanded={open}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        className="inline-flex h-8 items-center gap-2.5 rounded-aker-pill bg-aker-char px-4 text-[12px] leading-none font-medium tracking-[0.12px] text-aker-paper uppercase transition-colors duration-300 hover:bg-black"
      >
        Punto Cero
        {open ? (
          <X aria-hidden strokeWidth={1.5} className="h-3.5 w-3.5" />
        ) : (
          <Menu aria-hidden strokeWidth={1.5} className="h-3.5 w-3.5" />
        )}
      </button>

      {rendered && (
        <div
          ref={panelRef}
          className="absolute top-full right-0 mt-3 max-h-[calc(100svh-110px)] w-[min(92vw,680px)] overflow-y-auto rounded-aker-card bg-aker-char p-3"
        >
          {/* Navigation Cards — DOS por fila: thumb 4:3 izquierda + título
              15px Paper + descripción 12px Mist + flecha 14px Paper. */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {NAV_CARDS.map((card) => (
              <Link
                key={card.title}
                to={card.to}
                onClick={closeMenu}
                className="group flex items-center gap-3 rounded-aker-card p-2 transition-colors duration-300 hover:bg-white/5"
              >
                <span className="aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-aker-card bg-white/10">
                  <img
                    src={card.thumb}
                    alt=""
                    loading="lazy"
                    className="aker-photo h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-normal text-aker-paper">
                    {card.title}
                  </span>
                  <span className="mt-1 block text-[12px] leading-snug text-aker-mist">
                    {card.desc}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden
                  strokeWidth={1.5}
                  className="h-3.5 w-3.5 shrink-0 text-aker-paper transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
