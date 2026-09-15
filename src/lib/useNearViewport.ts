// "¿Está por entrar en pantalla?" — IntersectionObserver de un solo disparo.
//
// Sirve para diferir trabajo caro que vive abajo de todo: el mapa de oficinas
// cierra la home, pero Leaflet pesa ~45 kB gzip y bajarlo en cuanto monta la
// portada gasta ancho de banda que el hero necesita. Con esto, el chunk se pide
// recién cuando el visitante se acerca a la sección; si nunca baja, nunca se
// descarga.
//
// Devuelve un CALLBACK ref, no un objeto ref. La diferencia importa: el
// elemento observado suele renderizarse recién cuando terminó de cargar algo
// (el mapa aparece después de que resuelve configRepo). Con un objeto ref el
// efecto corría al montar, encontraba `ref.current === null`, se daba por
// vencido, y como sus dependencias no cambiaban nunca volvía a intentarlo: el
// mapa quedaba para siempre en su placeholder. El callback ref se dispara
// cuando el nodo aparece de verdad.
//
// `rootMargin` generoso a propósito: el objetivo es que el contenido YA esté
// cargado cuando el bloque entra en pantalla, no que el usuario vea el
// placeholder.

import { useCallback, useEffect, useRef, useState } from 'react';

export function useNearViewport<T extends HTMLElement>(
  rootMargin = '600px',
): [(node: T | null) => void, boolean] {
  const [node, setNode] = useState<T | null>(null);
  // Sin soporte de IntersectionObserver (navegadores muy viejos) arranca en
  // true: cargar de más es preferible a no mostrar nunca el contenido.
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((next: T | null) => setNode(next), []);

  useEffect(() => {
    if (near || !node || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect(); // un solo disparo: una vez cargado no se descarga
        }
      },
      { rootMargin },
    );
    observerRef.current = io;
    io.observe(node);

    return () => io.disconnect();
  }, [node, near, rootMargin]);

  return [ref, near];
}
