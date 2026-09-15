// Full-bleed photo band — ritmo de sección DESIGN-AKER.md: "alterna banda
// fotográfica 100vw ↔ canvas blanco". Full-bleed VERDADERO: w-full sin
// radius ni inset lateral ("full-bleed 100vw no-radius en heros/bandas;
// 8px solo en cards" — § Imagery). Tratamiento muted consistente .aker-photo.

import { useEffect, useRef } from 'react';
import { gsapReveal } from '../../../lib/gsapReveal';

export default function AkerPhotoBand({
  image,
  heightClass = 'h-[60vh] md:h-[75vh]',
}: {
  image: string;
  heightClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(ref.current, { y: 0, duration: 1.1 });
  }, []);

  return (
    <section aria-hidden className="bg-aker-paper">
      <div ref={ref} className={`relative w-full overflow-hidden bg-aker-mist ${heightClass}`}>
        <img
          src={image}
          alt=""
          loading="lazy"
          className="aker-photo absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </section>
  );
}
