// Statement — el ÚNICO pasaje serif Lora del skin (DESIGN-AKER.md § Lora:
// "un solo párrafo serif junto al body sans crea el tono editorial"; nunca
// arriba de 18px, nunca en headings). Canvas blanco, 18px lh 1.5 ls 0.011em,
// max-width 600px estrictamente alineado a la izquierda + text-arrow ghost.
// Mismo id="quienes-somos" para que los anchors de Header/Footer globales
// sigan funcionando en ambos skins.

import { useEffect, useRef } from 'react';
import { gsapReveal } from '../../../lib/gsapReveal';
import { AkerContainer, AkerOverline, AkerTextArrow } from './AkerPrimitives';

export default function AkerStatement() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(Array.from(ref.current.children), { stagger: 0.1, y: 16 });
  }, []);

  return (
    <section id="quienes-somos" className="bg-aker-paper py-20">
      <AkerContainer>
        <div ref={ref}>
          <AkerOverline className="mb-4">Quiénes somos</AkerOverline>
          <p className="font-aker-serif max-w-[600px] text-[18px] leading-[1.5] font-normal tracking-[0.011em] text-aker-ink">
            Somos un equipo formado en operaciones, diseño, arquitectura, construcción y finanzas,
            con el interés común de desarrollar comunidades y crear espacios que eleven la calidad
            de vida en Buenos Aires.
          </p>
          <AkerTextArrow to="/#equipo" className="mt-8">
            Conocé al equipo
          </AkerTextArrow>
        </div>
      </AkerContainer>
    </section>
  );
}
