// PROY-02/03: grilla de proyectos con reveal escalonado en la primera carga
// y estado vacío claro cuando los filtros no devuelven resultados.

import { useEffect, useRef } from 'react';
import { SearchX } from 'lucide-react';
import { gsapReveal } from '../../lib/gsapReveal';
import type { Project } from '../../data';
import ProjectCard from './ProjectCard';

interface ProjectGridProps {
  projects: Project[];
  /** Hay filtros activos: distingue "sin resultados" de "sin proyectos publicados" */
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function ProjectGrid({
  projects,
  hasActiveFilters,
  onClearFilters,
}: ProjectGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);

  useEffect(() => {
    // Reveal solo en la primera carga; al filtrar, el cambio es inmediato.
    if (revealed.current || !gridRef.current || projects.length === 0) return;
    revealed.current = true;
    const items = Array.from(gridRef.current.children) as HTMLElement[];
    return gsapReveal(items, { stagger: 0.12 });
  }, [projects]);

  if (projects.length === 0) {
    return (
      <div className="border border-line px-8 py-20 text-center md:py-28">
        <SearchX
          aria-hidden
          className="mx-auto h-10 w-10 text-brand-300"
          strokeWidth={1.25}
        />
        <h3 className="mt-6 text-xl font-light tracking-wide text-ink md:text-2xl">
          {hasActiveFilters
            ? 'No hay proyectos con esos criterios'
            : 'Todavía no hay proyectos publicados'}
        </h3>
        <p className="mx-auto mt-4 max-w-md text-base font-light leading-relaxed text-ink-soft">
          {hasActiveFilters
            ? 'Pruebe con otra combinación de estado, ubicación o tipo, o vea el listado completo.'
            : 'Estamos preparando la publicación de nuestros desarrollos. Vuelva a visitarnos pronto.'}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-8 border border-ink px-8 py-3.5 text-sm font-medium uppercase tracking-widest text-ink transition-all duration-300 hover:bg-ink hover:text-paper"
          >
            Ver todos los proyectos
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={gridRef} className="grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </div>
  );
}
