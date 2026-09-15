// Bloque de cierre de la home (CONT-01, CONT-03): datos de contacto + mapa de
// oficinas + formulario. Espeja el ritmo de la referencia, que remata la
// portada con el contacto en vez de mandar al visitante a buscar el menú.
// Reusa los mismos componentes que la página /contacto — un solo formulario,
// una sola validación, un solo texto legal.

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { configRepo, type PageConfig } from '../../data';
import { useNearViewport } from '../../lib/useNearViewport';
import { useParallax } from '../../lib/useParallax';
import { IMAGERY } from '../../lib/siteImagery';
import Container from '../ui/Container';
import { Skeleton, useMinVisible } from '../ui/Skeleton';
import ContactForm from '../contacto/ContactForm';
import DatosContacto, { DatosContactoSkeleton } from '../contacto/DatosContacto';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../ui/InlineEditOverlay';

// Leaflet pesa ~45 kB gzip y vive al final de la portada: cargarlo con el
// bundle inicial de la home penalizaría justo la métrica que el hero no puede
// permitirse. Lazy + Suspense con un placeholder del mismo alto (cero CLS).
const OficinaMapa = lazy(() => import('../contacto/OficinaMapa'));

export default function ContactoStrip() {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinVisible(loading);
  const [mapRef, mapNear] = useNearViewport<HTMLDivElement>();
  const outerRef = useRef<HTMLElement>(null);
  const photoRef = useParallax<HTMLDivElement>({ amount: 16, triggerRef: outerRef });

  const {
    data: sectionData,
    update: updateSection,
    save: handleSave,
    cancel: handleCancel,
  } = useLiveSection({
    kicker: { key: 'contacto.kicker', default: 'Contacto' },
    title: { key: 'contacto.title', default: 'Hablemos de su próximo proyecto' },
    intro: {
      key: 'contacto.intro',
      default:
        'Ya sea que quiera desarrollar, comprar o invertir, un miembro de nuestro equipo se pondrá en contacto a la brevedad.',
    },
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
      sectionId="home-contacto"
      sectionLabel="Contacto y Oficinas"
      onSave={handleSave}
      onCancel={handleCancel}
      pencilPosition="top-8 right-8"
    >
      {(isEditing) => (
        <section
          id="contacto"
          ref={outerRef}
          className="relative overflow-hidden bg-paper py-20 md:py-28 lg:py-32"
        >
          {/* Foto de fondo muy apagada con parallax */}
          <div
            ref={photoRef}
            aria-hidden
            className="absolute -inset-y-[10%] inset-x-0 bg-cover bg-center opacity-[0.14] dark:opacity-[0.10]"
            style={{ backgroundImage: `url(${IMAGERY.contacto})` }}
          />
          <div aria-hidden className="absolute inset-0 bg-paper/80" />
          <Container className="relative z-10">
            <div className="mb-12 md:mb-16">
              <EditableText
                as="p"
                value={sectionData.kicker}
                isEditing={isEditing}
                onChange={(val) => updateSection('kicker', val)}
                className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-brand-500 md:text-sm block"
              />
              <EditableText
                as="h2"
                value={sectionData.title}
                isEditing={isEditing}
                onChange={(val) => updateSection('title', val)}
                className="text-3xl font-light tracking-wide text-ink sm:text-4xl md:text-5xl block"
              />
              <EditableText
                as="p"
                value={sectionData.intro}
                isEditing={isEditing}
                multiline
                onChange={(val) => updateSection('intro', val)}
                className="mt-4 max-w-2xl text-base font-light leading-relaxed text-ink-soft md:text-lg block"
              />
            </div>

            {isEditing && (
              <div className="mb-8 p-4 bg-brand-500/10 border border-brand-500/30 rounded flex items-center justify-between text-xs">
                <span className="text-ink-soft">
                  Para editar teléfonos, WhatsApp, dirección física o coordenadas del mapa:
                </span>
                <Link
                  to="/admin/configuracion"
                  className="inline-flex items-center gap-1.5 font-bold uppercase text-brand-600 hover:text-brand-700"
                >
                  Configuración de Contacto <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <aside className="lg:col-span-2">
            {showSkeleton ? (
              <>
                <DatosContactoSkeleton full={false} />
                <Skeleton className="mt-8 h-[260px] w-full" />
              </>
            ) : loading || !config ? null : (
              <>
                <DatosContacto config={config} full={false} location="home" />
                {/* El chunk de Leaflet se pide recién cuando el bloque se
                    acerca al viewport: si el visitante no baja hasta el
                    contacto, nunca se descarga. */}
                <div ref={mapRef} className="mt-8">
                  {mapNear ? (
                    <Suspense fallback={<Skeleton className="h-[260px] w-full" />}>
                      <OficinaMapa
                        coords={config.officeCoords}
                        address={config.address}
                        legalName={config.legalName}
                        className="h-[260px]"
                      />
                    </Suspense>
                  ) : (
                    <Skeleton className="h-[260px] w-full" />
                  )}
                </div>
              </>
            )}
          </aside>

          <div className="lg:col-span-3">
            {/* idPrefix propio: la home puede montar este formulario mientras el
                usuario navega, y dos formularios con los mismos id romperían la
                asociación label↔input. */}
            <ContactForm location="home" idPrefix="home-contact" compact />
          </div>
        </div>
      </Container>
    </section>
  )}
</EditableSectionWrapper>
  );
}
