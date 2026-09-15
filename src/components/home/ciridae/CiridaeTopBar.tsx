// Top News Bar (DESIGN-CIRIDAE.md § Top News Bar): fondo Abyss, Roboto Mono
// 11px caps centrado, separadores •. Lee la inversión activa destacada del
// repo — cero copy de negocio hardcodeado (ver README.md § datos vía repos).

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { investmentRepo, type Investment } from '../../../data';

function TickerSkeleton() {
  return (
    <div
      aria-hidden
      className="mx-auto h-[11px] w-64 max-w-[70%] animate-pulse rounded-cir-sharp bg-cir-white/10"
    />
  );
}

export default function CiridaeTopBar() {
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    investmentRepo
      .listActive()
      .then((list) => {
        if (alive) setInvestment(list[0] ?? null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="w-full bg-cir-abyss py-2.5 text-center">
      {loading ? (
        <TickerSkeleton />
      ) : (
        <p className="font-cir-mono text-cir-caption uppercase tracking-[-0.22px] text-cir-white/80">
          <span>Punto Cero</span>
          <span aria-hidden className="mx-3 text-brand-500">
            •
          </span>
          {investment ? (
            <>
              <span>Oportunidad activa</span>
              <span aria-hidden className="mx-3 text-brand-500">
                •
              </span>
              <Link to={`/inversiones/${investment.slug}`} className="hover:text-cir-white">
                {investment.title}
              </Link>
            </>
          ) : (
            <span>Arquitectura, desarrollo e inversión</span>
          )}
        </p>
      )}
    </div>
  );
}
