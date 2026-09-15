// Toggle de tema claro/oscuro (sol/luna, lucide) — Header público y AdminShell.
// Micro-interacción: cross-fade + rotación sutil entre íconos, sin GSAP
// (hover/estado ya lo cubre CSS, según convención de animación de DESIGN.md).

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getThemeSnapshot, setTheme, subscribeToTheme, type Theme } from '../../lib/theme';

interface ThemeToggleProps {
  className?: string;
  /** true cuando el control se apoya sobre un fondo oscuro fijo (header
   * transparente sobre el hero, sidebar admin) — independiente del tema. */
  dark?: boolean;
}

export default function ThemeToggle({ className = '', dark = false }: ThemeToggleProps) {
  // El tema es estado EXTERNO a React (lo aplica el script anti-flash de
  // index.html antes del primer paint). useSyncExternalStore lo lee desde el
  // DOM sin pisar ese valor inicial y mantiene sincronizados los toggles de
  // los dos árboles —Header público y AdminShell— sin estado compartido.
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    // setTheme aplica al DOM y emite el evento: el store re-renderiza solo.
    setTheme(next);
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={isDark}
      className={`focus-ring relative flex h-9 w-9 shrink-0 items-center justify-center transition-colors duration-300 ${
        dark
          ? 'text-white/80 hover:text-white'
          : 'text-ink-soft hover:text-ink dark:text-white/70 dark:hover:text-white'
      } ${className}`}
    >
      <Sun
        aria-hidden
        strokeWidth={1.5}
        className={`absolute h-[18px] w-[18px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
      <Moon
        aria-hidden
        strokeWidth={1.5}
        className={`absolute h-[18px] w-[18px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </button>
  );
}
