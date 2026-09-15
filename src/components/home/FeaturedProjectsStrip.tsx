// Proyectos destacados en la home, con el patrón de paneles expansivos de
// repo/mork § FeatureGrid: filas de dos paneles a sangre donde el que recibe el
// puntero pasa de flex-1 a flex-3 y empuja al hermano. La foto ocupa el panel
// entero y los datos suben desde abajo.
//
// Por qué esto y no la grilla de cards que había: una card de 4:3 con borde
// muestra la obra del tamaño de una estampilla. Acá cada proyecto ocupa media
// pantalla de alto y la fotografía —que es el activo de una desarrolladora—
// trabaja de verdad.
//
// El reveal de entrada NO deja los paneles en opacity-0 en el markup: si el
// tween de GSAP no llegara a correr quedarían invisibles con su espacio
// reservado, que es exactamente cómo esta sección apareció vacía una vez. GSAP
// pone el estado inicial y lo saca; si falla, se ven igual.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { PROJECT_STATUS_LABELS, projectRepo, type Project } from '../../data';
import { gsap } from '../../lib/gsapReveal';
import { prefersReducedMotion } from '../../lib/useReducedMotion';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Skeleton, useMinVisible, Photo } from '../ui/Skeleton';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../ui/InlineEditOverlay';

/** Una fila de paneles. El estado vive acá y no en cada panel para que el
 * hermano pueda encogerse cuando el otro se expande. */
function ExpandingRow({ projects }: { projects: Project[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="flex w-full flex-col overflow-hidden md:h-[72vh] md:flex-row">
      {projects.map((p, i) => (
        <Link
          key={p.slug}
          to={`/proyectos/${p.slug}`}
          onMouseEnter={() => setExpanded(i)}
          onMouseLeave={() => setExpanded(null)}
          onFocus={() => setExpanded(i)}
          onBlur={() => setExpanded(null)}
          aria-label={`Ver ${p.name}`}
          className={`group focus-ring relative min-h-[54vh] flex-1 overflow-hidden border-b border-white/10 transition-[flex-grow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] last:border-b-0 md:min-h-0 md:border-b-0 md:border-r md:last:border-r-0 ${
            expanded === i ? 'md:grow-[3]' : 'md:grow'
          }`}
        >
          <Photo
            src={p.coverImage}
            alt={p.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/45 transition-colors duration-700 group-hover:bg-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-7 text-white md:p-10 lg:p-12">
            <p className="mb-3 text-[0.65rem] font-medium uppercase tracking-[0.35em] text-brand-300">
              {PROJECT_STATUS_LABELS[p.status]}
            </p>
            <h3 className="text-2xl font-light uppercase leading-tight tracking-wide md:text-3xl lg:text-4xl">
              {p.name}
            </h3>
            <p className="mt-2 text-sm font-light text-white/75">{p.location}</p>

            <span className="mt-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white transition-all duration-500 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
              Ver proyecto
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      {[0, 1].map((r) => (
        <div key={r} className="flex flex-col gap-1 md:h-[72vh] md:flex-row">
          <Skeleton className="h-[54vh] flex-1 md:h-full" />
          <Skeleton className="h-[54vh] flex-1 md:h-full" />
        </div>
      ))}
    </div>
  );
}

export default function FeaturedProjectsStrip() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const loading = projects === null;
  const showSkeleton = useMinVisible(loading);
  const wrapRef = useRef<HTMLDivElement>(null);

  const {
    data: sectionData,
    update: updateSection,
    save: handleSave,
    cancel: handleCancel,
  } = useLiveSection({
    kicker: { key: 'featured.kicker', default: 'Proyectos' },
    title: { key: 'featured.title', default: 'Obras que nos representan' },
    intro: {
      key: 'featured.intro',
      default:
        'Una selección de nuestros desarrollos: obras entregadas, proyectos en ejecución y conceptos en diseño.',
    },
    ctaText: { key: 'featured.ctaText', default: 'Ver todos los proyectos' },
    sectionVisible: { key: 'featured.visible', default: 'true' },
  });

  const isVisible = sectionData.sectionVisible !== 'false';

  useEffect(() => {
    let alive = true;
    projectRepo
      .listFeatured()
      .then((list) => {
        if (alive) setProjects(list.slice(0, 4));
      })
      .catch(() => {
        if (alive) setProjects([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!projects || projects.length === 0 || !el) return;
    if (prefersReducedMotion()) return;

    const rows = Array.from(el.children);
    const tween = gsap.fromTo(
      rows,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [projects]);

  if (projects !== null && projects.length === 0) return null;

  const rows: Project[][] = [];
  for (let i = 0; i < (projects?.length ?? 0); i += 2) {
    rows.push(projects!.slice(i, i + 2));
  }

  return (
    <EditableSectionWrapper
      sectionId="home-featured"
      sectionLabel="Proyectos Destacados"
      onSave={handleSave}
      onCancel={handleCancel}
      pencilPosition="top-8 right-8"
    >
      {(isEditing) => {
        if (!isVisible && !isEditing) return null;
        return (
          <section className="bg-paper py-20 md:py-28 lg:py-32">
            <Container>
              {isEditing && (
                <div className="mb-8 p-4 bg-brand-500/10 border border-brand-500/30 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    {isVisible ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <Eye className="w-4 h-4" /> La sección está <strong>visible</strong> para los visitantes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                        <EyeOff className="w-4 h-4" /> La sección está <strong>oculta</strong> para los visitantes
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateSection('sectionVisible', isVisible ? 'false' : 'true')}
                      className={`px-3 py-1.5 font-medium tracking-wide uppercase transition-colors rounded ${
                        isVisible
                          ? 'bg-paper hover:bg-paper-soft text-ink border border-line'
                          : 'bg-brand-900 hover:bg-brand-700 text-white'
                      }`}
                    >
                      {isVisible ? 'Ocultar sección' : 'Hacer visible'}
                    </button>
                    <Link
                      to="/admin/proyectos"
                      className="inline-flex items-center gap-1.5 font-bold uppercase text-brand-600 hover:text-brand-700"
                    >
                      Ir a Proyectos <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              <div className="mb-12 md:mb-16">
                <EditableText
                  as="p"
                  value={sectionData.kicker}
                  isEditing={isEditing}
                  onChange={(val) => updateSection('kicker', val)}
                  className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-brand-500 md:text-sm"
                />
                <EditableText
                  as="h2"
                  value={sectionData.title}
                  isEditing={isEditing}
                  onChange={(val) => updateSection('title', val)}
                  className="text-3xl font-light tracking-wide text-ink sm:text-4xl md:text-5xl"
                />
                <EditableText
                  as="p"
                  value={sectionData.intro}
                  isEditing={isEditing}
                  multiline
                  onChange={(val) => updateSection('intro', val)}
                  className="mt-4 max-w-2xl text-base font-light leading-relaxed text-ink-soft md:text-lg"
                />
              </div>

              {isEditing && (
                <div className="mb-8 p-3 bg-paper-soft border border-line rounded flex items-center justify-between text-xs">
                  <span className="text-ink-soft">
                    Para destacar o quitar proyectos de esta grilla, editá el campo "Destacado" de cada proyecto.
                  </span>
                </div>
              )}
            </Container>

          {showSkeleton ? (
            <Container>
              <RowsSkeleton />
            </Container>
          ) : loading ? null : (
            <div ref={wrapRef} className="flex flex-col gap-1 bg-ink-fixed">
              {rows.map((row, i) => (
                <ExpandingRow key={i} projects={row} />
              ))}
            </div>
          )}

          <Container>
            <div className="mt-14 md:mt-16 flex items-center gap-4">
              {isEditing ? (
                <div className="inline-flex items-center gap-2 p-2 border border-brand-500/50 rounded bg-paper">
                  <span className="text-xs uppercase font-mono text-brand-500">Texto Botón:</span>
                  <EditableText
                    value={sectionData.ctaText}
                    isEditing={isEditing}
                    onChange={(val) => updateSection('ctaText', val)}
                    className="text-sm font-medium"
                  />
                </div>
              ) : (
                <Button variant="outline" to="/proyectos">
                  {sectionData.ctaText}
                </Button>
              )}
            </div>
          </Container>
        </section>
        );
      }}
    </EditableSectionWrapper>
  );
}
