// PROY-03: barra de filtros combinables (estado / ubicación / tipo),
// opciones derivadas de los datos del repo. Minimal premium.
//
// El bloque se puede plegar: con tres grupos de chips ocupa bastante alto y,
// una vez que el visitante eligió, lo único que quiere ver son los resultados.
//
// Arranca PLEGADO por decisión de producto. El comentario anterior decía lo
// contrario ("arranca abierto, si no nadie descubre que se puede filtrar") y
// quedó desactualizado cuando se cambió el default — o sea que describía un
// comportamiento que el archivo ya no tenía.
//
// La objeción del comentario viejo sigue siendo real: plegado, hay que confiar
// en que el control "Filtros" se note. Por eso al plegarse deja a la vista
// cuántos filtros hay activos, para que nunca haya resultados recortados sin
// explicación. Si alguna vez se mide que la gente no encuentra los filtros, el
// lugar para cambiarlo es este `useState`, no el comentario.

import { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  type ProjectStatus,
  type ProjectType,
} from '../../data';

export interface ProjectFilterState {
  status: ProjectStatus | null;
  location: string | null;
  type: ProjectType | null;
}

export const EMPTY_FILTERS: ProjectFilterState = {
  status: null,
  location: null,
  type: null,
};

interface ProjectFiltersProps {
  filters: ProjectFilterState;
  onChange: (filters: ProjectFilterState) => void;
  /** Opciones presentes en los datos (derivadas del repo) */
  statuses: ProjectStatus[];
  locations: string[];
  types: ProjectType[];
}

function FilterGroup<T extends string>({
  label,
  options,
  labels,
  value,
  onSelect,
}: {
  label: string;
  options: T[];
  labels: (option: T) => string;
  value: T | null;
  onSelect: (option: T | null) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-ink-soft">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={value === null}
          onClick={() => onSelect(null)}
          className={`border px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors duration-300 ${
            value === null
              ? 'border-brand-900 bg-brand-900 text-white'
              : 'border-line bg-paper text-ink-soft hover:border-brand-500 hover:text-ink'
          }`}
        >
          Todos
        </button>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onSelect(value === option ? null : option)}
            className={`border px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors duration-300 ${
              value === option
                ? 'border-brand-900 bg-brand-900 text-white'
                : 'border-line bg-paper text-ink-soft hover:border-brand-500 hover:text-ink'
            }`}
          >
            {labels(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProjectFilters({
  filters,
  onChange,
  statuses,
  locations,
  types,
}: ProjectFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    (filters.status !== null ? 1 : 0) +
    (filters.location !== null ? 1 : 0) +
    (filters.type !== null ? 1 : 0);
  const hasActive = activeCount > 0;

  return (
    <div className="border-y border-hairline">
      <div className="flex flex-wrap items-center justify-between gap-4 py-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="project-filters-panel"
          className="group inline-flex items-center gap-2.5 text-xs font-medium uppercase tracking-widest text-ink transition-colors duration-300 hover:text-brand-700 dark:hover:text-brand-300"
        >
          <SlidersHorizontal className="h-4 w-4 text-brand-500" strokeWidth={1.5} aria-hidden />
          Filtros
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-900 px-1.5 text-[10px] tabular-nums text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-ink-soft transition-transform duration-300 ${
              open ? 'rotate-180' : ''
            }`}
            strokeWidth={1.5}
            aria-hidden
          />
          <span className="sr-only">{open ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
        </button>

        {/* Con el panel plegado, limpiar sigue a un click: si no, un filtro
            activo y oculto deja resultados recortados sin salida visible. */}
        {hasActive && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs font-medium uppercase tracking-widest text-brand-500 transition-colors duration-300 hover:text-brand-900 dark:hover:text-brand-100"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Sin `hidden`: ese atributo es display:none y no se puede interpolar.
          La animación corre sobre la fila del grid (0fr → 1fr), que es la única
          forma de llegar al alto REAL del contenido sin medirlo en JS — con un
          max-height fijo hay que elegir entre cortar el panel cuando hay muchas
          ubicaciones o dejar un retardo muerto al cerrar.
          `invisible` saca el panel cerrado del foco de teclado sin romper la
          transición (display:none la mataría). */}
      <div
        id="project-filters-panel"
        aria-hidden={!open}
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'grid-rows-[1fr] pb-8 opacity-100' : 'grid-rows-[0fr] pb-0 opacity-0'
        }`}
      >
        <div className={`overflow-hidden ${open ? '' : 'invisible'}`}>
          <div className="grid gap-8 lg:grid-cols-3">
          <FilterGroup
            label="Estado"
            options={statuses}
            labels={(s) => PROJECT_STATUS_LABELS[s]}
            value={filters.status}
            onSelect={(status) => onChange({ ...filters, status })}
          />
          <FilterGroup
            label="Ubicación"
            options={locations}
            labels={(l) => l}
            value={filters.location}
            onSelect={(location) => onChange({ ...filters, location })}
          />
            <FilterGroup
              label="Tipo"
              options={types}
              labels={(t) => PROJECT_TYPE_LABELS[t]}
              value={filters.type}
              onSelect={(type) => onChange({ ...filters, type })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
