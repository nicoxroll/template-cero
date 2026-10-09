// Tema claro/oscuro (DESIGN.md dark mode) y Presets de paleta de color (emerald | indigo | slate | amber)
// Precedencia: localStorage > siteConfig > prefers-color-scheme del SO.
// El anti-flash inicial vive en index.html (script inline, corre antes del primer paint).

import { useSyncExternalStore } from 'react';
import { siteConfig } from '../config/site';

const STORAGE_KEY = 'tc-theme';
const PRESET_STORAGE_KEY = 'tc-theme-preset';

export type Theme = 'light' | 'dark';
export type ThemePreset = 'emerald' | 'indigo' | 'slate' | 'amber';

export interface ThemePresetOption {
  id: ThemePreset;
  name: string;
  color: string;
  accentHex: string;
  desc: string;
}

export const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'emerald',
    name: 'Esmeralda',
    color: 'bg-emerald-600',
    accentHex: '#3e7a5a',
    desc: 'Verde arquitectónico, sustentabilidad y armonía natural',
  },
  {
    id: 'indigo',
    name: 'Índigo',
    color: 'bg-indigo-600',
    accentHex: '#4f46e5',
    desc: 'Azul moderno de alta tecnología y negocios contemporáneos',
  },
  {
    id: 'slate',
    name: 'Pizarra',
    color: 'bg-slate-700',
    accentHex: '#334155',
    desc: 'Monocromático de lujo, sobriedad y diseño editorial puro',
  },
  {
    id: 'amber',
    name: 'Ámbar',
    color: 'bg-amber-600',
    accentHex: '#d97706',
    desc: 'Cálido estudio creativo, madera noble y distinción',
  },
];

const THEME_COLOR: Record<Theme, string> = {
  light: '#10281d',
  dark: '#0b0f0d',
};

/* ------------------------------------------------------------- Presets de Marca */

export function getStoredThemePreset(): ThemePreset {
  if (typeof window === 'undefined') return siteConfig.theme?.preset ?? 'emerald';
  try {
    const value = localStorage.getItem(PRESET_STORAGE_KEY) as ThemePreset | null;
    if (value && ['emerald', 'indigo', 'slate', 'amber'].includes(value)) {
      return value;
    }
  } catch {
    // localStorage no accesible
    void 0;
  }
  return siteConfig.theme?.preset ?? 'emerald';
}

export function applyThemePreset(preset: ThemePreset): void {
  if (typeof document === 'undefined') return;
  if (preset && preset !== 'emerald') {
    document.documentElement.setAttribute('data-theme-preset', preset);
  } else {
    document.documentElement.removeAttribute('data-theme-preset');
  }
}

// Inicialización inmediata al importar
if (typeof document !== 'undefined') {
  applyThemePreset(getStoredThemePreset());
}

const PRESET_CHANGE_EVENT = 'tc:preset-change';

export function setThemePreset(preset: ThemePreset): void {
  try {
    localStorage.setItem(PRESET_STORAGE_KEY, preset);
  } catch (err) {
    console.error('Error al guardar preset de tema', err);
  }
  applyThemePreset(preset);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PRESET_CHANGE_EVENT, { detail: preset }));
  }
}

export function subscribeToThemePreset(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(PRESET_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(PRESET_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function getThemePresetSnapshot(): ThemePreset {
  if (typeof document === 'undefined') return 'emerald';
  const attr = document.documentElement.getAttribute('data-theme-preset');
  return (attr as ThemePreset) || 'emerald';
}

export function useThemePreset(): {
  preset: ThemePreset;
  setPreset: (preset: ThemePreset) => void;
  presets: ThemePresetOption[];
} {
  const current = useSyncExternalStore(
    subscribeToThemePreset,
    getThemePresetSnapshot,
    () => 'emerald' as ThemePreset,
  );

  return {
    preset: current,
    setPreset: setThemePreset,
    presets: THEME_PRESETS,
  };
}

/* ----------------------------------------------------------- Tema Claro / Oscuro */

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/** Tema efectivo actual: preferencia guardada o, si no hay, la del SO. */
export function getCurrentTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

/** Aplica el tema al documento (clase .dark + color-scheme + theme-color) sin persistirlo. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLOR[theme]);
}

const THEME_CHANGE_EVENT = 'tc:theme-change';

/** Persiste la elección del usuario y la aplica. */
export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage no disponible
  }
  applyTheme(theme);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }
}

export function subscribeToTheme(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function getThemeSnapshot(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
