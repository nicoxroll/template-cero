// Footer (CONT-03). Composición a pantalla completa, centrada, con la foto a
// sangre — la forma de real5.html § footer.
// Soporta edición en vivo para administradores.

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { configRepo, type PageConfig } from '../../data';
import { IMAGERY } from '../../lib/siteImagery';
import LogoMark from '../ui/LogoMark';
import SplitReveal from '../ui/SplitReveal';
import { Skeleton, useMinVisible } from '../ui/Skeleton';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText, EditableImage } from '../ui/InlineEditOverlay';
import { siteConfig } from '../../config/site';

const NAV_ITEMS = siteConfig.navigation.map((item) => ({
  label: item.label,
  to: item.href,
}));

export default function Footer() {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinVisible(loading);

  const {
    data: footerData,
    update: updateFooter,
    save: handleSave,
    cancel: handleCancel,
  } = useLiveSection({
    kicker: { key: 'footer.kicker', default: 'Su próximo proyecto empieza acá' },
    cta: { key: 'footer.cta', default: 'Contactanos' },
    image: { key: 'footer.image', default: IMAGERY.footer },
  });

  useEffect(() => {
    let alive = true;
    configRepo
      .get()
      .then((c) => {
        if (alive) setConfig(c);
      })
      .catch(() => {
        if (alive) setConfig(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <EditableSectionWrapper
      sectionId="site-footer"
      sectionLabel="Pie de Página (Footer)"
      onSave={handleSave}
      onCancel={handleCancel}
      pencilPosition="top-8 right-8"
    >
      {(isEditing) => (
        <footer className="relative flex min-h-screen w-full flex-col overflow-hidden border-t border-white/15 bg-brand-900 text-white">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{ backgroundImage: `url(${footerData.image})` }}
          />
          {/* Overlay verde oscuro para garantizar legibilidad */}
          <div aria-hidden className="absolute inset-0 bg-brand-900/90" />

          {isEditing && (
            <div className="absolute top-4 left-4 z-20">
              <EditableImage
                value={footerData.image}
                onChange={(val) => updateFooter('image', val)}
                isEditing={isEditing}
                label="Foto de fondo footer"
              />
            </div>
          )}

          {/* Bloque central */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
            <LogoMark tone="current" className="mb-8 h-12 w-auto text-brand-300" />

            <EditableText
              as="p"
              value={footerData.kicker}
              isEditing={isEditing}
              onChange={(val) => updateFooter('kicker', val)}
              className="mb-5 text-[0.65rem] font-medium uppercase tracking-[0.5em] text-white/70 md:text-xs block"
            />

            {isEditing ? (
              <EditableText
                as="h2"
                value={footerData.cta}
                isEditing={isEditing}
                onChange={(val) => updateFooter('cta', val)}
                className="text-[clamp(2.25rem,9vw,7.5rem)] font-light uppercase leading-[0.95] tracking-[-0.02em] text-white block"
              />
            ) : (
              <Link to="/contacto" className="focus-ring group block">
                <SplitReveal
                  text={footerData.cta}
                  className="text-[clamp(2.25rem,9vw,7.5rem)] font-light uppercase leading-[0.95] tracking-[-0.02em] text-white transition-colors duration-500 group-hover:text-brand-300"
                />
              </Link>
            )}

            <nav
              aria-label="Navegación del pie de página"
              className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="focus-ring text-xs font-medium uppercase tracking-widest text-white/65 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {isEditing && (
              <div className="mt-8 p-3 bg-white/10 border border-white/20 rounded flex items-center gap-4 text-xs">
                <span className="text-white/80">
                  Para editar datos de contacto institucional o disclaimers legales:
                </span>
                <Link
                  to="/admin/configuracion"
                  className="inline-flex items-center gap-1 font-bold uppercase text-brand-300 hover:text-white"
                >
                  Configuración <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {showSkeleton ? (
              <div className="mt-10 flex gap-6">
                <Skeleton className="h-4 w-40 bg-white/10 before:via-white/20" />
                <Skeleton className="h-4 w-56 bg-white/10 before:via-white/20" />
              </div>
            ) : loading || !config ? null : (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-light text-white/75">
                <a
                  href={`tel:${config.contactPhone.replace(/[^\d+]/g, '')}`}
                  className="focus-ring transition-colors hover:text-white"
                >
                  {config.contactPhone}
                </a>
                <a
                  href={`mailto:${config.contactEmail}`}
                  className="focus-ring transition-colors hover:text-white"
                >
                  {config.contactEmail}
                </a>
                <span>{config.address}</span>
              </div>
            )}
          </div>

          {/* Pie legal */}
          <div className="relative z-10 border-t border-white/10 px-4 py-6">
            <div className="mx-auto max-w-5xl space-y-1.5 text-center">
              {loading || !config ? null : (
                <>
                  <p className="text-[0.7rem] font-light leading-relaxed text-white/70">
                    {config.legalName} — CUIT {config.cuit} — {config.matricula} ·{' '}
                    {config.domicilioLegal}
                  </p>
                  <p className="text-[0.68rem] font-light leading-relaxed text-white/60">
                    {config.disclaimers.ofertaPublica}
                  </p>
                  <p className="text-[0.68rem] font-light leading-relaxed text-white/60">
                    {config.disclaimers.datosPersonales}
                  </p>
                </>
              )}
              <p className="pt-1 text-[0.7rem] font-light tracking-wide text-white/70">
                © {new Date().getFullYear()} {config?.legalName || siteConfig.name}. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      )}
    </EditableSectionWrapper>
  );
}
