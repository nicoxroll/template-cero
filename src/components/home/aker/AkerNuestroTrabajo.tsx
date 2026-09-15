// "Nuestro trabajo" — mapeado de "Our work" 1.1/1.2/1.3 de Aker: card con
// arte lineal abstracto (sin fotografía — así lo resuelve el original) +
// número/flecha + título + tag chips + párrafo. Las 3 superficies de color
// usan SOLO tonos de marca (brand-900/ink/brand-700) — sin terracota.

import { useEffect, useRef } from 'react';
import { gsapReveal } from '../../../lib/gsapReveal';
import { AkerContainer, AkerHeading, AkerOverline, AkerTagChip } from './AkerPrimitives';

interface WorkArea {
  n: string;
  title: string;
  tags: string[];
  body: string;
  surface: string;
  art: 'blocks' | 'bars' | 'rings';
}

const AREAS: WorkArea[] = [
  {
    n: '1.1',
    title: 'El Proyecto',
    tags: ['Identidad', 'Planificación', 'Reposicionamiento'],
    body: 'Repensamos proyectos residenciales a partir de la demanda real y una programación arquitectónica cuidada.',
    surface: 'bg-brand-900',
    art: 'blocks',
  },
  {
    n: '1.2',
    title: 'La Obra',
    tags: ['Desarrollo', 'Construcción', 'Renovaciones'],
    body: 'Aprovechamos oportunidades para desarrollar nuevos espacios o poner en valor los existentes.',
    surface: 'bg-aker-ink',
    art: 'bars',
  },
  {
    n: '1.3',
    title: 'La Comunidad',
    tags: ['Comercios locales', 'Marketing', 'Desarrollo comunitario'],
    body: 'Conectamos personas con comercios locales para fortalecer comunidades activas.',
    surface: 'bg-brand-700',
    art: 'rings',
  },
];

/** Arte lineal decorativo — geometría abstracta trazo fino, sin fotografía. */
function WorkArt({ variant }: { variant: WorkArea['art'] }) {
  if (variant === 'blocks') {
    return (
      <svg viewBox="0 0 120 90" className="h-16 w-20" aria-hidden>
        <rect x="10" y="12" width="26" height="26" stroke="currentColor" strokeOpacity="0.5" fill="none" strokeDasharray="2 2" />
        <rect x="40" y="12" width="42" height="26" stroke="currentColor" strokeOpacity="0.5" fill="none" />
        <rect x="10" y="42" width="46" height="34" stroke="currentColor" strokeOpacity="0.5" fill="none" />
        <rect x="60" y="42" width="10" height="34" stroke="currentColor" strokeOpacity="0.5" fill="none" />
      </svg>
    );
  }
  if (variant === 'bars') {
    return (
      <svg viewBox="0 0 120 90" className="h-16 w-20" aria-hidden>
        <rect x="14" y="18" width="14" height="54" stroke="currentColor" strokeOpacity="0.5" fill="none" />
        <rect x="34" y="30" width="14" height="42" stroke="currentColor" strokeOpacity="0.5" fill="none" />
        <rect x="54" y="10" width="14" height="62" stroke="currentColor" strokeOpacity="0.5" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 90" className="h-16 w-20" aria-hidden>
      <circle cx="60" cy="45" r="26" stroke="currentColor" strokeOpacity="0.5" fill="none" />
      <circle cx="60" cy="45" r="12" stroke="currentColor" strokeOpacity="0.5" fill="none" strokeDasharray="2 2" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 60 + 26 * Math.cos(rad);
        const cy = 45 + 26 * Math.sin(rad);
        return <circle key={deg} cx={cx} cy={cy} r="3" stroke="currentColor" strokeOpacity="0.6" fill="none" />;
      })}
    </svg>
  );
}

function WorkCard({ area, size = 'lg' }: { area: WorkArea; size?: 'lg' | 'sm' }) {
  return (
    <div>
      <div
        className={`flex items-center justify-center rounded-aker-card text-aker-paper ${area.surface} ${
          size === 'lg' ? 'h-64 md:h-80' : 'h-56'
        }`}
      >
        <WorkArt variant={area.art} />
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <span className="flex items-center gap-2.5">
          <span className="flex h-6 w-9 items-center justify-center rounded-aker-pill bg-aker-char text-[12px] font-medium text-aker-paper">
            {area.n}
          </span>
          {/* heading-sm de la escala: 22px, lh 1.25, ls -0.44px. */}
          <span className={`font-normal text-aker-ink ${size === 'lg' ? 'text-aker-h' : 'text-aker-hsm'}`}>
            {area.title}
          </span>
        </span>
        <span className="flex flex-wrap gap-2 sm:justify-end">
          {area.tags.map((t) => (
            <AkerTagChip key={t}>{t}</AkerTagChip>
          ))}
        </span>
      </div>
      <p className="text-aker-body mt-3 max-w-[600px] text-aker-pewter">{area.body}</p>
    </div>
  );
}

export default function AkerNuestroTrabajo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(Array.from(ref.current.children), { stagger: 0.12, y: 24 });
  }, []);

  return (
    <section className="bg-aker-paper py-20">
      <AkerContainer>
        <div className="mb-12 md:mb-16">
          <AkerOverline className="mb-3">Tres áreas centrales</AkerOverline>
          <AkerHeading>Nuestro trabajo</AkerHeading>
        </div>

        <div ref={ref} className="flex flex-col gap-14 md:gap-16">
          <WorkCard area={AREAS[0]} size="lg" />
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:gap-8">
            <WorkCard area={AREAS[1]} size="sm" />
            <WorkCard area={AREAS[2]} size="sm" />
          </div>
        </div>
      </AkerContainer>
    </section>
  );
}
