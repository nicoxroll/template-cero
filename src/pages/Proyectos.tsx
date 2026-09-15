// Sección Proyectos (PROY-01..03): hero + listado filtrable con mapa, desde
// projectRepo y con skeletons shape-matched.

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { List, Map as MapIcon, ExternalLink } from 'lucide-react';
import { usePageMeta } from '../lib/usePageMeta';
import { projectRepo, type Project, type ProjectStatus, type ProjectType } from '../data';
import Container from '../components/ui/Container';
import { Skeleton, useMinVisible } from '../components/ui/Skeleton';
import ProyectosHero from '../components/proyectos/ProyectosHero';
import ProjectFilters, {
  EMPTY_FILTERS,
  type ProjectFilterState,
} from '../components/proyectos/ProjectFilters';
import ProjectGrid from '../components/proyectos/ProjectGrid';
import ProjectListSkeleton from '../components/proyectos/ProjectListSkeleton';
import { useLiveSection } from '../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../components/ui/InlineEditOverlay';

// Leaflet pesa ~45 kB gzip: se pide recién cuando el mapa entra en juego, no
// con el bundle de la página (mismo criterio que el mapa de Contacto).
const ProyectosMapa = lazy(() => import('../components/proyectos/ProyectosMapa'));

type Vista = 'grilla' | 'mapa';

export default function Proyectos() {
  usePageMeta({
    title: 'Proyectos',
    description:
      'Nuestros desarrollos inmobiliarios: obras entregadas, proyectos en ejecución y conceptos en diseño. Filtre por estado, ubicación y tipo, o explórelos en el mapa.',
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProjectFilterState>(EMPTY_FILTERS);
  const [vista, setVista] = useState<Vista>('grilla');
  const showSkeleton = useMinVisible(loading);

  useEffect(() => {
    let cancelled = false;
    projectRepo
      .listPublished()
      .then((data) => {
        if (cancelled) return;
        setProjects(data);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Opciones de filtro derivadas de los datos reales del repo (PROY-03).
  const { statuses, locations, types } = useMemo(() => {
    const statusSet = new Set<ProjectStatus>();
    const locationSet = new Set<string>();
    const typeSet = new Set<ProjectType>();
    for (const p of projects) {
      statusSet.add(p.status);
      locationSet.add(p.location);
      typeSet.add(p.type);
    }
    return {
      statuses: [...statusSet],
      locations: [...locationSet].sort((a, b) => a.localeCompare(b, 'es')),
      types: [...typeSet],
    };
  }, [projects]);

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (filters.status === null || p.status === filters.status) &&
          (filters.location === null || p.location === filters.location) &&
          (filters.type === null || p.type === filters.type),
      ),
    [projects, filters],
  );

  const hasActiveFilters =
    filters.status !== null || filters.location !== null || filters.type !== null;

  const {
    data: sectionData,
    update: updateSection,
    save: handleSave,
    cancel: handleCancel,
  } = useLiveSection({
    kicker: { key: 'proyectos.catalog.kicker', default: 'Portfolio' },
    title: { key: 'proyectos.catalog.title', default: 'Proyectos y obras' },
    intro: {
      key: 'proyectos.catalog.intro',
      default: 'Filtre por estado, ubicación o tipo, o véalos ubicados en el mapa.',
    },
  });

  return (
    <main>
      <ProyectosHero projects={projects} />

      <EditableSectionWrapper
        sectionId="proyectos-catalog"
        sectionLabel="Catálogo de Proyectos"
        onSave={handleSave}
        onCancel={handleCancel}
        pencilPosition="top-8 right-8"
      >
        {(isEditing) => (
          <section className="bg-paper py-20 md:py-28 lg:py-32">
            <Container>
              <div className="mb-12 md:mb-16">
                <EditableText
                  as="p"
                  value={sectionData.kicker}
                  isEditing={isEditing}
                  onChange={(val) => updateSection('kicker', val)}
                  className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-brand-500 md:text-sm block"
                />
                <EditableText
                  as="h2"
                  value={sectionData.title}
                  isEditing={isEditing}
                  onChange={(val) => updateSection('title', val)}
                  className="text-3xl font-light tracking-wide text-ink sm:text-4xl md:text-5xl block"
                />
                <EditableText
                  as="p"
                  value={sectionData.intro}
                  isEditing={isEditing}
                  multiline
                  onChange={(val) => updateSection('intro', val)}
                  className="mt-4 max-w-2xl text-base font-light leading-relaxed text-ink-soft md:text-lg block"
                />
              </div>

              {isEditing && (
                <div className="mb-8 p-4 bg-brand-500/10 border border-brand-500/30 rounded flex items-center justify-between text-xs">
                  <span className="text-ink-soft">
                    Para crear nuevos proyectos, cargar renders o actualizar estados de obras:
                  </span>
                  <Link
                    to="/admin/proyectos"
                    className="inline-flex items-center gap-1.5 font-bold uppercase text-brand-600 hover:text-brand-700"
                  >
                    Administrador de Proyectos <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

          {showSkeleton ? (
            <ProjectListSkeleton />
          ) : loading ? null : projects.length === 0 ? (
            // Sin proyectos publicados no se muestran filtros ni conmutador de
            // vista: filtrar la nada, y un "0 proyectos" coronando el vacío,
            // se leen como sitio roto en vez de como sección todavía sin cargar.
            <ProjectGrid projects={[]} hasActiveFilters={false} onClearFilters={() => {}} />
          ) : (
            <>
              <ProjectFilters
                filters={filters}
                onChange={setFilters}
                statuses={statuses}
                locations={locations}
                types={types}
              />

              {/* Grilla y mapa muestran SIEMPRE la misma selección filtrada:
                  son dos lecturas del mismo resultado, no dos búsquedas. */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-medium uppercase tracking-widest text-ink-soft">
                  {filtered.length}{' '}
                  {filtered.length === 1 ? 'proyecto' : 'proyectos'}
                  {hasActiveFilters && ` de ${projects.length}`}
                </p>

                <div
                  role="group"
                  aria-label="Vista de proyectos"
                  className="inline-flex items-center gap-0.5 border border-line p-0.5"
                >
                  {(
                    [
                      { key: 'grilla', label: 'Grilla', Icon: List },
                      { key: 'mapa', label: 'Mapa', Icon: MapIcon },
                    ] as const
                  ).map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={vista === key}
                      onClick={() => setVista(key)}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors duration-300 ${
                        vista === key
                          ? 'bg-brand-900 text-white'
                          : 'text-ink-soft hover:text-ink'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* El chunk de Leaflet se pide al montar <ProyectosMapa>, o sea
                  recién cuando el visitante elige la vista de mapa: quien se
                  queda en la grilla nunca lo descarga. */}
              <div className="mt-8 md:mt-10">
                {vista === 'grilla' ? (
                  <ProjectGrid
                    projects={filtered}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={() => setFilters(EMPTY_FILTERS)}
                  />
                ) : (
                  <Suspense fallback={<Skeleton className="h-[360px] w-full md:h-[460px]" />}>
                    <ProyectosMapa projects={filtered} />
                  </Suspense>
                )}
              </div>
            </>
          )}
              </Container>
          </section>
        )}
      </EditableSectionWrapper>
    </main>
  );
}
