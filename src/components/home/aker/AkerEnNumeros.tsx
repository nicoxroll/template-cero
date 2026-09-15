// "En números" — mapeado de "Key metrics": overline + intro + trío de
// cifras grandes con divisores (hairline vertical + top rule), desde
// configRepo.metrics (DESIGN.md § Datos).

import { useEffect, useRef, useState } from 'react';
import { configRepo, type PageConfig } from '../../../data';
import { Skeleton, useMinVisible } from '../../ui/Skeleton';
import { gsapReveal } from '../../../lib/gsapReveal';
import { AkerContainer, AkerOverline } from './AkerPrimitives';

const fmt = (n: number) => n.toLocaleString('es-AR');

function NumerosSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:divide-x sm:divide-aker-mist">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="sm:px-8 sm:first:pl-0">
          <Skeleton className="h-14 w-32" />
          <Skeleton className="mt-4 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function AkerEnNumeros() {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const loading = config === null;
  const showSkeleton = useMinVisible(loading);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    configRepo
      .get()
      .then((c) => {
        if (alive) setConfig(c);
      })
      .catch(() => {
        if (alive) setConfig(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loading || !ref.current) return;
    return gsapReveal(Array.from(ref.current.children), { stagger: 0.12, y: 20 });
  }, [loading]);

  const stats = config
    ? [
        { value: `${fmt(config.metrics.m2)}+`, label: 'm² construidos entre obras entregadas y en ejecución.' },
        { value: `${config.metrics.projects}+`, label: 'proyectos desarrollados en el Gran Buenos Aires.' },
        { value: `${config.metrics.years}+`, label: 'años acompañando a clientes e inversores.' },
      ]
    : [];

  return (
    <section className="bg-aker-paper py-20">
      <AkerContainer>
        <div className="mb-12 max-w-[600px] md:mb-16">
          <AkerOverline className="mb-3">En números</AkerOverline>
          <p className="text-aker-body text-aker-pewter">
            Orgullosos de acompañar el desarrollo inmobiliario de Buenos Aires con obra real y
            gestión transparente.
          </p>
        </div>

        {showSkeleton ? (
          <NumerosSkeleton />
        ) : loading ? null : (
          <div ref={ref} className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:divide-x sm:divide-aker-mist">
            {stats.map((s) => (
              <div key={s.label} className="border-t border-aker-mist pt-6 sm:border-t-0 sm:pt-0 sm:px-8 sm:first:pl-0 sm:last:pr-0">
                {/* Cifras a escala heading-lg/80: w300, ls -0.025em. */}
                <p className="text-[clamp(48px,6vw,80px)] leading-none font-light tracking-[-0.025em] text-aker-ink">
                  {s.value}
                </p>
                <p className="text-aker-body mt-4 max-w-[240px] border-t border-aker-mist pt-4 text-aker-pewter">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </AkerContainer>
    </section>
  );
}
