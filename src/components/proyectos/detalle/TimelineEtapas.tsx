// Timeline de etapas del proyecto (PROY-05): planificación → diseño →
// construcción → entrega, con etapas completadas, la actual resaltada
// (acento verde con pulso) y fechas reales. Reveal GSAP por etapa.

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { gsapReveal } from '../../../lib/gsapReveal';
import Container from '../../ui/Container';
import SectionHeading from '../../ui/SectionHeading';
import { PROJECT_STAGE_LABELS, type ProjectStage } from '../../../data';

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const s = d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function stageDates(stage: ProjectStage): string | null {
  const start = formatDate(stage.startedAt);
  const end = formatDate(stage.completedAt);
  if (start && end) return `${start} — ${end}`;
  if (start) return `Desde ${start.toLowerCase()}`;
  return null;
}

export default function TimelineEtapas({ timeline }: { timeline: ProjectStage[] }) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    return gsapReveal(Array.from(listRef.current.children), { stagger: 0.15 });
  }, []);

  if (timeline.length === 0) return null;

  const currentIndex = timeline.findIndex((s) => s.current);

  return (
    <section className="bg-paper-soft py-20 md:py-28 lg:py-32">
      <Container>
        <SectionHeading
          kicker="Etapas"
          title="Avance del proyecto"
          intro="Cada desarrollo atraviesa un proceso integral: de la planificación estratégica a la entrega final."
          className="mb-12 md:mb-16"
        />

        <ol ref={listRef} className="relative">
          {timeline.map((stage, i) => {
            const completed = currentIndex === -1 ? false : i < currentIndex;
            const isCurrent = stage.current;
            const isLast = i === timeline.length - 1;
            const dates = stageDates(stage);

            return (
              <li key={stage.stage} className="relative flex gap-6 md:gap-10">
                {/* Columna de nodo + línea */}
                <div className="flex flex-col items-center">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                    {isCurrent && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500/40 motion-reduce:animate-none" />
                    )}
                    <span
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                        isCurrent
                          ? 'border-brand-500 bg-brand-500 text-white dark:border-brand-700 dark:bg-brand-700'
                          : completed
                            ? // brand-900 es casi negro: sobre el fondo oscuro
                              // el nodo completado desaparecía y el pendiente
                              // (bg-paper) era el que brillaba — la semántica
                              // del timeline quedaba dada vuelta.
                              'border-brand-900 bg-brand-900 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-brand-900'
                            : 'border-hairline bg-paper text-ink-soft'
                      }`}
                    >
                      {completed ? (
                        <Check className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <span className="text-xs font-medium">{i + 1}</span>
                      )}
                    </span>
                  </span>
                  {!isLast && (
                    <span
                      className={`w-px flex-1 ${
                        completed ? 'bg-brand-900 dark:bg-brand-500' : 'bg-hairline'
                      }`}
                    />
                  )}
                </div>

                {/* Contenido de la etapa */}
                <div className={isLast ? 'pb-2' : 'pb-12 md:pb-16'}>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3
                      className={`text-xl font-light tracking-wide md:text-2xl ${
                        isCurrent
                          ? 'text-brand-700 dark:text-brand-300'
                          : completed
                            ? 'text-ink'
                            : 'text-ink-soft'
                      }`}
                    >
                      {PROJECT_STAGE_LABELS[stage.stage]}
                    </h3>
                    {isCurrent && (
                      <span className="bg-brand-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-brand-700">
                        Etapa actual
                      </span>
                    )}
                    {completed && (
                      <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft">
                        Completada
                      </span>
                    )}
                  </div>
                  {dates && (
                    <p className="mt-2 text-xs font-medium uppercase tracking-widest text-ink-soft">
                      {dates}
                    </p>
                  )}
                  {stage.notes && (
                    <p className="mt-3 max-w-xl text-base font-light leading-relaxed text-ink-soft">
                      {stage.notes}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
