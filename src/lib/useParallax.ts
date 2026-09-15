// Parallax de fondo: la capa se desplaza más lento que el scroll, lo que da
// sensación de profundidad. Es el gesto de `.hero-img` en real5.html, acá
// generalizado para poder usarlo en cualquier foto de fondo del sitio.
//
// IMPORTANTE — la capa tiene que ser MÁS ALTA que su contenedor, o al
// desplazarse deja un borde vacío. La convención del sitio es
// `absolute -inset-y-[12%] inset-x-0` en el elemento parallaxeado, con
// `overflow-hidden` en el padre. Ese 12% cubre el ±10% de recorrido por
// defecto con margen.

import { useEffect, useRef } from 'react';
import { gsap } from './gsapReveal';
import { prefersReducedMotion } from './useReducedMotion';

export interface ParallaxOptions {
  /** Recorrido total en % de la altura del elemento (default 20 = de -10 a +10). */
  amount?: number;
  /** Elemento que dispara el rango de scroll. Por defecto, el padre. */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function useParallax<T extends HTMLElement>({
  amount = 20,
  triggerRef,
}: ParallaxOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // El parallax ES movimiento ligado al scroll: con la preferencia activa se
    // deja la capa quieta y centrada.
    if (prefersReducedMotion()) {
      gsap.set(el, { yPercent: 0 });
      return;
    }

    const trigger = triggerRef?.current ?? el.parentElement ?? el;

    const tween = gsap.fromTo(
      el,
      { yPercent: -amount / 2 },
      {
        yPercent: amount / 2,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [amount, triggerRef]);

  return ref;
}
