// Tema claro/oscuro (DESIGN.md dark mode): toggle en Header (público) y
// AdminShell (admin). Precedencia: localStorage > prefers-color-scheme del SO.
// El anti-flash inicial vive en index.html (script inline, corre antes del
// primer paint) — este módulo es la fuente de verdad que usa React después.

const STORAGE_KEY = 'tc-theme';

export type Theme = 'light' | 'dark';

const THEME_COLOR: Record<Theme, string> = {
  light: '#10281d',
  dark: '#0b0f0d',
};

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Tema efectivo actual: preferencia guardada o, si no hay, la del SO. */
export function getCurrentTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

/** Aplica el tema al documento (clase .dark + color-scheme + theme-color) sin persistirlo. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLOR[theme]);
}

/** Evento interno para que los toggles montados en distintos árboles (Header
 * público y AdminShell) reflejen el cambio sin compartir estado de React. */
const THEME_CHANGE_EVENT = 'pc:theme-change';

/** Persiste la elección del usuario y la aplica. */
export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage no disponible (modo privado / cuota): el tema no
    // persiste entre sesiones, pero igual se aplica en esta.
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/* --------------------------------------------------- Store para React 18+
   El tema es estado EXTERNO a React: lo escribe el script anti-flash de
   index.html antes del primer paint y vive en el DOM + localStorage. Se expone
   como store suscribible para poder leerlo con `useSyncExternalStore`, que es
   la forma soportada de sincronizar estado externo — leerlo con
   useState+useEffect provoca un render en cascada en cada montaje
   (react-hooks/set-state-in-effect). */

export function subscribeToTheme(onChange: () => void): () => void {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  // `storage` cubre el cambio hecho en OTRA pestaña del mismo sitio.
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Snapshot para useSyncExternalStore: se lee del DOM, no de localStorage,
 * porque el DOM ya refleja lo que aplicó el anti-flash y devuelve siempre el
 * mismo valor entre renders (requisito de getSnapshot). */
export function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
