// Escenario pinned del hero scroll-scrub — MODO TOUR (HERO-01/02/04).
// Único lugar del sitio que instala un ScrollTrigger con pin (regla DESIGN.md).
// Fondo = el video real del cliente (191 cuadros WebP, createVideoFrameSource)
// dibujado a pantalla completa en canvas como CONTENIDO PRINCIPAL — no una capa
// sutil sobre una foto. El scroll cuantiza el índice de cuadro (coalescido en
// rAF junto con el overlay de legibilidad) y sincroniza los tres beats de
// texto. Todo el trabajo por-frame ocurre solo mientras el ScrollTrigger está
// en rango (onUpdate no dispara fuera de él).

import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { gsap, ScrollTrigger } from '../../../lib/gsapReveal';
import Button from '../../ui/Button';
import { createVideoFrameSource, videoLegibilityOverlay } from './frameSource';
import { STORY_BEATS } from './beats';

/**
 * Duración del pin: ~2 alturas de viewport de scroll.
 *
 * Era 300%. Con 191 cuadros repartidos en 3 pantallas, cada cuadro ocupaba
 * ~1,6% del recorrido: el tour se sentía lento y había que scrollear mucho
 * para que la cámara avanzara. A 200% el mismo video pasa en dos tercios del
 * scroll y además cambia de cuadro más seguido por píxel recorrido, que es lo
 * que se percibe como fluidez — no hay cuadros "pegados" mientras la rueda gira.
 */
const PIN_LENGTH = '+=200%';
/** Duración de cada fade de beat en unidades de progreso del timeline (0..1) */
const FADE = 0.07;
/** Debajo de este ancho, el video se carga salteando un cuadro de cada dos (memoria). */
const MOBILE_STRIDE_BREAKPOINT = 768;

/** Sombra en capas legible sobre imagen clara (paredes blancas, cielo) — nunca contorno duro. */
// El video tiene cuadros MUY claros (paredes blancas, cielo, interiores con sol).
// Sombra en tres capas: halo amplio que separa del fondo + dos capas cortas que
// densifican el borde de la letra. Sin contorno duro — se lee premium, no stroke.
// La receta vive como @utility en src/index.css (.hero-legible) porque el
// Header la necesita también, apoyado sobre los mismos cuadros claros.
const TEXT_SHADOW = 'hero-legible';

export default function ScrubStage() {
  const stageRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  // useLayoutEffect (no useEffect): el cleanup debe correr SÍNCRONO en la fase
  // de mutación del unmount — gsapCtx.revert() saca el pin-spacer y devuelve el
  // <section> a su padre original ANTES del removeChild de React. Con useEffect
  // (cleanup pasivo/diferido) React intenta remover el nodo mientras sigue
  // reparentado dentro del pin-spacer → NotFoundError: removeChild.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const overlay = overlayRef.current;
    const canvas = canvasRef.current;
    if (!stage || !overlay || !canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const stride = window.innerWidth < MOBILE_STRIDE_BREAKPOINT ? 2 : 1;

    let cssW = 0;
    let cssH = 0;
    let pendingP = 0; // progreso continuo 0..1 — maneja el overlay de legibilidad
    let pendingFrame = 0; // índice cuantizado — maneja el cuadro de video dibujado
    let drawnFrame = -1;
    let rafId = 0;

    // Coalescencia en rAF: por frame de pantalla se aplica el overlay y se
    // redibuja el cuadro de video a lo sumo una vez — sin jank en scroll
    // rápido. El canvas solo redibuja si el índice cuantizado cambió.
    // drawnFrame solo se marca cuando drawFrame() pintó un cuadro REAL: en
    // carga fría (skin 'tour' precargado, sin scroll todavía) el primer
    // intento puede caer antes de que f001 termine de decodificar y pinta
    // solo el flat-fill — si igual marcáramos drawnFrame acá, el canvas
    // quedaría en ese relleno plano para siempre (nada vuelve a pedir un
    // redibujo hasta el próximo cambio de pendingFrame, que sin scroll no
    // llega nunca). onFrameLoaded (abajo) reintenta apenas carga cualquier
    // cuadro, así que dejar drawnFrame sin marcar es lo que fuerza ese reintento.
    const scheduleDraw = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        overlay.style.background = videoLegibilityOverlay(pendingP);
        if (pendingFrame !== drawnFrame) {
          const drew = videoSource.drawFrame(ctx2d, pendingFrame, cssW, cssH);
          if (drew) drawnFrame = pendingFrame;
        }
      });
    };

    // onFrameLoaded dispara scheduleDraw() cuando termina de cargar CUALQUIER
    // cuadro — cubre el arranque en frío (mount sin scroll aún) donde el
    // primer scheduleDraw() de resize() corre antes de que f001 haya
    // decodificado.
    // lookahead 20 (default 10): al acortar el pin a 200% el índice de cuadro
    // avanza ~1,5× más rápido por píxel scrolleado, así que la ventana de
    // precarga tiene que mirar más lejos o el scroll rápido alcanza cuadros
    // todavía sin decodificar y se ven saltos.
    const videoSource = createVideoFrameSource({
      stride,
      lookahead: 20,
      onFrameLoaded: () => scheduleDraw(),
    });

    // Backing store a devicePixelRatio (cap 2) → cuadro nítido sin sobrecostos.
    const resize = () => {
      cssW = stage.clientWidth;
      cssH = stage.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawnFrame = -1; // forzar redibujo al nuevo tamaño
      scheduleDraw();
    };

    resize();
    window.addEventListener('resize', resize);

    const gsapCtx = gsap.context(() => {
      const beats = beatRefs.current;
      const proxy = { p: 0 };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: PIN_LENGTH,
          pin: true,
          // 0.25 y no 0.5: el scrub es el retardo con el que el timeline
          // persigue al scroll. Medio segundo se sentía como que la cámara
          // venía atrasada respecto de la rueda; un cuarto sigue suavizando el
          // ruido del trackpad pero responde casi al instante.
          scrub: 0.25,
          anticipatePin: 1,
          // Al soltar un scroll rápido, saltar al destino en vez de seguir
          // reproduciendo el tramo pendiente en cámara lenta.
          fastScrollEnd: true,
          // El pin inserta ~300vh de spacer: debe recalcularse antes que los
          // triggers de reveal creados por las secciones que montaron antes.
          refreshPriority: 1,
        },
      });

      // Progreso de scroll (0..1) → overlay de legibilidad + índice de cuadro
      // de video (cuantizado sobre frameCount).
      tl.to(
        proxy,
        {
          p: 1,
          duration: 1,
          onUpdate: () => {
            pendingP = proxy.p;
            pendingFrame = Math.round(pendingP * (videoSource.frameCount - 1));
            scheduleDraw();
          },
        },
        0,
      );

      // Beats de texto sincronizados a rangos de progreso (HERO-02)
      if (beats[0]) {
        tl.to(beats[0], { opacity: 0, y: -28, duration: FADE }, 0.24);
      }
      if (beats[1]) {
        tl.fromTo(beats[1], { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: FADE }, 0.36);
        tl.to(beats[1], { opacity: 0, y: -28, duration: FADE }, 0.58);
      }
      if (beats[2]) {
        tl.fromTo(beats[2], { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: FADE }, 0.72);
      }

      // Los CTAs del primer beat NO se animan por GSAP a propósito (ver la
      // clase .hero-cta-in en index.css). El tween de entrada dependía del
      // ticker de GSAP, que corre sobre requestAnimationFrame: si el rAF se
      // congela —pestaña en segundo plano, panel que no compone, throttling—
      // el tween se queda clavado en su estado inicial y los botones de
      // conversión del hero desaparecen. Con una animación CSS, si no llega a
      // correr el elemento queda visible, que es el fallo seguro.
    }, stage);

    // El pin llega tarde (config async + chunk lazy): los ScrollTriggers ya
    // creados (reveals, counter, anchors) tienen starts sin el spacer de ~300vh.
    // Recalcular todo ahora que el layout definitivo existe (UX-02).
    ScrollTrigger.refresh();

    return () => {
      gsapCtx.revert();
      window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
      // Al desmontar, el spacer desaparece: recalcular posiciones otra vez.
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section
      ref={stageRef}
      aria-label="Todo comienza en Punto Cero"
      className="relative h-screen w-full overflow-hidden bg-ink-fixed"
    >
      {/* Video real del cliente (secuencia de cuadros) — contenido principal */}
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
      {/* Oscurecido mínimo, solo lo necesario para leer el texto sobre el video */}
      <div ref={overlayRef} aria-hidden className="absolute inset-0 h-full w-full" />
      {/* Scrim radial centrado en el bloque de texto: garantiza legibilidad sobre
          cualquier cuadro (paredes blancas, cielo, interiores con sol) sin apagar
          la imagen entera — cae al centro y se disuelve antes de los bordes.
          Va antes de los beats (que llevan z-10) para quedar por debajo del texto. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{
          background:
            'radial-gradient(ellipse 78% 58% at 50% 48%, rgba(0,0,0,.60) 0%, rgba(0,0,0,.40) 45%, rgba(0,0,0,0) 78%)',
        }}
      />

      {STORY_BEATS.map((beat, i) => {
        const Heading = i === 0 ? ('h1' as const) : ('h2' as const);
        return (
          <div
            key={beat.id}
            ref={(el) => {
              beatRefs.current[i] = el;
            }}
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <p
              className={`mb-6 text-xs font-medium uppercase tracking-[0.4em] text-brand-300 md:text-sm ${TEXT_SHADOW}`}
            >
              {beat.kicker}
            </p>
            <Heading
              className={`mb-6 text-4xl font-light tracking-wider text-white sm:text-5xl md:text-6xl lg:text-7xl ${TEXT_SHADOW}`}
            >
              {beat.title.split('\n').map((line, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {line}
                </span>
              ))}
            </Heading>
            <p className={`max-w-2xl text-lg font-light tracking-wide text-white/85 md:text-xl ${TEXT_SHADOW}`}>
              {beat.line}
            </p>

            {beat.ctas && (
              <div
                ref={ctaRef}
                className="hero-cta-in pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:mt-10"
              >
                <Button to={beat.ctas.primary.to} variant="primary" className={TEXT_SHADOW}>
                  {beat.ctas.primary.label}
                </Button>
                <Button to={beat.ctas.secondary.to} variant="outline" dark className={TEXT_SHADOW}>
                  {beat.ctas.secondary.label}
                </Button>
              </div>
            )}

            {beat.contextualLink && (
              <Link
                to={beat.contextualLink.to}
                className={`pointer-events-auto mt-8 text-xs font-medium uppercase tracking-[0.3em] text-brand-300 transition-colors duration-300 hover:text-white md:text-sm ${TEXT_SHADOW}`}
              >
                {beat.contextualLink.label}
              </Link>
            )}

            {i === 0 && (
              <div className="absolute bottom-8 animate-bounce md:bottom-12">
                <ChevronDown
                  className="h-10 w-10 text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,.6)]"
                  strokeWidth={1}
                />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
