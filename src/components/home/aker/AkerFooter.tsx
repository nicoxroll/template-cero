// Footer full sitemap — mapeado del footer real de Aker: banda casi negra,
// columnas de links, hairlines, wordmark monumental de cierre y línea de
// copyright chica. Reemplaza (solo en skin Aker, solo en Home) al <Footer/>
// global de brand-900 — ver el condicional en App.tsx (PublicLayout).

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { configRepo, type PageConfig } from '../../../data';
import { Skeleton, useMinVisible } from '../../ui/Skeleton';
import { AkerContainer } from './AkerPrimitives';

const COLUMNS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: 'Inicio',
    links: [
      { label: 'Quiénes somos', to: '/#quienes-somos' },
      { label: 'Servicios', to: '/#servicios' },
    ],
  },
  {
    heading: 'Proyectos',
    links: [
      { label: 'Ver proyectos', to: '/proyectos' },
      { label: 'Dónde desarrollamos', to: '/proyectos' },
    ],
  },
  {
    heading: 'Inversiones',
    links: [
      { label: 'Panel de inversiones', to: '/inversiones' },
      { label: 'Qué buscamos', to: '/inversiones' },
    ],
  },
  {
    heading: 'Contacto',
    links: [
      { label: 'Escribinos', to: '/contacto' },
      { label: 'Nuestro equipo', to: '/#equipo' },
    ],
  },
];

function ContactRowSkeleton() {
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-2">
      <Skeleton className="h-3 w-40 bg-white/10 before:via-white/15" />
      <Skeleton className="h-3 w-52 bg-white/10 before:via-white/15" />
    </div>
  );
}

function LegalRowSkeleton() {
  return (
    <div className="max-w-3xl space-y-2">
      <Skeleton className="h-3 w-64 bg-white/10 before:via-white/15" />
      <Skeleton className="h-3 w-full bg-white/10 before:via-white/15" />
      <Skeleton className="h-3 w-5/6 bg-white/10 before:via-white/15" />
    </div>
  );
}

export default function AkerFooter() {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const loading = config === null;
  const showSkeleton = useMinVisible(loading);

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

  return (
    <footer className="bg-aker-char pt-20">
      <AkerContainer>
        {/* Columnas de navegación */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 border-b border-white/10 pb-12 sm:grid-cols-4 md:pb-16">
          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              {/* Section Label del sistema: 12px, ls 0.12px, Smoke. */}
              <p className="mb-4 text-[12px] font-normal tracking-[0.12px] text-aker-smoke uppercase">
                {col.heading}
              </p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-[15px] font-normal text-aker-paper/70 transition-colors duration-300 hover:text-brand-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Datos de contacto reales (configRepo) */}
        <div className="border-b border-white/10 py-8">
          {showSkeleton ? (
            <ContactRowSkeleton />
          ) : loading || !config ? null : (
            <div className="flex flex-wrap gap-x-10 gap-y-2 text-[15px] text-aker-paper/60">
              <a href={`mailto:${config.contactEmail}`} className="transition-colors duration-300 hover:text-aker-paper">
                {config.contactEmail}
              </a>
              <a
                href={`tel:${config.contactPhone.replace(/[^\d+]/g, '')}`}
                className="transition-colors duration-300 hover:text-aker-paper"
              >
                {config.contactPhone}
              </a>
              <span>{config.address}</span>
            </div>
          )}
        </div>

        {/* Bloque societario y disclaimers (BLOCKER 3) */}
        <div className="border-b border-white/10 py-8">
          {showSkeleton ? (
            <LegalRowSkeleton />
          ) : loading || !config ? null : (
            <div className="max-w-3xl space-y-2 text-[12px] leading-relaxed text-aker-paper/40">
              <p>
                {config.legalName} — CUIT {config.cuit} — {config.matricula}
              </p>
              <p>{config.domicilioLegal}</p>
              <p>{config.disclaimers.ofertaPublica}</p>
              <p>{config.disclaimers.datosPersonales}</p>
            </div>
          )}
        </div>

        {/* Wordmark monumental de cierre — escala display del sistema:
            clamp(64px,13vw,168px), lh 0.8, ls -0.025em, w300. */}
        <div className="py-10 md:py-14">
          <p className="text-[clamp(64px,13vw,168px)] leading-[0.8] font-light tracking-[-0.025em] whitespace-nowrap text-aker-paper">
            Punto Cero
          </p>
        </div>
      </AkerContainer>

      {/* Hairline + línea legal/copyright */}
      <div className="border-t border-white/10 px-6 py-5 lg:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-10 gap-y-2 text-[12px] text-aker-paper/40">
          <p>PC © {new Date().getFullYear()}</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <span>Protección de datos personales — Ley 25.326</span>
            <Link to="/contacto" className="transition-colors duration-300 hover:text-aker-paper">
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
