// Full-Bleed Hero — DESIGN-AKER.md § Componentes clave: foto 100vh sin
// radius, wordmark monumental Paper bottom-left, párrafo intro serif
// top-left, navigation pill top-right, bento cluster flotante a la derecha
// (ver AkerHeroBento.tsx — pieza distintiva del skin, ver brief de
// reconstrucción). "Sin overlay explícito — el filtro lo da la foto": el
// tratamiento muted/cool viene de un filter CSS sobre la imagen, no de un
// gradiente oscuro grueso (solo un scrim mínimo para legibilidad del texto).

import { useEffect, useRef } from 'react';
import { gsapReveal } from '../../../lib/gsapReveal';
import { AKER_HERO_PHOTO } from './akerImages';
import AkerNavPill from './AkerNavPill';
import AkerHeroBento from './AkerHeroBento';

const INTRO_COPY =
  'Punto Cero desarrolla comunidades donde la arquitectura, la inversión y el buen vivir se encuentran, en el corazón de Buenos Aires.';

export default function AkerHero() {
  const introRef = useRef<HTMLParagraphElement>(null);
  const wordmarkRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // start 'top bottom': el wordmark vive pegado al borde inferior del
    // viewport — con el start default ('top 80%') el trigger no dispara al
    // cargar y el hero queda sin wordmark hasta el primer scroll.
    const cleanups = [
      introRef.current && gsapReveal(introRef.current, { y: 16, start: 'top bottom' }),
      wordmarkRef.current &&
        gsapReveal(wordmarkRef.current, { y: 24, delay: 0.1, start: 'top bottom' }),
    ];
    return () => cleanups.forEach((c) => c && c());
  }, []);

  return (
    <section
      aria-label="Punto Cero Desarrollos"
      className="relative min-h-[100svh] w-full overflow-hidden bg-aker-ink sm:h-[100svh]"
    >
      {/* Sin overlay oscuro explícito (DESIGN-AKER.md § Full-Bleed Hero): el
          wordmark se apoya en la oscuridad propia de la foto; tratamiento
          muted consistente vía .aker-photo. */}
      <img
        src={AKER_HERO_PHOTO}
        alt=""
        aria-hidden
        fetchPriority="high"
        className="aker-photo absolute inset-0 h-full w-full object-cover"
      />

      <AkerNavPill />

      <div className="relative z-10 flex min-h-[100svh] flex-col justify-between px-4 pt-24 pb-10 sm:h-[100svh] sm:px-8 sm:pt-28 sm:pb-14">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          {/* Intro sans 15px Paper top-left (el único pasaje serif Lora del
              skin vive en AkerStatement, no acá — DESIGN-AKER.md § Lora). */}
          <p ref={introRef} className="text-aker-body max-w-[340px] font-normal text-aker-paper">
            {INTRO_COPY}
          </p>

          <AkerHeroBento />
        </div>

        {/* Wordmark a escala display: clamp(64px,13vw,168px), lh 0.8,
            ls -0.025em (= -4.2px @168), weight 300 — LA firma del sistema. */}
        <h1
          ref={wordmarkRef}
          className="mt-10 text-[clamp(64px,13vw,168px)] leading-[0.8] font-light tracking-[-0.025em] text-aker-paper sm:mt-0"
        >
          Punto Cero
        </h1>
      </div>
    </section>
  );
}
