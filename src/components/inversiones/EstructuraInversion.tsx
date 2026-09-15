// BLOCKER 4 — Estructura de la inversión: ficha (fiduciario/escribanía/ticket/moneda),
// cronograma de integración de aportes, hitos de desembolso ligados a avance de obra
// y salida/realización del retorno. Todo vía repos (Investment ya trae los campos).

import { useEffect, useRef, useState } from 'react';
import type { AporteEtapa, HitoDesembolso, Investment } from '../../data';
import Container from '../ui/Container';
import SectionHeading from '../ui/SectionHeading';
import { Skeleton, SkeletonText } from '../ui/Skeleton';
import { gsapReveal } from '../../lib/gsapReveal';
import { formatAmount } from './InvestmentCard';
import ReturnDisclaimer from './ReturnDisclaimer';

const SEGMENT_TONES = ['bg-brand-900', 'bg-brand-700', 'bg-brand-500', 'bg-brand-300'];

const MONEDA_LABELS: Record<'USD' | 'ARS', string> = {
  USD: 'Dólares estadounidenses (USD)',
  ARS: 'Pesos argentinos (ARS)',
};

function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const s = d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function FichaEstructura({ investment }: { investment: Investment }) {
  const ref = useRef<HTMLDListElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(Array.from(ref.current.children), { stagger: 0.1 });
  }, []);

  const { tipoEstructura, fiduciario, escribania, ticketMinimo, moneda } = investment;

  const items: { label: string; value: string; sub?: string }[] = [
    { label: 'Tipo de estructura', value: tipoEstructura },
    { label: 'Fiduciario', value: fiduciario.nombre, sub: fiduciario.tipo },
    { label: 'Escribanía', value: escribania },
    { label: 'Ticket mínimo', value: formatAmount(ticketMinimo, moneda) },
    { label: 'Moneda', value: MONEDA_LABELS[moneda] },
  ];

  return (
    <dl
      ref={ref}
      className="grid grid-cols-1 gap-x-6 gap-y-8 border border-line bg-paper p-8 sm:grid-cols-2 lg:grid-cols-5 lg:p-10"
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-widest text-ink-soft">
            {item.label}
          </dt>
          <dd className="mt-2 text-lg font-light tracking-wide text-ink">{item.value}</dd>
          {item.sub && <dd className="mt-1 text-xs font-light text-ink-soft">{item.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

function IntegracionAportes({ integracion }: { integracion: AporteEtapa[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(ref.current);
  }, []);

  if (integracion.length === 0) return null;

  const total = integracion.reduce((sum, a) => sum + a.porcentaje, 0) || 100;

  return (
    <div ref={ref} className="mt-16">
      <h3 className="text-xl font-light tracking-wide text-ink md:text-2xl">
        Cronograma de integración de aportes
      </h3>

      <div className="mt-6 flex h-3 w-full overflow-hidden bg-brand-100" role="img" aria-label="Distribución porcentual de los aportes por etapa">
        {integracion.map((etapa, i) => (
          <div
            key={etapa.etapa}
            className={SEGMENT_TONES[i % SEGMENT_TONES.length]}
            style={{ width: `${(etapa.porcentaje / total) * 100}%` }}
            title={`${etapa.etapa} — ${etapa.porcentaje}%`}
          />
        ))}
      </div>

      <ul className="mt-8 divide-y divide-hairline border-y border-hairline">
        {integracion.map((etapa, i) => (
          <li
            key={etapa.etapa}
            className="flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:gap-6"
          >
            <div className="flex items-baseline gap-3 sm:w-56 sm:shrink-0">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${SEGMENT_TONES[i % SEGMENT_TONES.length]}`}
                aria-hidden
              />
              <span className="text-base font-light text-ink">{etapa.etapa}</span>
            </div>
            <span className="text-sm font-medium uppercase tracking-widest text-brand-700 dark:text-brand-300 sm:w-14 sm:shrink-0">
              {etapa.porcentaje}%
            </span>
            <span className="text-sm font-light leading-relaxed text-ink-soft">
              {etapa.momento}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HitosDesembolso({ hitos }: { hitos: HitoDesembolso[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  // "Ahora" se congela al montar con un initializer perezoso: llamar Date.now()
  // en el cuerpo del render es impuro y daría un valor distinto en cada pasada
  // (react-hooks/purity). Para un cronograma de obra la precisión de un montaje
  // sobra — los hitos se miden en meses.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!listRef.current) return;
    return gsapReveal(Array.from(listRef.current.children), { stagger: 0.12 });
  }, []);

  if (hitos.length === 0) return null;

  const nextIndex = hitos.findIndex((h) => new Date(h.fecha).getTime() > now);

  return (
    <div className="mt-16">
      <h3 className="text-xl font-light tracking-wide text-ink md:text-2xl">
        Hitos de desembolso según avance de obra
      </h3>
      <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-ink-soft">
        Cada desembolso queda atado a un certificado de avance de obra verificable, no a fechas
        fijas de calendario.
      </p>

      <ol ref={listRef} className="relative mt-10">
        {hitos.map((hito, i) => {
          const completed = new Date(hito.fecha).getTime() <= now;
          const isCurrent = i === nextIndex;
          const isLast = i === hitos.length - 1;
          const avancePct = Math.min(100, Math.max(0, parseInt(hito.avanceObra, 10) || 0));

          return (
            <li key={hito.hito} className="relative flex gap-6 md:gap-10">
              <div className="flex flex-col items-center">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                  {isCurrent && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500/40 motion-reduce:animate-none" />
                  )}
                  <span
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border text-xs font-medium ${
                      isCurrent
                        ? 'border-brand-500 bg-brand-500 text-white dark:border-brand-700 dark:bg-brand-700'
                        : completed
                          ? // Sobre fondo oscuro brand-900 es casi negro: el hito
                            // cumplido desaparecia y el pendiente brillaba.
                            'border-brand-900 bg-brand-900 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-brand-900'
                          : 'border-hairline bg-paper text-ink-soft'
                    }`}
                  >
                    {i + 1}
                  </span>
                </span>
                {!isLast && (
                  <span
                    className={`w-px flex-1 ${
                      completed ? 'bg-brand-900 dark:bg-brand-500' : 'bg-hairline'
                    }`}
                  />
                )}
              </div>

              <div className={isLast ? 'pb-2' : 'pb-12 md:pb-16'}>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h4
                    className={`text-lg font-light tracking-wide md:text-xl ${
                      isCurrent ? 'text-brand-700 dark:text-brand-300' : completed ? 'text-ink' : 'text-ink-soft'
                    }`}
                  >
                    {hito.hito}
                  </h4>
                  {isCurrent && (
                    <span className="bg-brand-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-brand-700">
                      Próximo hito
                    </span>
                  )}
                  {completed && (
                    <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft">
                      Cumplido
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium uppercase tracking-widest text-ink-soft">
                  {formatFecha(hito.fecha)} · {hito.avanceObra} de avance de obra
                </p>
                <div className="mt-3 h-1.5 w-full max-w-xs bg-hairline" aria-hidden>
                  <div
                    className={`h-full ${completed ? 'bg-brand-900 dark:bg-brand-500' : 'bg-brand-500'}`}
                    style={{ width: `${avancePct}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SalidaInversion({ salida }: { salida: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return gsapReveal(ref.current);
  }, []);

  return (
    <div ref={ref} className="mt-16 border-l-2 border-brand-500 py-1 pl-6 md:pl-8">
      <h3 className="text-xl font-light tracking-wide text-ink md:text-2xl">
        Salida y realización del retorno
      </h3>
      <p className="mt-4 max-w-3xl text-lg font-light leading-relaxed text-ink-soft">{salida}</p>
      <ReturnDisclaimer className="mt-6" />
    </div>
  );
}

export default function EstructuraInversion({ investment }: { investment: Investment }) {
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;
    return gsapReveal(headingRef.current);
  }, []);

  return (
    <section className="bg-paper-soft py-20 md:py-28 lg:py-32">
      <Container>
        <div ref={headingRef}>
          <SectionHeading
            kicker="Transparencia"
            title="Estructura de la inversión"
            intro="Cómo se instrumenta jurídicamente la oportunidad, cómo se integran los aportes y cómo se materializa el retorno."
            className="mb-12 md:mb-16"
          />
        </div>

        <FichaEstructura investment={investment} />
        <IntegracionAportes integracion={investment.integracion} />
        <HitosDesembolso hitos={investment.hitosDesembolso} />
        <SalidaInversion salida={investment.salida} />
      </Container>
    </section>
  );
}

/** Skeleton shape-matched de la sección completa (UX-01, cero CLS). */
export function EstructuraInversionSkeleton() {
  return (
    <section aria-hidden className="bg-paper-soft py-20 md:py-28 lg:py-32">
      <Container>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-10 w-3/4 md:w-1/2" />
        <Skeleton className="mt-6 h-4 w-full max-w-xl" />

        <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-8 border border-line bg-paper p-8 sm:grid-cols-2 lg:grid-cols-5 lg:p-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-6 w-32" />
            </div>
          ))}
        </div>

        <div className="mt-16">
          <Skeleton className="h-6 w-72" />
          <Skeleton className="mt-6 h-3 w-full" />
          <div className="mt-8 space-y-6 border-y border-hairline py-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <Skeleton className="h-6 w-80" />
          <div className="mt-10 space-y-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-6 md:gap-10">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="mt-3 h-3 w-48" />
                  <Skeleton className="mt-3 h-1.5 w-full max-w-xs" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 border-l-2 border-hairline py-1 pl-6 md:pl-8">
          <Skeleton className="h-6 w-72" />
          <SkeletonText lines={3} className="mt-4 max-w-3xl" />
        </div>
      </Container>
    </section>
  );
}
