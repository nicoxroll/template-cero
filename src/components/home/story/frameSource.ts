// FrameSource — abstracción de la "película" del hero scroll-scrub (HERO-01).
//
// MODO TOUR (esta versión): video real del cliente ya procesado como secuencia
// de 191 cuadros WebP (public/hero-frames/f001.webp..f191.webp, 1280x720).
// `createVideoFrameSource` es la única implementación de FrameSource — dibuja
// el cuadro real en el canvas con cover-fit (sin deformar, centrado) y, si el
// cuadro exacto todavía no cargó, cae al más cercano ya cargado (nunca deja el
// canvas en blanco). Carga perezosa: precarga solo un puñado de cuadros al
// montar y el resto por delante de la posición de scroll, nunca los 191 de
// golpe. `drawFrame` sigue siendo función pura del índice de cuadro en cuanto
// al contenido dibujado (mismo index + mismos cuadros ya cargados → mismo
// resultado), así que el scrub hacia atrás/adelante es reversible; el único
// efecto lateral es el fetch perezoso, que no afecta lo ya dibujado.
//
// El dibujo procedural de línea técnica (v1, sin video real) se retiró: el
// video reemplaza esa capa por completo.

export interface FrameSource {
  /** Cantidad total de cuadros discretos de la secuencia */
  readonly frameCount: number;
  /**
   * Dibuja el cuadro `index` (0..frameCount-1) en un contexto ya escalado a
   * devicePixelRatio. Determinístico respecto de lo ya cargado: mismo index +
   * mismo estado de caché → mismo cuadro dibujado. Devuelve `true` si pintó
   * un cuadro real (no el flat-fill de arranque en frío) — el caller lo usa
   * para saber si vale la pena marcar ese índice como "ya dibujado" o si
   * debe reintentar apenas termine de cargar algún cuadro.
   */
  drawFrame(ctx: CanvasRenderingContext2D, index: number, width: number, height: number): boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const clamp01 = (v: number) => clamp(v, 0, 1);

// Espejo canvas/CSS-dinámico de los tokens de DESIGN.md (canvas e inline
// styles interpolados por scroll no pueden usar clases Tailwind).
const INK_RGB = '16, 21, 18'; // --color-ink

/**
 * Poster/fallback del relato (HERO-05 estático): primer cuadro real del tour
 * (fachada con el logo PUNTO CERO) — mismo asset que el modo scrub, así el
 * modo estático y el modo scrub arrancan visualmente en el mismo lugar.
 */
/** Foto del hero de imagen (el modo por defecto). Es la de la referencia
 * real5.html, no el primer cuadro del video: el cuadro f001 es el arranque de
 * un vuelo de camara —encuadre de transicion, no una toma compuesta— y como
 * imagen fija se leia pobre. */
// 1600w y no 3840w: la variante grande pesa 749 kB contra 254 kB, y ésta es la
// imagen LCP del sitio — lo primero que ve una visita nueva. Sobre una pantalla
// de 1920 el reescalado es de 1,2x y va debajo de un degradado oscuro, así que
// la diferencia de nitidez no se ve; el medio segundo extra de carga sí.
// index.html la precarga para que empiece a bajar antes que el CSS y el JS.
export const STORY_PHOTO_URL =
  'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/482e7b6a-168c-4d0d-b35d-0e2ff4014577_1600w.webp';

/**
 * Gradiente de oscurecido MÍNIMO para legibilidad del texto sobre el video
 * real (a diferencia de la v1 procedural, el video es el contenido principal,
 * no hay que taparlo con un tinte fuerte). Función pura del progreso de
 * scroll (0..1): un poco más de oscurecido arriba/abajo (donde vive el texto)
 * que al centro, y un pelín más de contraste hacia el final del recorrido
 * (dormitorio, tonos más cálidos/oscuros que la fachada).
 */
export function videoLegibilityOverlay(p: number): string {
  const t = clamp01(p);
  const topAlpha = 0.3;
  const midAlpha = 0.12 + 0.06 * t;
  const bottomAlpha = 0.38 + 0.12 * t;
  return (
    `linear-gradient(to bottom, ` +
    `rgba(${INK_RGB}, ${topAlpha}) 0%, ` +
    `rgba(${INK_RGB}, ${midAlpha.toFixed(3)}) 45%, ` +
    `rgba(${INK_RGB}, ${bottomAlpha.toFixed(3)}) 100%)`
  );
}

// --------------------------------------------------------- Secuencia de video
const pad3 = (n: number) => n.toString().padStart(3, '0');

export interface CreateVideoFrameSourceOptions {
  /** Cantidad de archivos reales disponibles en /hero-frames (f001..fN). */
  totalFrames?: number;
  /** Carpeta pública donde viven los WebP. */
  baseDir?: string;
  /**
   * Paso entre cuadros reales consumidos por el scrub: 1 = los 191, 2 = uno de
   * cada dos (mobile — misma cobertura de recorrido, mitad de memoria/red).
   */
  stride?: 1 | 2;
  /** Cuadros precargados de entrada para que el primer paint no arranque en blanco. */
  preloadInitial?: number;
  /** Cuadros a precargar por delante de la posición de scroll, en la dirección del movimiento. */
  lookahead?: number;
  /**
   * Notifica cuando termina de cargar un cuadro cualquiera — el caller la usa
   * para reintentar el dibujo inicial (carga fría, sin scroll todavía: el
   * primer `drawFrame` puede caer antes de que f001 haya terminado de
   * decodificar, y sin este hook el canvas queda en el flat-fill hasta el
   * primer evento de scroll).
   */
  onFrameLoaded?: () => void;
}

/**
 * FrameSource sobre la secuencia de 191 WebP del video real del cliente.
 * `frameCount` expuesto es el de cuadros LÓGICOS (según `stride`) — el mapeo
 * a número de archivo real es interno, ScrubStage no necesita saberlo.
 */
export function createVideoFrameSource(options: CreateVideoFrameSourceOptions = {}): FrameSource {
  const {
    totalFrames = 191,
    baseDir = '/hero-frames',
    stride = 1,
    preloadInitial = 12,
    lookahead = 10,
    onFrameLoaded,
  } = options;

  const frameCount = Math.floor((totalFrames - 1) / stride) + 1;
  const url = (n: number) => `${baseDir}/f${pad3(n)}.webp`;
  const realFrameFor = (logicalIndex: number) =>
    clamp(1 + Math.round(logicalIndex) * stride, 1, totalFrames);

  // Índices 1..totalFrames (los archivos son f001..fN, 1-based).
  const images = new Array<HTMLImageElement | undefined>(totalFrames + 1);
  const failed = new Array<boolean>(totalFrames + 1).fill(false);

  function ensureLoaded(n: number): void {
    if (n < 1 || n > totalFrames || images[n] || failed[n]) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      images[n] = img;
      onFrameLoaded?.();
    };
    img.onerror = () => {
      failed[n] = true;
    };
    img.src = url(n);
  }

  // Precarga inicial acotada — nunca las 191 de golpe.
  for (let n = 1; n <= Math.min(preloadInitial, totalFrames); n++) ensureLoaded(n);

  let lastReal = 1;
  let everDrawn = false;

  /** Cuadro ya cargado más cercano a `target` (expandiendo el radio en ambas direcciones). */
  function nearestLoaded(target: number): HTMLImageElement | undefined {
    for (let d = 0; d < totalFrames; d++) {
      const before = target - d;
      const after = target + d;
      if (before >= 1 && images[before]) return images[before];
      if (after <= totalFrames && images[after]) return images[after];
      if (before < 1 && after > totalFrames) break;
    }
    return undefined;
  }

  function drawFrame(ctx: CanvasRenderingContext2D, index: number, w: number, h: number): boolean {
    if (w <= 0 || h <= 0) return false;
    const real = realFrameFor(index);

    // Precarga por delante de la posición de scroll, en la dirección del
    // movimiento (funciona igual de bien scrubeando hacia atrás).
    const dir = real >= lastReal ? 1 : -1;
    for (let i = 0; i <= lookahead; i++) {
      ensureLoaded(clamp(real + dir * i * stride, 1, totalFrames));
    }
    lastReal = real;

    const img = images[real] ?? nearestLoaded(real);
    if (!img) {
      // Todavía no cargó ningún cuadro (arranque en frío): fondo sólido en
      // vez de dejar el canvas transparente/en blanco.
      if (!everDrawn) {
        ctx.fillStyle = '#0b0b0b';
        ctx.fillRect(0, 0, w, h);
      }
      return false; // nunca borramos un cuadro ya dibujado — queda el último visible.
    }
    everDrawn = true;

    // Cover-fit: centrado, sin deformar.
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, dx, dy, dw, dh);
    return true;
  }

  return { frameCount, drawFrame };
}
