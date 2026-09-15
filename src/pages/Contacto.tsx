// Contacto (CONT-01, CONT-03, CONT-04, SEO-02): formulario RHF+zod → leadRepo,
// datos institucionales de configRepo, mapa de oficinas y aviso de privacidad
// Ley 25.326.
// Soporta edición en vivo para administradores.

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { configRepo, type PageConfig } from '../data';
import { usePageMeta } from '../lib/usePageMeta';
import { gsapReveal } from '../lib/gsapReveal';
import { useNearViewport } from '../lib/useNearViewport';
import { useParallax } from '../lib/useParallax';
import { IMAGERY } from '../lib/siteImagery';
import Container from '../components/ui/Container';
import SplitReveal from '../components/ui/SplitReveal';
import { Skeleton, useMinVisible } from '../components/ui/Skeleton';
import ContactForm from '../components/contacto/ContactForm';
import DatosContacto, { DatosContactoSkeleton } from '../components/contacto/DatosContacto';
import { useLiveSection } from '../lib/useLiveSection';
import { EditableSectionWrapper, EditableText, EditableImage } from '../components/ui/InlineEditOverlay';

const OficinaMapa = lazy(() => import('../components/contacto/OficinaMapa'));

export default function Contacto() {
  usePageMeta({
    title: 'Contacto',
    description:
      'Comuníquese con el equipo de Punto Cero Desarrollos. Asesoramiento sobre desarrollos, inversiones y oportunidades inmobiliarias.',
  });

  const [config, setConfig] = useState<PageConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const showSkeleton = useMinVisible(configLoading);
  const revealRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroPhotoRef = useParallax<HTMLDivElement>({ amount: 20, triggerRef: heroRef });
  const [mapRef, mapNear] = useNearViewport<HTMLDivElement>();

  // Hero CMS
  const {
    data: heroData,
    update: updateHero,
    save: handleSaveHero,
    cancel: handleCancelHero,
  } = useLiveSection({
    kicker: { key: 'contacto.hero.kicker', default: 'Contacto' },
    title: { key: 'contacto.hero.title', default: 'Hablemos de su\npróximo proyecto' },
    image: { key: 'contacto.hero.image', default: IMAGERY.oficinas },
  });

  // Content CMS
  const {
    data: contentData,
    update: updateContent,
    save: handleSaveContent,
    cancel: handleCancelContent,
  } = useLiveSection({
    kicker: { key: 'contacto.page.kicker', default: 'Escríbanos' },
    title: { key: 'contacto.page.title', default: 'Estamos para ayudarlo' },
    intro: {
      key: 'contacto.page.intro',
      default:
        'Complete el formulario y un miembro de nuestro equipo se pondrá en contacto a la brevedad.',
    },
    asideTitle: { key: 'contacto.page.aside_title', default: 'Datos de contacto' },
    officesTitle: { key: 'contacto.page.offices_title', default: 'Nuestras oficinas' },
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
        if (alive) setConfigLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!revealRef.current) return;
    return gsapReveal(revealRef.current.children, { stagger: 0.12 });
  }, []);

  return (
    <main>
      <EditableSectionWrapper
        sectionId="contacto-hero"
        sectionLabel="Hero de Contacto"
        onSave={handleSaveHero}
        onCancel={handleCancelHero}
        pencilPosition="top-24 right-8"
      >
        {(isEditing) => (
          <section
            ref={heroRef}
            aria-label="Contacto"
            className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-ink-fixed"
          >
            <div
              ref={heroPhotoRef}
              aria-hidden
              className="absolute -inset-y-[14%] inset-x-0 bg-cover bg-center transition-all duration-700"
              style={{ backgroundImage: `url(${heroData.image || IMAGERY.oficinas})` }}
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/75" />

            {isEditing && (
              <div className="absolute top-24 left-8 z-30 max-w-xs">
                <EditableImage
                  value={heroData.image}
                  onChange={(val) => updateHero('image', val)}
                  isEditing={isEditing}
                  label="Foto de fondo hero"
                />
              </div>
            )}

            <div className="relative z-10 px-4 text-center max-w-4xl mx-auto">
              <EditableText
                as="p"
                value={heroData.kicker}
                isEditing={isEditing}
                onChange={(val) => updateHero('kicker', val)}
                className="mb-5 text-xs font-medium uppercase tracking-[0.4em] text-brand-300 md:text-sm block"
              />
              {isEditing ? (
                <EditableText
                  as="h1"
                  value={heroData.title}
                  isEditing={isEditing}
                  multiline
                  onChange={(val) => updateHero('title', val)}
                  className="hero-legible text-4xl font-light tracking-wider text-white sm:text-5xl md:text-6xl lg:text-7xl block"
                />
              ) : (
                <SplitReveal
                  as="h1"
                  text={heroData.title}
                  immediate
                  className="hero-legible text-4xl font-light tracking-wider text-white sm:text-5xl md:text-6xl lg:text-7xl"
                />
              )}
            </div>
          </section>
        )}
      </EditableSectionWrapper>

      <EditableSectionWrapper
        sectionId="contacto-page-content"
        sectionLabel="Contenido y Oficinas"
        onSave={handleSaveContent}
        onCancel={handleCancelContent}
        pencilPosition="top-8 right-8"
      >
        {(isEditing) => (
          <>
            <div className="py-20 md:py-28">
              <Container>
                <div className="mb-12 md:mb-16">
                  <EditableText
                    as="p"
                    value={contentData.kicker}
                    isEditing={isEditing}
                    onChange={(val) => updateContent('kicker', val)}
                    className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-brand-500 md:text-sm block"
                  />
                  <EditableText
                    as="h2"
                    value={contentData.title}
                    isEditing={isEditing}
                    onChange={(val) => updateContent('title', val)}
                    className="text-3xl font-light tracking-wide text-ink sm:text-4xl md:text-5xl block"
                  />
                  <EditableText
                    as="p"
                    value={contentData.intro}
                    isEditing={isEditing}
                    multiline
                    onChange={(val) => updateContent('intro', val)}
                    className="mt-4 max-w-2xl text-base font-light leading-relaxed text-ink-soft md:text-lg block"
                  />
                </div>

                {isEditing && (
                  <div className="mb-8 p-4 bg-brand-500/10 border border-brand-500/30 rounded flex items-center justify-between text-xs">
                    <span className="text-ink-soft">
                      Para editar teléfonos, WhatsApp, dirección postal o coordenadas del mapa:
                    </span>
                    <Link
                      to="/admin/configuracion"
                      className="inline-flex items-center gap-1.5 font-bold uppercase text-brand-600 hover:text-brand-700"
                    >
                      Configuración de Contacto <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                <div ref={revealRef} className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-5 lg:gap-16">
                  <aside className="lg:col-span-2">
                    <EditableText
                      as="h3"
                      value={contentData.asideTitle}
                      isEditing={isEditing}
                      onChange={(val) => updateContent('asideTitle', val)}
                      className="mb-8 text-xl font-light tracking-wide text-ink md:text-2xl block"
                    />
                    {showSkeleton ? (
                      <DatosContactoSkeleton />
                    ) : configLoading || !config ? null : (
                      <DatosContacto config={config} location="contacto" />
                    )}
                  </aside>

                  <div className="lg:col-span-3">
                    <ContactForm location="contacto" idPrefix="contact" />
                  </div>
                </div>
              </Container>
            </div>

            <section className="bg-paper-soft py-20 md:py-28">
              <Container>
                <EditableText
                  as="h2"
                  value={contentData.officesTitle}
                  isEditing={isEditing}
                  onChange={(val) => updateContent('officesTitle', val)}
                  className="mb-2 text-xl font-light tracking-wide text-ink md:text-2xl block"
                />
                {!configLoading && config && (
                  <p className="mb-8 text-sm font-light text-ink-soft">{config.address}</p>
                )}

                <div ref={mapRef}>
                  {showSkeleton ? (
                    <Skeleton className="h-[320px] w-full md:h-[460px]" />
                  ) : configLoading || !config ? null : mapNear ? (
                    <Suspense fallback={<Skeleton className="h-[320px] w-full md:h-[460px]" />}>
                      <OficinaMapa
                        coords={config.officeCoords}
                        address={config.address}
                        legalName={config.legalName}
                        className="h-[320px] md:h-[460px]"
                      />
                    </Suspense>
                  ) : (
                    <Skeleton className="h-[320px] w-full md:h-[460px]" />
                  )}
                </div>
              </Container>
            </section>
          </>
        )}
      </EditableSectionWrapper>
    </main>
  );
}
