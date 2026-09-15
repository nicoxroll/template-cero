// Sincronización del telón de entrada (INTRO-01) con lo que anima arriba del
// pliegue.
//
// El telón lo dibuja y lo anima el CSS de index.html — este módulo NO lo
// controla, solo lo acompaña. Hace dos cosas:
//
//   1. `heroReady`: una promesa que resuelve cuando el telón EMPIEZA a abrirse.
//      El hero se anima al montar, y montar pasa mucho antes de que el telón se
//      abra: sin esta espera, el revelado palabra por palabra del título —que es
//      literalmente la primera impresión del sitio— termina detrás del telón y
//      la visita encuentra el hero ya quieto. Enganchando al inicio de la
//      apertura, el título se revela MIENTRAS las hojas se separan.
//   2. Traba el scroll mientras el telón está puesto, y lo libera.
//
// Sobre la traba: solo existe si este archivo corrió, y el mismo archivo la
// suelta. Si el bundle nunca carga, la traba nunca se pone y el telón se abre
// igual por CSS. No hay forma de quedar con la página trabada.

import { prefersReducedMotion } from './useReducedMotion';

// ⚠ Estos tres números son un espejo del <style> de index.html. Si se cambian
// los tiempos de las animaciones allá, hay que cambiarlos acá.
/** ms desde el primer paint hasta que las hojas arrancan a abrirse. */
const CURTAIN_STARTS_MS = 1050;
/** ms hasta que el telón terminó de salir de pantalla. */
const CURTAIN_DONE_MS = 1750;

/** ¿Hay telón en esta carga? El CSS lo apaga con prefers-reduced-motion, así
 * que la condición tiene que ser la misma o el hero esperaría de gusto. */
const playing =
  typeof document !== 'undefined' &&
  document.getElementById('pc-intro') !== null &&
  !prefersReducedMotion();

/** Espera un hito del telón: el evento REAL de la animación, con el reloj como
 * red de seguridad.
 *
 * Por qué no alcanza un setTimeout solo: la animación CSS arranca cuando el
 * navegador pinta el <div>, y este módulo se evalúa recién después de bajar y
 * parsear el bundle. Los dos relojes no comparten origen, así que un timeout
 * calculado acá se adelanta —tanto más cuanto peor la conexión— y el hero
 * empezaría a animarse todavía tapado.
 *
 * `animationstart` / `animationend` se disparan en el instante exacto, sin
 * cuentas. El riesgo del evento solo es el inverso: si el bundle tardó MÁS que
 * el telón, el evento ya pasó y nadie lo escuchó nunca. De ahí el race con un
 * plazo generoso (el hito + un margen, medido desde el inicio de la navegación
 * con performance.now()): en la carga normal gana el evento; si el bundle llegó
 * tarde, gana el reloj y el hero anima enseguida, que es lo correcto. */
function atCurtain(event: 'animationstart' | 'animationend', mark: number): Promise<void> {
  const GRACE_MS = 400;
  const half = document.querySelector('.pc-intro__half--l');

  const viaEvent = new Promise<void>((resolve) => {
    half?.addEventListener(event, () => resolve(), { once: true });
  });
  const viaClock = new Promise<void>((resolve) => {
    window.setTimeout(resolve, Math.max(0, mark + GRACE_MS - performance.now()));
  });

  return Promise.race([viaEvent, viaClock]);
}

/** Resuelve cuando el telón empieza a abrirse (o al instante si no hay telón). */
export const heroReady: Promise<void> = playing
  ? atCurtain('animationstart', CURTAIN_STARTS_MS)
  : Promise.resolve();

/** Traba el scroll mientras dura el telón y saca el nodo cuando terminó.
 * Se llama una sola vez, desde main.tsx, antes del primer render. */
export function initPageIntro(stopScroll: () => void, startScroll: () => void): void {
  if (!playing) return;
  // Bundle muy lento: el telón ya se abrió solo por CSS y la página está a la
  // vista. Trabar el scroll ahora sería trabarlo DESPUÉS de que el usuario
  // puede ver y tocar el sitio.
  if (performance.now() > CURTAIN_DONE_MS) {
    document.getElementById('pc-intro')?.remove();
    return;
  }

  const html = document.documentElement;
  const previous = html.style.overflow;
  html.style.overflow = 'hidden';
  stopScroll();

  void atCurtain('animationend', CURTAIN_DONE_MS).then(() => {
    html.style.overflow = previous;
    startScroll();
    // El telón ya es invisible por CSS (visibility: hidden) desde este mismo
    // momento; sacarlo del DOM es sólo higiene.
    document.getElementById('pc-intro')?.remove();
  });
}
