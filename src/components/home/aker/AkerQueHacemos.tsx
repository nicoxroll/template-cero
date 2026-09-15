// "Qué hacemos" — Core Business Areas (DESIGN-AKER.md, mapeado de "What we
// do" 01 Invest/02 Create/03 Operate de Aker): overline + heading, 3 ítems
// numerados grandes con hairline entre cada uno. id="servicios" para que los
// anchors del Header/Footer globales sigan funcionando en el skin Aker.

import { useEffect, useRef } from 'react';
import { gsapReveal } from '../../../lib/gsapReveal';
import { AkerContainer, AkerHeading, AkerOverline } from './AkerPrimitives';

const AREAS = [
  {
    n: '01',
    title: 'Desarrollar',
    body: 'Somos una plataforma integrada que desarrolla proyectos residenciales, comerciales y de infraestructura en todo el Gran Buenos Aires. Empoderamos equipos de alto desempeño para entregar valor duradero a clientes e inversores.',
  },
  {
    n: '02',
    title: 'Construir',
    body: 'Ejecutamos cada obra con equipos propios y contratistas calificados, dirección técnica rigurosa y control de calidad en cada etapa, desde el movimiento de suelos hasta la entrega de unidades.',
  },
  {
    n: '03',
    title: 'Financiar',
    body: 'Estructuramos fideicomisos al costo y oportunidades de inversión con información transparente, acompañando a cada inversor durante todo el ciclo del proyecto.',
  },
];

export default function AkerQueHacemos() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(Array.from(ref.current.children), { stagger: 0.1, y: 20 });
  }, []);

  return (
    <section id="servicios" className="bg-aker-paper py-20">
      <AkerContainer>
        <div className="mb-12 md:mb-16">
          <AkerOverline className="mb-3">Áreas de negocio</AkerOverline>
          <AkerHeading>Qué hacemos</AkerHeading>
        </div>

        {/* Numbered List Item exacto (DESIGN-AKER.md): "01" 12px Smoke +
            label 18px w400 Ink + body 15px, hairline Mist arriba de cada
            ítem, 24px de padding vertical generoso. */}
        <div ref={ref}>
          {AREAS.map((area) => (
            <div
              key={area.n}
              className="grid grid-cols-1 gap-4 border-t border-aker-mist py-6 last:border-b sm:grid-cols-[100px_1fr] md:grid-cols-[140px_1fr] md:gap-10"
            >
              <span className="text-[12px] font-normal text-aker-smoke tabular-nums">{area.n}</span>
              <div>
                <h3 className="text-aker-sub mb-3 font-normal text-aker-ink">{area.title}</h3>
                <p className="text-aker-body max-w-[600px] text-aker-pewter">{area.body}</p>
              </div>
            </div>
          ))}
        </div>
      </AkerContainer>
    </section>
  );
}
