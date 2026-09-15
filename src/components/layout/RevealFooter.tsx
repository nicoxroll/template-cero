// Footer que se revela al scrollear — el efecto de real5.html § footer reveal.
//
// Cómo funciona: el footer queda FIJO al fondo de la ventana, detrás de todo
// (z-0), y el contenido del sitio es una "hoja" opaca por encima (z-10) con un
// margin-bottom igual al alto del footer. Al llegar al final, la hoja se
// desliza hacia arriba y descubre el footer que ya estaba ahí. La sombra del
// borde inferior de la hoja hace que se lea como una lámina levantándose, no
// como dos bloques pegados.
//
// Guardas, porque el efecto puede romper más de lo que suma:
//
//  · Si el footer es MÁS ALTO que la ventana (mobile, donde las tres columnas
//    se apilan), estando fijo su parte inferior sería inalcanzable: ahí se cae
//    al footer normal en flujo.
//  · Con prefers-reduced-motion también se cae al normal: el efecto depende de
//    que el fondo quede quieto mientras el resto se mueve, que es exactamente
//    el tipo de disociación que la preferencia pide evitar.
//  · El margin-bottom cambia el alto del documento, así que hay que refrescar
//    ScrollTrigger o el pin del tour y los reveals quedan con starts viejos.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollTrigger, gsap } from '../../lib/gsapReveal';
import { prefersReducedMotion } from '../../lib/useReducedMotion';
import Footer from './Footer';

export default function RevealFooter({ children }: { children: ReactNode }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const measure = () => {
      const h = el.offsetHeight;
      const fits = h > 0 && h <= window.innerHeight && !prefersReducedMotion();
      setHeight(h);
      setEnabled(fits);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // El alto del documento cambió al aplicar el margin-bottom.
  useEffect(() => {
    if (height === 0) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [height, enabled]);

  // El contenido del footer entra con un leve parallax mientras se descubre,
  // como en la referencia: refuerza que estaba detrás y no debajo.
  useEffect(() => {
    const inner = innerRef.current;
    const sheet = sheetRef.current;
    if (!enabled || !inner || !sheet) return;

    // El rango es exactamente la ventana de revelado: arranca cuando el borde
    // inferior de la hoja toca el fondo de la pantalla y termina cuando subió
    // el alto del footer. Antes disparaba contra documentElement con
    // `bottom bottom+=height`, un rango que nunca se completaba: el contenido
    // se quedaba clavado en y:60 / opacity:0.6 y el footer se veía apagado y
    // corrido.
    const tween = gsap.fromTo(
      inner,
      { y: 48, opacity: 0.75 },
      {
        y: 0,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sheet,
          start: 'bottom bottom',
          end: `bottom bottom-=${height}`,
          scrub: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [enabled, height]);

  return (
    <>
      {/* La hoja: opaca y por encima del footer. bg-paper para que ninguna
          sección semitransparente deje ver el footer a mitad de página. */}
      <div
        ref={sheetRef}
        className={`relative z-10 bg-paper ${
          enabled ? 'shadow-[0_40px_80px_rgba(0,0,0,0.45)]' : ''
        }`}
        style={enabled ? { marginBottom: height } : undefined}
      >
        {children}
      </div>

      <div
        ref={footerRef}
        className={enabled ? 'fixed inset-x-0 bottom-0 z-0' : 'relative z-10'}
      >
        <div ref={innerRef}>
          <Footer />
        </div>
      </div>
    </>
  );
}
