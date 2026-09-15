// Grilla de servicios (DESIGN-CIRIDAE.md § System Card, § Layout): 4 columnas
// asimétricas, la primera ~2x más ancha. PillBadge numerado 01–08, ícono
// lineal en brand-500 (linework — único uso de relleno-color permitido es
// NINGUNO: el acento va solo en el trazo del ícono, ver doc § Colores) y
// fotografía atmosférica de fondo por card (identificador visual abstracto).

import { useEffect, useRef, useState } from 'react';
import { serviceRepo, type Service } from '../../../data';
import { gsapReveal, REVEAL } from '../../../lib/gsapReveal';
import { PillBadge, SectionHeading, SystemCard } from './CiridaePrimitives';
import { CIR_SERVICE_PHOTOS } from './ciridaeImages';
import { Skeleton } from '../../ui/Skeleton';

function ServicesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`rounded-cir-card bg-cir-charcoal p-8 ${i === 0 ? 'md:col-span-2' : ''}`}
        >
          <Skeleton className="h-6 w-16 rounded-cir-pill bg-cir-white/10 before:via-cir-white/20" />
          <Skeleton className="mt-6 h-5 w-3/4 bg-cir-white/10 before:via-cir-white/20" />
          <Skeleton className="mt-3 h-3 w-full bg-cir-white/10 before:via-cir-white/20" />
        </div>
      ))}
    </div>
  );
}

export default function CiridaeServicesGrid() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    serviceRepo
      .list()
      .then((list) => {
        if (alive) setServices(list);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loading || !gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('.cir-service-card');
    if (!cards.length) return;
    return gsapReveal(Array.from(cards), { stagger: REVEAL.stagger });
  }, [loading, services]);

  return (
    <section id="servicios" className="bg-cir-void py-10 sm:py-[60px]">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <SectionHeading eyebrow="Qué hacemos" title="Servicios" />
        {loading ? (
          <ServicesSkeleton />
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
            {services.map((service, i) => {
              const photo = CIR_SERVICE_PHOTOS[i % CIR_SERVICE_PHOTOS.length];
              return (
                <SystemCard
                  key={service.id}
                  className={`cir-service-card relative overflow-hidden ${i === 0 ? 'md:col-span-2' : ''}`}
                >
                  <img
                    src={photo}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-20 blur-[6px]"
                  />
                  <div aria-hidden className="absolute inset-0 bg-cir-charcoal/75" />
                  <div className="relative z-10 flex flex-col gap-4 px-8">
                    <div className="flex items-center justify-between">
                      <PillBadge>{String(i + 1).padStart(2, '0')}</PillBadge>
                    </div>
                    <h3 className="font-cir-cond text-cir-h uppercase tracking-[-0.02em] text-cir-white">
                      {service.title}
                    </h3>
                    <p className="font-cir-body text-[13px] leading-relaxed text-cir-white/55">
                      {service.description}
                    </p>
                  </div>
                </SystemCard>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
