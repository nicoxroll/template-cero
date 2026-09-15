// Hero de IMAGEN fija — el modo por defecto de la portada. El de video (tour)
// solo aparece si el equipo lo habilita en Configuración.
//
// Tratamiento tipográfico tomado de real5.html: título display enorme en
// `mix-blend-difference`, que INVIERTE el color contra la foto. Sobre zonas
// claras se dibuja oscuro y sobre zonas oscuras, claro — nunca hay una parte
// de la palabra que se pierda, que es lo que pasa con texto blanco plano sobre
// una fachada con vidrio, madera y cielo en el mismo cuadro.
//
// Diferencia deliberada con la referencia: AURUM aplica el mismo blend al NAV,
// y ahí "RESIDENCES / ABOUT / PRIVATE OFFICE" queda casi ilegible sobre el
// cielo. Acá el blend es SOLO del título; el header mantiene su velo superior y
// su sombra en capas (ver Header.tsx + .hero-legible).

import { useLayoutEffect, useRef } from 'react';
import { ChevronDown, Upload } from 'lucide-react';
import { gsap } from '../../../lib/gsapReveal';
import { heroReady } from '../../../lib/pageIntro';
import { prefersReducedMotion } from '../../../lib/useReducedMotion';
import { useParallax } from '../../../lib/useParallax';
import Button from '../../ui/Button';
import SplitReveal from '../../ui/SplitReveal';
import { STORY_BEATS } from './beats';
import { STORY_PHOTO_URL } from './frameSource';
import { useLiveSection } from '../../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../../ui/InlineEditOverlay';
import { uploadImage } from '../../../data/storage';

export function StaticHero() {
  const beat = STORY_BEATS[0];
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useParallax<HTMLDivElement>({ amount: 24, triggerRef: sectionRef });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: heroData,
    update: updateHero,
    save: handleSaveHero,
    cancel: handleCancelHero,
  } = useLiveSection({
    kicker: { key: 'hero.kicker', default: beat.kicker },
    title: { key: 'hero.title', default: beat.title },
    line: { key: 'hero.line', default: beat.line },
    ctaPrimary: { key: 'hero.ctaPrimary', default: beat.ctas?.primary.label || 'Ver proyectos' },
    ctaSecondary: { key: 'hero.ctaSecondary', default: beat.ctas?.secondary.label || 'Contactanos' },
    photo: { key: 'hero.photo', default: STORY_PHOTO_URL },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      updateHero('photo', url);
    } catch (err) {
      console.error(err);
    }
  };

  // Kicker, bajada y CTAs entran DESPUÉS del título, que es el que manda la
  // escena. useLayoutEffect + opacidad puesta por GSAP: si el script fallara,
  // el texto queda visible en vez de invisible.
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const tail = el.querySelectorAll<HTMLElement>('[data-tail]');
    if (tail.length === 0) return;

    if (prefersReducedMotion()) {
      gsap.set(tail, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(tail, { opacity: 0, y: 20 });

    let tween: gsap.core.Tween | null = null;
    let cancelled = false;

    // Igual que el título: espera a que el telón empiece a abrirse, si no toda
    // la entrada del hero pasa tapada. Ver src/lib/pageIntro.ts.
    void heroReady.then(() => {
      if (cancelled) return;
      tween = gsap.to(tail, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.14,
        delay: 0.55,
      });
    });

    return () => {
      cancelled = true;
      tween?.kill();
    };
  }, []);

  return (
    <EditableSectionWrapper
      sectionId="home-hero"
      sectionLabel="Hero Principal"
      onSave={handleSaveHero}
      onCancel={handleCancelHero}
      pencilPosition="top-24 right-8"
    >
      {(isEditing) => (
        <section
          ref={sectionRef}
          aria-label="Todo comienza en Punto Cero"
          className="relative h-screen w-full overflow-hidden bg-ink-fixed"
        >
          {/* Input oculto para cambiar foto del hero */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          {isEditing && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="focus-ring absolute top-6 left-6 z-40 flex items-center gap-2 bg-ink-fixed/90 text-white border border-brand-400/70 px-4 py-2 rounded text-xs uppercase tracking-wider hover:bg-brand-500 hover:text-white transition-all cursor-pointer shadow-xl font-mono"
            >
              <Upload className="w-3.5 h-3.5" /> Cambiar Imagen de Fondo
            </button>
          )}

          {/* -inset-y-[14%]: la capa es más alta que el hero para que el recorrido
              del parallax no descubra el fondo por arriba ni por abajo. */}
          <div
            ref={photoRef}
            className="absolute -inset-y-[14%] inset-x-0 bg-cover bg-center transition-all duration-500"
            style={{ backgroundImage: `url(${heroData.photo})` }}
          />
          {/* Velo suave y no el gradiente fuerte de antes: el título ya se defiende
              solo con el blend, y apagar la foto era desperdiciarla. Alcanza para
              que la bajada y los CTAs —que no llevan blend— pasen contraste. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/65"
          />

          {/* Sin z-index ni transform en este contenedor: cualquiera de los dos
              crearía un contexto de apilamiento que AÍSLA el mix-blend-difference
              del título y lo dejaría sin nada contra qué invertir. */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <EditableText
              as="p"
              value={heroData.kicker}
              isEditing={isEditing}
              onChange={(val) => updateHero('kicker', val)}
              className="hero-legible mb-6 text-[0.65rem] font-medium uppercase tracking-[0.5em] text-white/90 md:text-xs"
            />

            {/* El blend va en un wrapper propio: aplicarlo al <h1> junto con las
                máscaras de SplitReveal mezclaba las dos cosas y el resultado era
                impredecible entre navegadores. */}
            <div className="mix-blend-difference">
              {isEditing ? (
                <EditableText
                  as="h1"
                  value={heroData.title}
                  isEditing={isEditing}
                  onChange={(val) => updateHero('title', val)}
                  className="text-[clamp(3rem,14vw,13rem)] font-light uppercase leading-[0.92] tracking-[-0.03em] text-white block"
                />
              ) : (
                <SplitReveal
                  as="h1"
                  text={heroData.title}
                  immediate
                  delay={0.15}
                  className="text-[clamp(3rem,14vw,13rem)] font-light uppercase leading-[0.92] tracking-[-0.03em] text-white"
                />
              )}
            </div>

            <EditableText
              as="p"
              value={heroData.line}
              isEditing={isEditing}
              multiline
              onChange={(val) => updateHero('line', val)}
              className="hero-legible mt-8 max-w-2xl text-base font-light leading-relaxed tracking-wide text-white/90 md:text-lg"
            />

            {isEditing ? (
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2 bg-black/80 border border-brand-500/60 px-3.5 py-2 rounded">
                  <span className="text-brand-300 font-bold uppercase text-[10px]">Botón 1:</span>
                  <EditableText
                    value={heroData.ctaPrimary}
                    isEditing={isEditing}
                    onChange={(val) => updateHero('ctaPrimary', val)}
                    className="text-white font-sans"
                  />
                </div>
                <div className="flex items-center gap-2 bg-black/80 border border-brand-500/60 px-3.5 py-2 rounded">
                  <span className="text-brand-300 font-bold uppercase text-[10px]">Botón 2:</span>
                  <EditableText
                    value={heroData.ctaSecondary}
                    isEditing={isEditing}
                    onChange={(val) => updateHero('ctaSecondary', val)}
                    className="text-white font-sans"
                  />
                </div>
              </div>
            ) : (
              beat.ctas && (
                <div
                  data-tail
                  className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
                >
                  <Button to={beat.ctas.primary.to} variant="primary">
                    {heroData.ctaPrimary}
                  </Button>
                  <Button to={beat.ctas.secondary.to} variant="outline" dark>
                    {heroData.ctaSecondary}
                  </Button>
                </div>
              )
            )}
          </div>

          <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce md:bottom-12">
            <ChevronDown
              className="h-9 w-9 text-white/70 drop-shadow-[0_2px_8px_rgba(0,0,0,.6)]"
              strokeWidth={1}
              aria-hidden
            />
          </div>
        </section>
      )}
    </EditableSectionWrapper>
  );
}

export default StaticHero;
