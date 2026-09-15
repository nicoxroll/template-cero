// Bento cluster del hero — pieza distintiva del skin Aker (ver DESIGN-AKER.md
// § Layout y el brief de reconstrucción): (i) card oscura con thumbnail +
// título + descripción + flecha; (ii) dos pills lado a lado; (iii) card verde
// sólida con marca + label; (iv) card fotográfica con caption. Flota sobre la
// mitad derecha del hero en desktop; en mobile pasa a flujo normal debajo del
// intro (collapse responsivo, ver DESIGN-AKER.md § Do: "cards 8px radius").

import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { gsapReveal } from '../../../lib/gsapReveal';
import { AKER_HERO_CARD_THUMB, AKER_HISTORIA_PHOTO } from './akerImages';
import { AkerPillButton } from './AkerPrimitives';

/** Marca "punto cero": círculo con punto central — geometría propia, sin depender de logo bitmap. */
function PuntoCeroMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <circle cx="16" cy="16" r="13.5" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}

export default function AkerHeroBento() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(Array.from(ref.current.children), { stagger: 0.1, y: 16, delay: 0.25, start: 'top 95%' });
  }, []);

  return (
    <div
      ref={ref}
      className="relative z-10 mt-8 flex flex-col gap-2.5 sm:absolute sm:top-32 sm:right-4 sm:mt-0 sm:w-[340px] md:right-8 md:w-[380px] lg:w-[420px]"
    >
      {/* (i) Card oscura — thumbnail + título + descripción + flecha */}
      <Link
        to="/#servicios"
        className="group flex items-stretch gap-3 rounded-aker-card bg-aker-char/90 p-2.5 backdrop-blur-sm transition-colors duration-300 hover:bg-aker-char"
      >
        <span className="rounded-aker-small aspect-square w-24 shrink-0 overflow-hidden sm:w-28">
          <img
            src={AKER_HERO_CARD_THUMB}
            alt=""
            aria-hidden
            loading="eager"
            className="aker-photo h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1 pr-2">
          <span className="flex items-center gap-1.5 text-[15px] font-normal text-aker-paper">
            Arquitectura y diseño
            <ArrowRight
              aria-hidden
              strokeWidth={1.5}
              className="h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
            />
          </span>
          <span className="text-xs leading-snug text-aker-mist">
            Identidad, planificación y reposicionamiento de proyectos residenciales.
          </span>
        </span>
      </Link>

      {/* (ii) Dos pills outline lado a lado — variante enfatizada 80px radius,
          padding 19px/16px (DESIGN-AKER.md § Text-Arrow Button). */}
      <div className="flex flex-wrap gap-2.5">
        <AkerPillButton to="/#equipo" variant="outline" dark className="flex-1">
          Nuestro equipo
        </AkerPillButton>
        <AkerPillButton to="/contacto" variant="outline" dark className="flex-1">
          Contacto
        </AkerPillButton>
      </div>

      {/* (iii) + (iv) — card verde sólida + card fotográfica */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          to="/inversiones"
          className="group flex aspect-square flex-col justify-between rounded-aker-card bg-brand-900 p-4 transition-colors duration-300 hover:bg-brand-700"
        >
          <PuntoCeroMark className="h-7 w-7 text-aker-paper" />
          <span className="text-[13px] leading-tight font-medium text-aker-paper">
            Panel de inversiones
          </span>
        </Link>

        <Link
          to="/#quienes-somos"
          className="group relative aspect-square overflow-hidden rounded-aker-card"
        >
          <img
            src={AKER_HISTORIA_PHOTO}
            alt=""
            aria-hidden
            loading="lazy"
            className="aker-photo absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          <span className="relative z-10 flex h-full items-end p-4 text-[13px] leading-tight font-medium text-aker-paper">
            La historia de Punto Cero
          </span>
        </Link>
      </div>
    </div>
  );
}
