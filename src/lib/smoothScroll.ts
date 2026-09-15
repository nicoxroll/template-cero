// Scroll suave con Lenis, integrado con GSAP/ScrollTrigger.
//
// La integración NO es opcional: Lenis interpola el scroll fuera del evento
// nativo, así que sin conectarlo ScrollTrigger sigue leyendo la posición vieja
// y todo lo scrolleado —el pin del tour, el mazo de servicios, los parallax,
// el revelado del footer— queda medio cuadro atrás y se ve como jitter. Las
// tres líneas que lo resuelven:
//
//   1. `lenis.on('scroll', ScrollTrigger.update)` — ScrollTrigger recalcula con
//      la posición interpolada, no con la del navegador.
//   2. `gsap.ticker.add(...)` — un solo rAF para los dos. Con el rAF propio de
//      Lenis habría dos loops compitiendo y el desfasaje se nota.
//   3. `lagSmoothing(0)` — GSAP, ante un frame largo, "recupera" el tiempo
//      perdido de golpe; con scroll interpolado eso da un salto.
//
// Con prefers-reduced-motion no se instancia: el scroll suave es movimiento
// que el usuario no pidió, y encima secuestra la velocidad de la rueda.

import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsapReveal';
import { prefersReducedMotion } from './useReducedMotion';

let lenis: Lenis | null = null;

export function initSmoothScroll(): void {
  if (lenis || prefersReducedMotion()) return;

  lenis = new Lenis({
    // 1.05 y no el 1.2 de la referencia: más que eso el sitio se siente
    // "pesado" al rueda corta, que es como se navega un listado de proyectos.
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    // El gesto táctil ya es suave por sistema; interpolarlo encima se pelea
    // con el scroll nativo de iOS y arruina el pin del tour.
    smoothWheel: true,
    syncTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  const raf = (time: number) => {
    lenis?.raf(time * 1000);
  };
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
}

/** Congela / reanuda la interpolación. Lo usa el telón de entrada: con Lenis
 * activo, `overflow: hidden` en el <html> no alcanza para frenar la rueda,
 * porque Lenis mueve la página por su cuenta. Sin Lenis (reduced-motion) son
 * no-ops y la traba la hace el overflow solo. */
export function pauseSmoothScroll(): void {
  lenis?.stop();
}

export function resumeSmoothScroll(): void {
  lenis?.start();
}

/** Salta a un elemento respetando la interpolación (lo usa el ScrollManager
 * para los anchors: con window.scrollTo Lenis se entera tarde y pelea). */
export function scrollToElement(target: Element | string, offset = 0): boolean {
  if (!lenis) return false;
  lenis.scrollTo(target as never, { offset });
  return true;
}

/** Ir al tope sin animación, para los cambios de ruta. */
export function scrollToTopImmediate(): boolean {
  if (!lenis) return false;
  lenis.scrollTo(0, { immediate: true });
  return true;
}
