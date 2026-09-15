// Toggle del HERO de la portada (video | imagen) — Header público, solo en la
// home. Vive al lado de ThemeToggle pero es un eje independiente (hero != tema):
// lo único que cambia es si el hero es el vuelo de cámara scrubeado por scroll
// o una foto fija; el resto de la home es idéntico en ambos modos
// (ver src/pages/Home.tsx y src/lib/skin.ts).

import { Image, Video } from 'lucide-react';
import { useSkin } from '../../lib/SkinContext';
import type { Mode } from '../../lib/skin';

interface SkinToggleProps {
  className?: string;
  /** true cuando el control se apoya sobre un fondo oscuro fijo (header
   * transparente sobre el hero) — igual que ThemeToggle: garantiza
   * legibilidad sobre el video, que tiene cuadros muy claros. */
  dark?: boolean;
  /** true en mobile: mismo tratamiento solo-ícono que ThemeToggle (h-9 w-9),
   * para que el toggle no pise el logo a 375px — el hamburguesa manda ahí. */
  iconOnly?: boolean;
}

// Imagen primero: es el default de toda visita nueva. El valor interno del
// otro modo sigue siendo 'video' (es lo que describe técnicamente) pero se
// muestra como "Tour", que es como la empresa y los visitantes lo llaman.
const OPTIONS: ReadonlyArray<{ mode: Mode; label: string }> = [
  { mode: 'imagen', label: 'Imagen' },
  { mode: 'video', label: 'Tour' },
];

export default function SkinToggle({ className = '', dark = false, iconOnly = false }: SkinToggleProps) {
  const { mode, isVideo, setMode, toggleMode } = useSkin();

  if (iconOnly) {
    const label = isVideo ? 'Ver el hero con imagen fija' : 'Ver el tour en video';
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isVideo}
        aria-label={label}
        title={label}
        onClick={toggleMode}
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
          dark ? 'text-white/80 hover:text-white' : 'text-ink-soft hover:text-ink dark:text-white/70 dark:hover:text-white'
        } ${isVideo ? (dark ? 'text-white' : 'text-brand-500 dark:text-brand-300') : ''} ${className}`}
      >
        {isVideo ? (
          <Video aria-hidden strokeWidth={1.5} className="h-[18px] w-[18px]" />
        ) : (
          <Image aria-hidden strokeWidth={1.5} className="h-[18px] w-[18px]" />
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Modo del hero"
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border p-0.5 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors duration-300 ${
        dark ? 'border-white/30' : 'border-line dark:border-white/15'
      } ${className}`}
    >
      {OPTIONS.map((option) => {
        const active = option.mode === mode;
        return (
          <button
            key={option.mode}
            type="button"
            aria-pressed={active}
            aria-label={
              option.mode === 'video' ? 'Ver el tour en video' : 'Ver el hero con imagen fija'
            }
            onClick={() => setMode(option.mode)}
            className={`rounded-full border px-3 py-1.5 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
              active
                ? dark
                  ? 'border-white text-white'
                  : 'border-brand-500 text-brand-700 dark:text-brand-300'
                : dark
                  ? 'border-transparent text-white/60 hover:text-white'
                  : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
