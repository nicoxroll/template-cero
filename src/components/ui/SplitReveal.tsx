// Reveal de texto palabra por palabra: cada palabra sube desde debajo de una
// máscara, con un stagger corto. Es el efecto de `.split-animate` de la
// referencia real5.html.
//
// Por qué las palabras se parten en React y no con innerHTML como la
// referencia: reescribir el DOM a mano bajo React lleva a que el próximo
// render pise la mutación. Acá el split es parte del árbol, así que sobrevive
// a los re-renders y no pelea con la reconciliación.
//
// Accesibilidad: el texto queda partido en <span> por palabra, con los
// espacios reales entre ellos, así que un lector de pantalla y el "buscar en
// la página" del navegador lo siguen leyendo como una sola frase.

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../lib/gsapReveal';
import { heroReady } from '../../lib/pageIntro';
import { prefersReducedMotion } from '../../lib/useReducedMotion';

interface SplitRevealProps {
  /** Los saltos de línea (\n) se respetan como líneas propias. */
  text: string;
  /** Etiqueta del contenedor (h1/h2/h3/p). Default: span. */
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  /** Retraso antes de arrancar, en segundos. */
  delay?: number;
  /** true = anima al montar en vez de esperar el scroll (hero above the fold). */
  immediate?: boolean;
}

export default function SplitReveal({
  text,
  as: Tag = 'span',
  className = '',
  delay = 0,
  immediate = false,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  // useLayoutEffect y no useEffect: corre ANTES del primer paint, así el
  // desplazamiento inicial lo pone GSAP y no el markup. Es la diferencia entre
  // fallar visible y fallar invisible — si GSAP no cargara, el texto queda
  // simplemente quieto y legible en vez de escondido bajo su máscara para
  // siempre, que es exactamente el modo en que este componente ya se rompió
  // una vez.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const words = el.querySelectorAll<HTMLElement>('[data-word]');
    if (words.length === 0) return;

    // Con reduced-motion el texto se muestra quieto: el efecto es
    // exactamente el desplazamiento que la preferencia pide evitar.
    if (prefersReducedMotion()) {
      gsap.set(words, { yPercent: 0 });
      return;
    }

    // El estado inicial se pone YA, sincrónico, aunque el arranque espere: si
    // se dejara para después de la promesa, entre el paint y el arranque las
    // palabras se verían un instante en su posición final y después saltarían.
    gsap.set(words, { yPercent: 110 });

    let tween: gsap.core.Tween | null = null;
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      tween = gsap.to(words, {
        yPercent: 0,
        duration: immediate ? 1.4 : 1,
        ease: immediate ? 'power4.out' : 'power3.out',
        stagger: immediate ? 0.06 : 0.02,
        delay,
        // El hero está above the fold: esperar un ScrollTrigger que ya está
        // dentro del viewport agrega un frame de retraso visible en la carga.
        ...(immediate
          ? {}
          : { scrollTrigger: { trigger: el, start: 'top 85%', once: true } }),
      });
    };

    // `immediate` es el modo de arriba del pliegue, y arriba del pliegue está
    // el telón: animar al montar dejaría el revelado del título ocurriendo
    // detrás de él. Los reveals por scroll no esperan nada — están abajo, el
    // telón ya no existe cuando el usuario llega.
    if (immediate) void heroReady.then(start);
    else start();

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
    };
  }, [text, delay, immediate]);

  const lines = text.split('\n');

  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(' ').map((word, i, arr) => (
            // overflow-hidden en el wrapper es la máscara; align-top evita que
            // el inline-block corra la línea de base y desalinee el conjunto.
            <span
              key={`${word}-${i}`}
              className="inline-block overflow-hidden align-top pb-[0.12em]"
            >
              {/* Sin transform inicial en el markup: lo pone GSAP en el
                  useLayoutEffect. Y NUNCA con la clase translate-y-* de
                  Tailwind: en v4 esa clase emite la propiedad CSS `translate`,
                  independiente de `transform` y acumulativa con ella, asi que
                  GSAP animaba su transform a 0 mientras el translate seguia
                  empujando la palabra fuera de la mascara. */}
              <span data-word className="inline-block">
                {word}
                {i < arr.length - 1 ? ' ' : ''}
              </span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
