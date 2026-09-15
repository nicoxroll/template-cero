// Hero de la página Proyectos — mismo idioma que el hero de la portada (imagen
// a sangre, gradiente oscuro, texto blanco centrado) para que el sitio se lea
// como una pieza y no como páginas sueltas.
//
// Soporta edición en vivo para administradores.

import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { gsapReveal } from '../../lib/gsapReveal';
import { STORY_PHOTO_URL } from '../home/story/frameSource';
import type { Project } from '../../data';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText, EditableImage } from '../ui/InlineEditOverlay';

interface ProyectosHeroProps {
  /** Proyectos ya cargados; se usa la portada del primer destacado. */
  projects: Project[];
}

export default function ProyectosHero({ projects }: ProyectosHeroProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const destacado = projects.find((p) => p.featured) ?? projects[0];
  const defaultBg = destacado ? destacado.coverImage : STORY_PHOTO_URL;

  const {
    data: sectionData,
    update: updateSection,
    save: handleSave,
    cancel: handleCancel,
  } = useLiveSection({
    kicker: { key: 'proyectos.hero.kicker', default: 'Proyectos' },
    title: { key: 'proyectos.hero.title', default: 'Nuestros desarrollos' },
    description: {
      key: 'proyectos.hero.description',
      default:
        'De la planificación a la entrega: obras terminadas, proyectos en ejecución y conceptos en diseño, identificados como tales.',
    },
    image: { key: 'proyectos.hero.image', default: defaultBg },
  });

  useEffect(() => {
    if (!contentRef.current) return;
    return gsapReveal(contentRef.current);
  }, []);

  return (
    <EditableSectionWrapper
      sectionId="proyectos-hero"
      sectionLabel="Hero de Proyectos"
      onSave={handleSave}
      onCancel={handleCancel}
      pencilPosition="top-24 right-8"
    >
      {(isEditing) => (
        <section
          aria-label="Nuestros desarrollos"
          className="relative h-screen w-full overflow-hidden bg-ink-fixed"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{ backgroundImage: `url(${sectionData.image || defaultBg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/75" />

          {isEditing && (
            <div className="absolute top-24 left-8 z-30 max-w-xs">
              <EditableImage
                value={sectionData.image}
                onChange={(val) => updateSection('image', val)}
                isEditing={isEditing}
                label="Foto de portada hero"
              />
            </div>
          )}

          <div
            ref={contentRef}
            className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto"
          >
            <EditableText
              as="p"
              value={sectionData.kicker}
              isEditing={isEditing}
              onChange={(val) => updateSection('kicker', val)}
              className="mb-6 text-xs font-medium uppercase tracking-[0.4em] text-brand-300 md:text-sm block"
            />
            <EditableText
              as="h1"
              value={sectionData.title}
              isEditing={isEditing}
              onChange={(val) => updateSection('title', val)}
              className="mb-6 text-5xl font-light tracking-wider text-white md:text-6xl lg:text-7xl block"
            />
            <EditableText
              as="p"
              value={sectionData.description}
              isEditing={isEditing}
              multiline
              onChange={(val) => updateSection('description', val)}
              className="max-w-2xl text-base font-light leading-relaxed tracking-wide text-white/85 md:text-lg block"
            />

            <div className="absolute bottom-8 animate-bounce md:bottom-10">
              <ChevronDown
                className="h-8 w-8 text-white/70 drop-shadow-[0_2px_8px_rgba(0,0,0,.6)]"
                strokeWidth={1}
                aria-hidden
              />
            </div>
          </div>
        </section>
      )}
    </EditableSectionWrapper>
  );
}
