// Hero fullscreen del detalle de proyecto (PROY-04): imagen con parallax sutil
// (scrub sin pin — el pin es exclusivo de HomeStory) + back nav flotante.

import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { gsap, gsapReveal } from '../../../lib/gsapReveal';
import { prefersReducedMotion } from '../../../lib/useReducedMotion';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  type Project,
} from '../../../data';
import ShareButton from '../../ui/ShareButton';

export default function DetalleHero({ project }: { project: Project }) {
  const heroRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanupReveal = gsapReveal(contentRef.current, { start: 'top 95%' });

    if (prefersReducedMotion() || !heroRef.current || !imgRef.current) {
      return cleanupReveal;
    }

    const tween = gsap.to(imgRef.current, {
      yPercent: 14,
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      cleanupReveal();
    };
  }, []);

  return (
    <section ref={heroRef} className="relative h-screen overflow-hidden bg-ink-fixed">
      <div
        ref={imgRef}
        className="absolute inset-0 -top-[14%] h-[128%] bg-cover bg-center"
        style={{ backgroundImage: `url(${project.coverImage})` }}
        role="img"
        aria-label={project.name}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

      {/* Back nav flotante */}
      <Link
        to="/proyectos"
        className="absolute left-4 top-24 z-10 inline-flex items-center gap-2 border border-white/30 bg-black/20 px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-white backdrop-blur-md transition-colors duration-300 hover:bg-white hover:text-brand-900 sm:left-6 lg:left-8"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Proyectos
      </Link>

      <div className="absolute right-4 top-24 z-10 flex items-center gap-2 sm:right-6 lg:right-8">
        <ShareButton title={project.name} text={`${project.name} — ${project.location}`} dark />
        {project.isRender && (
          <span className="border border-white/30 bg-black/20 px-3 py-1.5 text-xs font-medium uppercase tracking-widest text-white backdrop-blur-md">
            Render ilustrativo
          </span>
        )}
      </div>

      <div className="relative flex h-full items-center justify-center">
        <div ref={contentRef} className="px-4 text-center text-white">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-brand-300 md:text-sm">
            {PROJECT_TYPE_LABELS[project.type]} · {PROJECT_STATUS_LABELS[project.status]}
          </p>
          <h1 className="text-4xl font-light tracking-wider sm:text-5xl md:text-6xl lg:text-7xl">
            {project.name}
          </h1>
          <p className="mt-6 text-base font-light uppercase tracking-widest text-white/80">
            {project.location}
          </p>
        </div>
      </div>
    </section>
  );
}
