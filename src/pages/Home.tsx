// Home — UNA sola composición de portada. El modo (src/lib/skin.ts) cambia
// ÚNICAMENTE el hero: foto fija (el default) o el tour en video scrubeado por
// scroll, que el visitante activa desde el toggle del encabezado.
// Todo lo que va debajo es idéntico en ambos modos, y sigue el ritmo de la
// referencia realstack adaptado al negocio: hero → proyectos destacados →
// quiénes somos → servicios → oportunidades de inversión → newsletter →
// contacto → footer.
//
// Los skins de portada completa que existieron antes (Aker, ver DESIGN-AKER.md;
// Ciridae, ver DESIGN-CIRIDAE.md) quedan archivados: su código sigue vivo en
// src/components/home/aker/ y src/components/home/ciridae/ pero ya no se
// expone desde ninguna ruta.

import { lazy, Suspense, useEffect } from 'react';
import { usePageMeta } from '../lib/usePageMeta';
import { useSkin, MODE_CHANGE_EVENT } from '../lib/SkinContext';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useHeroScrubEnabled } from '../lib/useHeroScrubEnabled';
import { ScrollTrigger } from '../lib/gsapReveal';

import { StaticHero } from '../components/home/story/StaticHero';
import FeaturedProjectsStrip from '../components/home/FeaturedProjectsStrip';
import QuienesSomosSection from '../components/home/QuienesSomosSection';
import AlianzasStrip from '../components/home/AlianzasStrip';
import ServiciosSection from '../components/home/ServiciosSection';
import CustomSectionsStrip from '../components/home/CustomSectionsStrip';
import InversionesStrip from '../components/home/InversionesStrip';
import ContactoStrip from '../components/home/ContactoStrip';
import NewsletterSignup from '../components/inversiones/NewsletterSignup';
import { siteConfig } from '../config/site';

// El stage de scrub (canvas + timeline + 191 cuadros WebP) se carga lazy: solo
// paga su costo quien ve el hero de video. Es el único chunk diferido de la
// home — el resto de las secciones son las mismas en ambos modos.
const ScrubStage = lazy(() => import('../components/home/story/ScrubStage'));

/** Placeholder shape-matched del hero (alto de viewport, fondo oscuro FIJO) —
 * cero CLS mientras carga el chunk. bg-ink-fixed y no bg-ink: `ink` es el rol
 * de TEXTO y flippea con el tema, así que como fondo quedaba casi blanco en
 * tema oscuro (justo el primer frame de toda visita nueva).
 *
 * Las barras no usan <Skeleton>: ese componente pinta bg-paper-soft, que en
 * tema oscuro es casi negro sobre este fondo casi negro — con opacity-20
 * encima, la pantalla quedaba en negro liso sin ninguna señal de carga. Van
 * en blanco translúcido, que se lee sobre cualquier tema. */
function HeroPlaceholder() {
  const bar = 'relative overflow-hidden rounded-sm bg-white/10';
  return (
    <section className="relative h-screen w-full bg-ink-fixed" aria-hidden>
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
        <div className={`${bar} h-4 w-56`} />
        <div className={`${bar} h-12 w-full max-w-xl md:h-16`} />
        <div className={`${bar} h-12 w-4/5 max-w-lg md:h-16`} />
        <div className={`${bar} h-5 w-full max-w-2xl`} />
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta({
    title: siteConfig.tagline,
    description: siteConfig.description,
  });

  const { isVideo } = useSkin();
  const reduced = useReducedMotion();

  // El interruptor del panel (Configuración → "Hero de video") apaga el modo
  // cinemático para TODO el sitio.
  const scrubEnabled = useHeroScrubEnabled();

  // reduced-motion es el otro override duro sobre la elección del usuario: el
  // hero de video hace pin + scroll hijack de ~3 alturas de viewport, que es
  // exactamente lo que la preferencia pide evitar. La heurística de dispositivo
  // ya no degrada acá — vive en getCurrentMode() y solo elige el default de la
  // primera visita, para que el toggle mande siempre una vez que el usuario opina.
  const scrub = isVideo && !reduced && scrubEnabled;

  // Al alternar el hero cambia el alto total del documento (el pin inserta
  // ~300vh de spacer). ScrubStage refresca al montar y al desmontar, pero este
  // listener cubre el caso de que el cambio no pase por su ciclo de vida
  // (p. ej. reduced-motion activo, donde nunca llega a montarse).
  useEffect(() => {
    const onModeChange = () => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    window.addEventListener(MODE_CHANGE_EVENT, onModeChange);
    return () => window.removeEventListener(MODE_CHANGE_EVENT, onModeChange);
  }, []);

  return (
    <>
      {scrub ? (
        <Suspense fallback={<HeroPlaceholder />}>
          <ScrubStage />
        </Suspense>
      ) : (
        <StaticHero />
      )}
      {siteConfig.features.enableShowcase && <FeaturedProjectsStrip />}
      <QuienesSomosSection />
      <AlianzasStrip />
      <ServiciosSection />
      {siteConfig.features.enableCustomSections && <CustomSectionsStrip />}
      {siteConfig.features.enableOfferings && <InversionesStrip />}
      {siteConfig.features.enableNewsletter && <NewsletterSignup location="home" />}
      <ContactoStrip />
    </>
  );
}
