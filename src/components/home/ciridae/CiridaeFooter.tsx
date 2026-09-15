// Footer (DESIGN-CIRIDAE.md § Footer): Void Black, condensada 14px caps,
// filas simples, sin adornos. Mismos datos legales que el footer global
// (Footer.tsx) vía configRepo — el sistema respeta el vacío.

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { configRepo, type PageConfig } from '../../../data';
import { Hairline } from './CiridaePrimitives';
import { Skeleton } from '../../ui/Skeleton';

const NAV_ITEMS = [
  { label: 'Inicio', to: '/' },
  { label: 'Quiénes somos', to: '/#quienes-somos' },
  { label: 'Servicios', to: '/#servicios' },
  { label: 'Proyectos', to: '/proyectos' },
  { label: 'Inversiones', to: '/inversiones' },
  { label: 'Contacto', to: '/contacto' },
];

export default function CiridaeFooter() {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <footer className="bg-cir-void">
      <Hairline />
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div className="font-cir-cond uppercase leading-tight tracking-[-0.02em] text-cir-white">
            Punto Cero
            <span className="mt-1 block text-cir-body tracking-[0.2em] text-brand-500">
              Desarrollos
            </span>
          </div>

          <nav aria-label="Navegación del pie de página">
            <ul className="space-y-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="font-cir-cond text-cir-body uppercase tracking-[-0.02em] text-cir-white/70 transition-colors hover:text-cir-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="font-cir-cond text-cir-body uppercase tracking-[-0.02em] text-cir-white/50">
            {loading || !config ? (
              <Skeleton className="h-4 w-40 bg-cir-white/10 before:via-cir-white/20" />
            ) : (
              <>
                <p>
                  <a href={`mailto:${config.contactEmail}`} className="hover:text-cir-white">
                    {config.contactEmail}
                  </a>
                </p>
                <p className="mt-2">
                  <a href={`tel:${config.contactPhone.replace(/[^\d+]/g, '')}`} className="hover:text-cir-white">
                    {config.contactPhone}
                  </a>
                </p>
              </>
            )}
          </div>
        </div>

        <Hairline className="my-10" />

        {loading || !config ? (
          <Skeleton className="h-3 w-full max-w-2xl bg-cir-white/10 before:via-cir-white/20" />
        ) : (
          <div className="space-y-2">
            <p className="font-cir-cond text-cir-caption uppercase tracking-[-0.02em] text-cir-white/40">
              {config.legalName} — CUIT {config.cuit} — {config.matricula}
              <br />
              {config.domicilioLegal}
            </p>
            <p className="font-cir-body text-[11px] leading-relaxed text-cir-white/35">
              {config.disclaimers.ofertaPublica}
            </p>
            <p className="font-cir-body text-[11px] leading-relaxed text-cir-white/35">
              {config.disclaimers.datosPersonales}
            </p>
            <p className="font-cir-cond text-cir-caption uppercase tracking-[-0.02em] text-cir-white/40">
              © {new Date().getFullYear()} Punto Cero Desarrollos
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
