// Botón flotante de WhatsApp (CONT-02, SEO-02): visible en todo el scroll,
// abre wa.me con el número de configRepo, entrada sutil con GSAP.

import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { configRepo } from '../data';
import { trackEvent } from '../lib/analytics';
import { gsap } from '../lib/gsapReveal';
import { prefersReducedMotion } from '../lib/useReducedMotion';

export default function WhatsAppFloat() {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let alive = true;
    configRepo
      .get()
      .then((c) => {
        if (alive) setWhatsappNumber(c.whatsappNumber);
      })
      .catch(() => {
        // Sin config no hay número válido: el botón queda oculto, sin
        // unhandled rejection.
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!whatsappNumber || !buttonRef.current) return;
    if (prefersReducedMotion()) {
      gsap.set(buttonRef.current, { opacity: 1, y: 0, scale: 1 });
      return;
    }
    const tween = gsap.fromTo(
      buttonRef.current,
      { opacity: 0, y: 24, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', delay: 0.6 },
    );
    return () => {
      tween.kill();
    };
  }, [whatsappNumber]);

  if (!whatsappNumber) return null;

  return (
    <a
      ref={buttonRef}
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      onClick={() => trackEvent('whatsapp_click', { location: 'floating' })}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-none border border-white/10 bg-brand-900 text-white opacity-0 shadow-none transition-colors duration-300 hover:bg-brand-700 md:bottom-8 md:right-8"
    >
      <MessageCircle size={24} strokeWidth={1.5} />
    </a>
  );
}
