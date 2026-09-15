// Primitivas de skeleton (UX-01): shape-matched, shimmer, anti-flash.
// Regla DESIGN.md: el skeleton replica la geometría exacta del layout final (cero CLS).

import { useEffect, useRef, useState } from 'react';

const SHIMMER =
  'relative overflow-hidden bg-paper-soft before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-[var(--shimmer-highlight)] before:to-transparent';

interface SkeletonProps {
  className?: string;
}

/** Bloque base con shimmer. Darle forma con className (h-*, w-*, aspect-*, rounded-*). */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden className={`${SHIMMER} ${className}`} />;
}

/** Líneas de texto simuladas; la última al 60% de ancho. */
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${SHIMMER} h-4 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/** Skeleton de card estándar (imagen 4:3 + título + 2 líneas). */
export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div aria-hidden className={`border border-line ${className}`}>
      <div className={`${SHIMMER} aspect-[4/3] w-full`} />
      <div className="space-y-3 p-6">
        <div className={`${SHIMMER} h-6 w-3/4`} />
        <div className={`${SHIMMER} h-4 w-full`} />
        <div className={`${SHIMMER} h-4 w-1/2`} />
      </div>
    </div>
  );
}

/**
 * <img> con su propio skeleton: mientras la foto no cargó, el elemento muestra
 * el barrido; cuando carga, la foto lo tapa y el barrido se apaga.
 *
 * Es un reemplazo directo de <img>, mismo elemento y mismas props: no envuelve
 * en un <div>, que rompería los usos con `absolute inset-0` y los que dependen
 * de la altura del padre. Sirve donde la card completa NO tiene skeleton —una
 * card puede tener sus datos y estar igual esperando una foto de 400 kB.
 *
 * El chequeo con ref y no solo onLoad: si la imagen ya está en caché, termina
 * de cargar antes de que React enganche el handler y el evento nunca llega. Ahí
 * quedaba el shimmer prendido para siempre debajo de una foto ya visible.
 */
export function Photo({
  className = '',
  onLoad,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);

  const attach = (node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true);
  };

  return (
    <img
      {...props}
      ref={attach}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      // onError también apaga el shimmer: con una URL rota, dejarlo latiendo
      // promete una foto que no va a llegar nunca.
      onError={() => setLoaded(true)}
      className={`${loaded ? '' : 'img-loading'} ${className}`}
    />
  );
}

/**
 * Anti-flash (DESIGN.md): devuelve si mostrar skeleton.
 * - Si los datos llegan antes de `threshold` ms → el skeleton nunca aparece.
 * - Si aparece → se sostiene mínimo `minVisible` ms para evitar parpadeo.
 *
 * Uso: const showSkeleton = useMinVisible(loading);
 *      if (showSkeleton) return <SkeletonCard/>; if (loading) return null;
 */
export function useMinVisible(loading: boolean, threshold = 150, minVisible = 400): boolean {
  const [show, setShow] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (loading) {
      t = setTimeout(() => {
        shownAt.current = Date.now();
        setShow(true);
      }, threshold);
    } else if (shownAt.current !== null) {
      const elapsed = Date.now() - shownAt.current;
      const remaining = Math.max(0, minVisible - elapsed);
      t = setTimeout(() => {
        shownAt.current = null;
        setShow(false);
      }, remaining);
    } else {
      setShow(false);
    }
    return () => clearTimeout(t);
  }, [loading, threshold, minVisible]);

  return show;
}
