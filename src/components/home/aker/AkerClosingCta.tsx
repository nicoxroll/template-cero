// Closing — Two-Column Feature Card exacto (DESIGN-AKER.md § Componentes):
// izquierda card Mist 8px radius con overline + heading w300 36-48px +
// text-arrow ghost bottom-left + marca decorativa bottom-right; derecha card
// fotográfica 8px radius con texto Paper superpuesto + ghost arrow. Sin
// sombras, padding de card 16px, gap 16px. WhatsApp desde configRepo (mismo
// patrón que WhatsAppFloat.tsx).

import { useEffect, useRef, useState } from 'react';
import { configRepo } from '../../../data';
import { gsapReveal } from '../../../lib/gsapReveal';
import { AKER_CLOSING_PHOTO } from './akerImages';
import { AkerOverline, AkerTextArrow } from './AkerPrimitives';

export default function AkerClosingCta() {
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    configRepo
      .get()
      .then((c) => {
        if (alive) setWhatsapp(c.whatsappNumber);
      })
      .catch(() => {
        // sin config, el arrow "Hablemos" cae a /contacto (ver href abajo)
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(Array.from(ref.current.children), { stagger: 0.12, y: 24 });
  }, []);

  return (
    <section className="bg-aker-paper px-4 pb-20 sm:px-8">
      <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Izquierda — card Mist */}
        <div className="relative flex min-h-[380px] flex-col justify-between overflow-hidden rounded-aker-card bg-aker-mist p-4">
          <div>
            <AkerOverline className="mb-3">Inversiones</AkerOverline>
            <h3 className="max-w-md text-[clamp(36px,3.5vw,48px)] leading-[1.1] font-light tracking-[-0.025em] text-aker-ink">
              Invertí con Punto Cero
            </h3>
          </div>

          <div className="relative z-10 mt-10">
            <AkerTextArrow to="/contacto">Contactanos</AkerTextArrow>
          </div>

          {/* Marca decorativa bottom-right */}
          <svg
            aria-hidden
            viewBox="0 0 96 96"
            className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 text-aker-ink/10"
          >
            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="1.25" fill="none" />
            <circle cx="48" cy="48" r="7" fill="currentColor" />
          </svg>
        </div>

        {/* Derecha — card fotográfica con texto Paper superpuesto */}
        <div className="relative min-h-[380px] overflow-hidden rounded-aker-card">
          <img
            src={AKER_CLOSING_PHOTO}
            alt=""
            aria-hidden
            loading="lazy"
            className="aker-photo absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
          <div className="relative z-10 flex h-full flex-col justify-between p-4">
            <AkerOverline dark className="mb-3">
              Alianzas
            </AkerOverline>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="max-w-xs text-[clamp(28px,3vw,36px)] leading-[1.15] font-light tracking-[-0.02em] text-aker-paper">
                Abiertos a colaborar.
              </p>
              <AkerTextArrow
                to={whatsapp ? `https://wa.me/${whatsapp}` : '/contacto'}
                dark
                className="shrink-0"
              >
                Hablemos
              </AkerTextArrow>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
