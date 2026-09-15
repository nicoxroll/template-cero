// Controles compartidos de los listados del panel: buscador, filtro por
// estado, badge/toggle de publicación y enlace "ver publicado".
// Viven juntos porque Proyectos, Inversiones y Leads los usan igual — cada
// listado difiere en las columnas, no en cómo se busca ni cómo se publica.

import { Eye, EyeOff, ExternalLink, Search, X } from 'lucide-react';

/* --------------------------------------------------------------- Buscador */

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Se anuncia a lectores de pantalla al filtrar. */
  resultLabel?: string;
}

export function SearchInput({ value, onChange, placeholder, resultLabel }: SearchInputProps) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-none border border-line bg-paper py-2 pl-9 pr-9 text-sm font-light text-ink placeholder:text-ink-soft/50 transition-colors focus:border-brand-500 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-soft transition-colors hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
      {resultLabel && (
        <span role="status" className="sr-only">
          {resultLabel}
        </span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Filtro */

interface FilterSelectProps<T extends string> {
  value: T | 'todos';
  onChange: (value: T | 'todos') => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  label: string;
  allLabel?: string;
}

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  allLabel = 'Todos',
}: FilterSelectProps<T>) {
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | 'todos')}
        aria-label={label}
        className="rounded-none border border-line bg-paper px-3 py-2 text-sm font-light text-ink transition-colors focus:border-brand-500 focus:outline-none"
      >
        <option value="todos">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------------------------------------ Publicación */

interface PublishToggleProps {
  published: boolean;
  /** Nombre del registro, para la etiqueta accesible. */
  name: string;
  busy?: boolean;
  onToggle: () => void;
}

/** Badge + acción en un solo control: el estado se lee y se cambia en el mismo
 * lugar, que es como el equipo lo usa (revisar la lista y publicar de a uno). */
export function PublishToggle({ published, name, busy = false, onToggle }: PublishToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      aria-pressed={published}
      aria-label={published ? `Despublicar ${name}` : `Publicar ${name}`}
      title={published ? 'Publicado — click para pasar a borrador' : 'Borrador — click para publicar'}
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50 ${
        published
          ? 'border-brand-900 bg-brand-900 text-white hover:bg-brand-700'
          : 'border-line bg-paper-soft text-ink-soft hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-300'
      }`}
    >
      {published ? (
        <Eye className="h-3 w-3" aria-hidden />
      ) : (
        <EyeOff className="h-3 w-3" aria-hidden />
      )}
      {published ? 'Publicado' : 'Borrador'}
    </button>
  );
}

/** Enlace al registro tal como se ve en el sitio público. Deshabilitado (no
 * oculto) mientras está en borrador: explica por qué no se puede mirar. */
export function ViewPublicLink({ to, published, name }: { to: string; published: boolean; name: string }) {
  if (!published) {
    return (
      <span
        title="En borrador: todavía no tiene página pública"
        className="inline-flex cursor-not-allowed rounded-sm p-2 text-ink-soft/30"
        aria-hidden
      >
        <ExternalLink className="h-4 w-4" />
      </span>
    );
  }
  return (
    <a
      href={to}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ver ${name} en el sitio`}
      title="Ver en el sitio"
      className="rounded-sm p-2 text-ink-soft transition-colors duration-300 hover:bg-paper-soft hover:text-brand-700 dark:hover:text-brand-300"
    >
      <ExternalLink className="h-4 w-4" aria-hidden />
    </a>
  );
}
