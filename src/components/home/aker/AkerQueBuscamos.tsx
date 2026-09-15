// "Qué buscamos" — mapeado de "Investment Criteria / What we look for":
// canvas blanco, hairline superior, overline + heading enorme w300, grilla
// de 4 criterios (título + párrafo), hairline entre ítems.

import { useEffect, useRef } from 'react';
import { gsapReveal } from '../../../lib/gsapReveal';
import { AkerContainer, AkerHeading, AkerOverline } from './AkerPrimitives';

const CRITERIA = [
  {
    title: 'Ubicaciones con demanda sostenida',
    body: 'Zonas con restricciones geográficas, normativas o de oferta que sostienen el valor de largo plazo de cada desarrollo.',
  },
  {
    title: 'Zonas con crecimiento y polos de empleo',
    body: 'Áreas en expansión, con generación de empleo en tecnología, salud, educación e industria.',
  },
  {
    title: 'Conveniencia urbana',
    body: 'Cercanía a centros urbanos, transporte y servicios accesibles a pie o en pocos minutos.',
  },
  {
    title: 'Calidad de vida y espacios verdes',
    body: 'Entornos que favorecen un estilo de vida activo, con espacios verdes, recreación y equipamiento comunitario.',
  },
];

export default function AkerQueBuscamos() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(Array.from(ref.current.children), { stagger: 0.1, y: 20 });
  }, []);

  return (
    <section className="bg-aker-paper py-20">
      <AkerContainer>
        {/* Top rule 1px Mist bajo la que abre la sección (disciplina de
            hairlines del skin). */}
        <div className="border-t border-aker-mist pt-8 md:pt-10">
          <AkerOverline className="mb-3">Criterios de inversión</AkerOverline>
          <AkerHeading className="mb-12 md:mb-16">Qué buscamos</AkerHeading>
        </div>

        {/* Grilla 2x2 con hairline arriba de cada criterio + cierre. */}
        <div ref={ref} className="grid grid-cols-1 gap-x-10 border-b border-aker-mist md:grid-cols-2">
          {CRITERIA.map((c) => (
            <div key={c.title} className="border-t border-aker-mist py-6">
              <h3 className="text-aker-sub mb-2 font-normal text-aker-ink">{c.title}</h3>
              <p className="text-aker-body max-w-[600px] text-aker-pewter">{c.body}</p>
            </div>
          ))}
        </div>
      </AkerContainer>
    </section>
  );
}
