// Franja Bone — la ÚNICA sección clara (DESIGN-CIRIDAE.md § Backers/Logos
// Strip, § Superficies): quiebre tonal dramático usado una sola vez. Métricas
// de trayectoria de configRepo como prueba social, texto oscuro sobre Bone.

import { useEffect, useRef, useState } from 'react';
import { configRepo, type PageConfig } from '../../../data';
import { gsapReveal } from '../../../lib/gsapReveal';
import { Skeleton, useMinVisible } from '../../ui/Skeleton';

const nf = new Intl.NumberFormat('es-AR');

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col items-center gap-3">
          <Skeleton className="h-12 w-28 bg-cir-void/10 before:via-cir-void/20" />
          <Skeleton className="h-3 w-36 bg-cir-void/10 before:via-cir-void/20" />
        </div>
      ))}
    </div>
  );
}

export default function CiridaeMetrics() {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinVisible(loading);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    configRepo
      .get()
      .then((c) => {
        if (alive) setConfig(c);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!config || !gridRef.current) return;
    return gsapReveal(gridRef.current.children, { stagger: 0.1 });
  }, [config]);

  const stats = config
    ? [
        { value: `${config.metrics.years}`, label: 'Años de trayectoria' },
        { value: nf.format(config.metrics.m2), label: 'M² desarrollados' },
        { value: `${config.metrics.projects}`, label: 'Proyectos' },
      ]
    : [];

  return (
    <section className="bg-cir-bone py-16 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        {showSkeleton ? (
          <MetricsSkeleton />
        ) : loading || !config ? null : (
          <div ref={gridRef} className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2 text-center">
                <span className="font-cir-cond uppercase tracking-[-0.02em] text-cir-void [font-size:clamp(2.5rem,5vw,4rem)]">
                  {s.value}
                </span>
                <span className="font-cir-cond text-cir-body uppercase tracking-[-0.02em] text-cir-void/60">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
