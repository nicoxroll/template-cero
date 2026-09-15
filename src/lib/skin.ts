// Modo de HERO de la portada: 'imagen' (foto fija — EL DEFAULT, lo que ve toda
// visita nueva) / 'video' (el tour: vuelo de cámara scrubeado por scroll, que
// el visitante activa desde el toggle del encabezado).
// El eje cambia ÚNICAMENTE el hero: el resto de la home (proyectos destacados,
// quiénes somos, servicios, inversiones, newsletter, contacto, footer) es
// idéntico en ambos modos — ver src/pages/Home.tsx.
//
// Arrancar en imagen y no en video es deliberado: el tour pesa 191 cuadros WebP
// y hace pin de ~3 alturas de viewport. Como primera impresión incondicional es
// una apuesta; como algo que el visitante ELIGE, es un valor agregado. La foto
// fija carga al instante y el tour queda a un click.
//
// Independiente del tema claro/oscuro (src/lib/theme.ts): dos ejes ortogonales,
// mismo patrón de persistencia. Precedencia: localStorage > 'imagen'. El
// anti-flash inicial vive en index.html (script inline, corre antes del primer
// paint) — este módulo es la fuente de verdad que usa React después.
//
// Migración de valores persistidos: el eje anterior era de PORTADA COMPLETA
// ('tour' | 'normal', y antes 'default' | 'aker'). 'tour' era el hero de video
// → mapea a 'video'; 'normal' era la portada Ciridae completa, cuyo hero era
// una imagen fija → mapea a 'imagen'. El resto cae al default.

const STORAGE_KEY = 'tc-skin';

export type Mode = 'video' | 'imagen';

/** Modo por defecto: hero de imagen fija. El tour (video) es opt-in. */
export const DEFAULT_MODE: Mode = 'imagen';

/** Mapea cualquier valor persistido (actual o legacy) al eje vigente. */
function normalize(value: string | null): Mode | null {
  switch (value) {
    case 'video':
    case 'tour': // legacy: portada tour = hero de video
      return 'video';
    case 'imagen':
    case 'normal': // legacy: portada Ciridae = hero de imagen fija
      return 'imagen';
    default:
      // 'default' | 'aker' (skin viejo ya retirado) y basura → sin preferencia
      return null;
  }
}

/** Valor guardado ya migrado al eje vigente, o null si no hay preferencia. */
export function getStoredMode(): Mode | null {
  try {
    return normalize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Modo efectivo actual: preferencia guardada o, si no hay, el default.
 *
 * Ya no hay heurística por cantidad de núcleos: tenía sentido cuando el default
 * era el video y convenía degradar en hardware flojo. Ahora el default ES la
 * imagen, y quien activa el tour lo pide explícitamente — adivinar por hardware
 * sería negarle lo que acaba de elegir.
 */
export function getCurrentMode(): Mode {
  return getStoredMode() ?? DEFAULT_MODE;
}

/** Aplica el modo al documento (atributo data-mode) sin persistirlo. */
export function applyMode(mode: Mode): void {
  document.documentElement.setAttribute('data-mode', mode);
}

/** Persiste la elección del usuario y la aplica. */
export function setMode(mode: Mode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage no disponible (modo privado / cuota): el modo no
    // persiste entre sesiones, pero igual se aplica en esta.
  }
  applyMode(mode);
}
