// Galería del proyecto (PROY-04): grilla + lightbox simple con teclado.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { gsapReveal } from '../../../lib/gsapReveal';
import Container from '../../ui/Container';
import SectionHeading from '../../ui/SectionHeading';
import { Photo } from '../../ui/Skeleton';

interface GaleriaProyectoProps {
  name: string;
  gallery: string[];
  isRender: boolean;
}

export default function GaleriaProyecto({ name, gallery, isRender }: GaleriaProyectoProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    return gsapReveal(Array.from(gridRef.current.children), { stagger: 0.12 });
  }, []);

  const close = useCallback(() => setLightbox(null), []);
  const move = useCallback(
    (delta: number) => {
      setLightbox((i) =>
        i === null ? null : (i + delta + gallery.length) % gallery.length,
      );
    },
    [gallery.length],
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, close, move]);

  if (gallery.length === 0) return null;

  return (
    <section className="bg-paper py-20 md:py-28 lg:py-32">
      <Container>
        <SectionHeading
          kicker="Galería"
          title="Imágenes del proyecto"
          intro={
            isRender
              ? 'Las imágenes corresponden a renders y material conceptual del proyecto.'
              : undefined
          }
          className="mb-12 md:mb-16"
        />
        <div ref={gridRef} className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setLightbox(i)}
              className={`group relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                i === 0 ? 'col-span-2 row-span-2' : ''
              }`}
              aria-label={`Ampliar imagen ${i + 1} de ${name}`}
            >
              <Photo
                src={src}
                alt={`${name} — imagen ${i + 1}`}
                loading="lazy"
                className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {isRender && (
                <span className="absolute left-3 top-3 bg-black/40 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-white backdrop-blur-sm">
                  Render
                </span>
              )}
            </button>
          ))}
        </div>
      </Container>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ${lightbox + 1} de ${gallery.length}`}
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-20 rounded-full bg-black/40 p-2.5 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white md:right-8 md:top-8"
            aria-label="Cerrar galería"
          >
            <X className="h-7 w-7" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              move(-1);
            }}
            className="absolute left-2 z-20 rounded-full bg-black/40 p-3 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white md:left-6"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={1.5} />
          </button>

          <div
            className="flex h-full w-full items-center justify-center p-2 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <Photo
              src={gallery[lightbox]}
              alt={`${name} — imagen ${lightbox + 1}`}
              className="max-h-[85vh] max-w-[85vw] object-contain shadow-2xl"
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              move(1);
            }}
            className="absolute right-2 z-20 rounded-full bg-black/40 p-3 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white md:right-6"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="h-8 w-8" strokeWidth={1.5} />
          </button>

          <p className="absolute bottom-5 z-20 text-xs font-medium uppercase tracking-widest text-white/60">
            {lightbox + 1} / {gallery.length}
          </p>
        </div>
      )}
    </section>
  );
}
