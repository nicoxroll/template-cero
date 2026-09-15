// Servicios (SERV-01): los servicios como una PILA de tarjetas sticky — el
// efecto de real5.html § card stack.
//
// Cómo funciona: cada tarjeta es `position: sticky` a la misma altura, así que
// al scrollear se van apilando una sobre otra sin JavaScript. GSAP solo agrega
// la parte que el CSS no puede: encoger y apagar la tarjeta de abajo a medida
// que la siguiente la cubre, para que se lea como un mazo con profundidad y no
// como pantallas sueltas.
//
// El sticky hace el trabajo pesado: si GSAP no carga o el navegador ignora el
// scrub, las tarjetas siguen apilándose igual. Con prefers-reduced-motion se
// desactiva la pila entera y quedan en grilla, porque apilar con scroll ES el
// movimiento que esa preferencia pide evitar.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink, Eye, EyeOff } from 'lucide-react';
import { serviceRepo, type Service } from '../../data';
import { gsap, gsapReveal, ScrollTrigger, REVEAL } from '../../lib/gsapReveal';
import { useReducedMotion } from '../../lib/useReducedMotion';
import Container from '../ui/Container';
import { Skeleton, useMinVisible, Photo } from '../ui/Skeleton';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText, EditableImage } from '../ui/InlineEditOverlay';

function ServicesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-line bg-paper">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="space-y-3 p-8">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Una tarjeta del mazo: contenido a la izquierda, foto a la derecha, como en
 * la referencia. En mobile la foto va arriba y el texto abajo. */
function ServiceCard({
  service,
  index,
  total,
  isEditing,
  onUpdate,
}: {
  service: Service;
  index: number;
  total: number;
  isEditing?: boolean;
  onUpdate?: (updated: Partial<Service>) => void;
}) {
  return (
    <div className="stack-card sticky top-[10vh] mb-[6vh] flex h-[78vh] min-h-[500px] md:top-[12vh] md:h-[72vh] md:min-h-[440px] items-center justify-center">
      <article className="stack-card-inner relative grid h-full w-full overflow-hidden border border-white/10 bg-ink-fixed text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] md:grid-cols-[1fr_1.15fr]">
        <div className="flex flex-col justify-between p-7 md:p-10 lg:p-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-brand-400">
                0{index + 1} / 0{total}
              </span>
              <span className="h-px w-8 bg-brand-500/40" />
            </div>

            <EditableText
              as="h3"
              value={service.title}
              isEditing={Boolean(isEditing)}
              onChange={(val) => onUpdate?.({ title: val })}
              className="mt-6 text-2xl font-light tracking-wide md:text-3xl lg:text-4xl block text-white"
            />

            <EditableText
              as="p"
              value={service.description}
              isEditing={Boolean(isEditing)}
              multiline
              onChange={(val) => onUpdate?.({ description: val })}
              className="mt-4 text-sm font-light leading-relaxed text-white/70 md:text-base block"
            />
          </div>

          <div className="pt-6">
            <Link
              to="/contacto"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-300 transition-colors hover:text-white"
            >
              Consultar por este servicio
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="relative min-h-[220px] overflow-hidden bg-black/40 md:min-h-0">
          <EditableImage
            src={service.image}
            alt={service.title}
            isEditing={Boolean(isEditing)}
            onChange={(url) => onUpdate?.({ image: url })}
            label="Foto del servicio"
            className="h-full w-full object-cover"
          />
          <div
            className="stack-card-scrim pointer-events-none absolute inset-0 bg-black opacity-0"
            aria-hidden
          />
        </div>
      </article>
    </div>
  );
}

export default function ServiciosSection() {
  const [services, setServices] = useState<Service[] | null>(null);
  const loading = services === null;
  const showSkeleton = useMinVisible(loading);
  const stackRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const {
    data: sectionData,
    update: updateSection,
    save: saveSectionCMS,
  } = useLiveSection({
    kicker: { key: 'servicios.kicker', default: 'Servicios' },
    title: { key: 'servicios.title', default: 'Soluciones integrales' },
    intro: {
      key: 'servicios.intro',
      default:
        'Cuatro frentes que cubren el ciclo completo del desarrollo inmobiliario: de la idea a la entrega, y de la inversión al retorno.',
    },
    sectionVisible: { key: 'servicios.visible', default: 'true' },
  });

  const isVisible = sectionData.sectionVisible !== 'false';

  useEffect(() => {
    let alive = true;
    serviceRepo
      .list()
      .then((items) => {
        if (alive) setServices(items);
      })
      .catch(() => {
        if (alive) setServices([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleServiceUpdate = (id: string, updated: Partial<Service>) => {
    setServices((prev) =>
      prev ? prev.map((s) => (s.id === id ? { ...s, ...updated } : s)) : prev,
    );
  };

  const handleSave = async () => {
    await saveSectionCMS();
    if (services) {
      await Promise.all(
        services.map((s) =>
          serviceRepo.update(s.id, {
            title: s.title,
            description: s.description,
            image: s.image,
          }),
        ),
      );
    }
  };

  // Encoger + apagar cada tarjeta cuando la siguiente la tapa.
  useEffect(() => {
    if (loading || reduced || !stackRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.stack-card');
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const tl = gsap.timeline({
          scrollTrigger: { trigger: next, start: 'top 75%', end: 'top 12vh', scrub: true },
        });
        tl.to(card.querySelector('.stack-card-inner'), { scale: 0.94, ease: 'none' }, 0);
        tl.to(card.querySelector('.stack-card-scrim'), { opacity: 0.72, ease: 'none' }, 0);
      });
    }, stackRef);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [loading, reduced, services]);

  // Modo reducido: grilla clásica con el reveal estándar.
  useEffect(() => {
    if (loading || !reduced || !gridRef.current) return;
    return gsapReveal(Array.from(gridRef.current.children), { stagger: REVEAL.stagger });
  }, [loading, reduced]);

  return (
    <EditableSectionWrapper
      sectionId="home-servicios"
      sectionLabel="Servicios"
      onSave={handleSave}
      pencilPosition="top-8 right-8"
    >
      {(isEditing) => {
        if (!isVisible && !isEditing) return null;
        return (
          <section id="servicios" className="bg-paper py-20 md:py-28 lg:py-32">
            <Container>
              {isEditing && (
                <div className="mb-8 p-4 bg-brand-500/10 border border-brand-500/30 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    {isVisible ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <Eye className="w-4 h-4" /> La sección está <strong>visible</strong> para los visitantes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                        <EyeOff className="w-4 h-4" /> La sección está <strong>oculta</strong> para los visitantes
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateSection('sectionVisible', isVisible ? 'false' : 'true')}
                      className={`px-3 py-1.5 font-medium tracking-wide uppercase transition-colors rounded ${
                        isVisible
                          ? 'bg-paper hover:bg-paper-soft text-ink border border-line'
                          : 'bg-brand-900 hover:bg-brand-700 text-white'
                      }`}
                    >
                      {isVisible ? 'Ocultar sección' : 'Hacer visible'}
                    </button>
                    <Link
                      to="/admin/contenido"
                      className="inline-flex items-center gap-1.5 font-bold uppercase text-brand-600 hover:text-brand-700"
                    >
                      Gestionar en Panel <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
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
                  Podés editar los títulos, descripciones y fotos directamente en cada tarjeta de servicio abajo.
                </span>
                <Link
                  to="/admin/contenido"
                  className="inline-flex items-center gap-1.5 font-bold uppercase text-brand-600 hover:text-brand-700"
                >
                  Gestionar Servicios en Panel <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </Container>

          {showSkeleton ? (
            <Container>
              <ServicesSkeleton />
            </Container>
          ) : loading ? null : reduced ? (
            <Container>
              <div ref={gridRef} className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                {services.map((service) => (
                  <article
                    key={service.id}
                    className="group overflow-hidden border border-line bg-paper transition-all duration-500 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-xl"
                  >
                    <div className="aspect-[16/10] w-full relative">
                      {isEditing ? (
                        <EditableImage
                          src={service.image}
                          isEditing={isEditing}
                          onUrlChange={(newUrl) => handleServiceUpdate(service.id, { image: newUrl })}
                          alt={service.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Photo
                          src={service.image}
                          alt={service.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-8">
                      <EditableText
                        as="h3"
                        value={service.title}
                        isEditing={isEditing}
                        onChange={(val) => handleServiceUpdate(service.id, { title: val })}
                        className="text-xl font-light tracking-wide text-ink block"
                      />
                      <div className="pt-3">
                        <EditableText
                          as="p"
                          value={service.description}
                          isEditing={isEditing}
                          multiline
                          onChange={(val) => handleServiceUpdate(service.id, { description: val })}
                          className="text-sm font-light leading-relaxed text-ink-soft block"
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Container>
          ) : (
            <div ref={stackRef} className="mx-auto w-full max-w-6xl px-4 pb-[8vh] sm:px-6 lg:px-8">
              {services.map((service, i) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={i}
                  total={services.length}
                  isEditing={isEditing}
                  onUpdate={(upd) => handleServiceUpdate(service.id, upd)}
                />
              ))}
            </div>
          )}
        </section>
        );
      }}
    </EditableSectionWrapper>
  );
}
