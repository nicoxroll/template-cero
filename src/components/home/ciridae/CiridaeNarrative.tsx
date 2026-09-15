// Narrativa oscura (DESIGN-CIRIDAE.md § Section Heading Block): qué hace la
// empresa. Único lugar (junto a las descripciones de card) donde el mixed
// case está permitido — familia de body (font-cir-body), no condensada.

import { useEffect, useRef } from 'react';
import { SectionHeading } from './CiridaePrimitives';
import { gsapReveal } from '../../../lib/gsapReveal';

export default function CiridaeNarrative() {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(ref.current);
  }, []);

  return (
    <section id="quienes-somos" className="bg-cir-void py-10 sm:py-[60px]">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <SectionHeading eyebrow="Quiénes somos" title="Del terreno a la entrega" />
        <p
          ref={ref}
          className="mx-auto max-w-3xl text-center font-cir-body text-[16px] leading-relaxed text-cir-white/70 sm:text-[18px]"
        >
          Somos una desarrolladora inmobiliaria integral: originamos, diseñamos, construimos y
          financiamos proyectos de principio a fin. Transformamos ideas en proyectos de valor,
          acompañando cada etapa con planificación estratégica, innovación y compromiso
          profesional — para clientes que desarrollan o compran, y para inversores que buscan
          retorno con información transparente.
        </p>
      </div>
    </section>
  );
}
