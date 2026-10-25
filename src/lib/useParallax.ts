// Parallax de fondo: la capa se desplaza más lento que el scroll, lo que da
// sensación de profundidad. Integrado con GSAP ScrollTrigger y Lenis smooth scroll.

import { useEffect, useRef } from 'react';
import { gsap } from './gsapReveal';
import { prefersReducedMotion } from './useReducedMotion';

export interface ParallaxOptions {
  /** Recorrido total en % de la altura del elemento (default 24). */
  amount?: number;
  /** Elemento que dispara el rango de scroll. Por defecto, el padre. */
  triggerRef?: React.RefObject<HTMLElement | null>;
  /** Posición de inicio personalizada (ej. 'top top' para heros). Si no se especifica y el elemento está en la parte superior, se autodetecta. */
  start?: string;
  /** Posición de fin personalizada (ej. 'bottom top'). */
  end?: string;
  /** Suavizado de scrub en segundos o boolean (true = 1:1, 0.5 = amortiguado). */
  scrub?: boolean | number;
}

export function useParallax<T extends HTMLElement>({
  amount = 26,
  triggerRef,
  start,
  end = 'bottom top',
  scrub = true,
}: ParallaxOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { yPercent: 0 });
      return;
    }

    const trigger = triggerRef?.current ?? el.parentElement ?? el;

    // Si el elemento está al inicio de la página (o el usuario lo especifica),
    // arrancamos en 'top top' para que todo el scroll sea visible desde el primer pixel.
    const rect = trigger.getBoundingClientRect();
    const isTopElement =
      typeof start === 'string'
        ? start.includes('top top')
        : window.scrollY === 0 && rect.top <= 80;

    const effectiveStart = start ?? (isTopElement ? 'top top' : 'top bottom');
    const fromY = isTopElement ? 0 : -amount / 2;
    const toY = isTopElement ? amount : amount / 2;

    const tween = gsap.fromTo(
      el,
      { yPercent: fromY },
      {
        yPercent: toY,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start: effectiveStart,
          end,
          scrub,
          invalidateOnRefresh: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [amount, triggerRef, start, end, scrub]);

  return ref;
}
