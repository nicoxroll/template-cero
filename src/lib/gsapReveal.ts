// Helper de scroll-reveal estándar (DESIGN.md → Animación).
// Único lugar donde se registra ScrollTrigger. Respeta prefers-reduced-motion.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const REVEAL = {
  duration: 0.9,
  ease: 'power3.out',
  distance: 32,
  stagger: 0.12,
  start: 'top 80%',
} as const;

export interface RevealOptions {
  /** Distancia vertical en px (default 32) */
  y?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
  start?: string;
}

/**
 * Reveal estándar al entrar en viewport: opacity 0→1, y 32→0, una sola vez.
 * Con prefers-reduced-motion muestra el estado final sin animar.
 * Devuelve una función de cleanup (matar tweens/triggers creados).
 */
export function gsapReveal(
  targets: gsap.TweenTarget,
  options: RevealOptions = {},
): () => void {
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0 });
    return () => {};
  }

  const tween = gsap.fromTo(
    targets,
    { opacity: 0, y: options.y ?? REVEAL.distance },
    {
      opacity: 1,
      y: 0,
      duration: options.duration ?? REVEAL.duration,
      ease: REVEAL.ease,
      stagger: options.stagger ?? 0,
      delay: options.delay ?? 0,
      scrollTrigger: {
        trigger: (Array.isArray(targets) ? targets[0] : targets) as gsap.DOMTarget,
        start: options.start ?? REVEAL.start,
        once: true,
      },
    },
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}
