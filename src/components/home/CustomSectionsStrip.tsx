import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Eye, EyeOff, Film, Image as ImageIcon } from 'lucide-react';
import {
  customSectionRepo,
  CUSTOM_SECTIONS_UPDATED_EVENT,
  type CustomSection,
} from '../../data';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Photo } from '../ui/Skeleton';
import SectionVideoPlayer from '../ui/SectionVideoPlayer';
import { gsapReveal, REVEAL } from '../../lib/gsapReveal';
import { useLiveCMS } from '../../lib/LiveCMSContext';

export default function CustomSectionsStrip() {
  const [sections, setSections] = useState<CustomSection[] | null>(null);
  const { isEditMode } = useLiveCMS();
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    let alive = true;
    customSectionRepo
      .list()
      .then((all) => {
        if (alive) setSections(all);
      })
      .catch(() => {
        if (alive) setSections([]);
      });

    const onUpdate = () => {
      customSectionRepo
        .list()
        .then((all) => {
          if (alive) setSections(all);
        })
        .catch(() => {
          if (alive) setSections([]);
        });
    };

    window.addEventListener(CUSTOM_SECTIONS_UPDATED_EVENT, onUpdate);
    return () => {
      alive = false;
      window.removeEventListener(CUSTOM_SECTIONS_UPDATED_EVENT, onUpdate);
    };
  }, []);

  useEffect(() => {
    if (!sections || sections.length === 0) return;
    const cleanups: Array<() => void> = [];
    refs.current.forEach((el) => {
      if (el) {
        cleanups.push(gsapReveal(Array.from(el.children), { stagger: REVEAL.stagger }));
      }
    });
    return () => cleanups.forEach((fn) => fn());
  }, [sections]);

  if (!sections || sections.length === 0) return null;

  const visibleSections = isEditMode ? sections : sections.filter((s) => s.published);
  if (visibleSections.length === 0) return null;

  return (
    <>
      {visibleSections.map((sec) => {
        const isDark = sec.theme === 'ink';
        const bgClass =
          sec.theme === 'ink'
            ? 'bg-ink-fixed text-white'
            : sec.theme === 'paper-soft'
              ? 'bg-paper-soft text-ink'
              : 'bg-paper text-ink';

        const textKickerClass = isDark ? 'text-brand-300' : 'text-brand-500';
        const textTitleClass = isDark ? 'text-white' : 'text-ink';
        const textBodyClass = isDark ? 'text-white/80' : 'text-ink-soft';

        const hasMedia = sec.mediaType !== 'none' && Boolean(sec.mediaUrl);
        const layout = sec.layout || 'split-balanced';

        // Layout grid definition
        let gridLayoutClass = '';
        let textColClass = '';
        let mediaColClass = '';

        if (!hasMedia || layout === 'compact') {
          gridLayoutClass = 'max-w-3xl mx-auto text-center';
          textColClass = 'space-y-6';
        } else if (layout === 'full-width') {
          gridLayoutClass = 'flex flex-col gap-10 lg:gap-14';
          textColClass = 'max-w-3xl mx-auto text-center space-y-5';
          mediaColClass = 'w-full';
        } else if (layout === 'split-media-large') {
          gridLayoutClass = 'grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center';
          textColClass = 'lg:col-span-4 space-y-6';
          mediaColClass = 'lg:col-span-8';
        } else {
          // split-balanced (50 / 50)
          gridLayoutClass = 'grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center';
          textColClass = 'lg:col-span-6 space-y-6';
          mediaColClass = 'lg:col-span-6';
        }

        return (
          <section
            key={sec.id}
            id={`seccion-${sec.id}`}
            className={`relative py-20 md:py-28 lg:py-32 transition-colors ${bgClass}`}
          >
            <Container>
              {isEditMode && (
                <div className="mb-8 p-4 bg-brand-500/10 border border-brand-500/30 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center flex-wrap gap-2">
                    {sec.published ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <Eye className="w-4 h-4" /> Sección personalizada <strong>visible</strong>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                        <EyeOff className="w-4 h-4" /> Sección personalizada <strong>oculta</strong>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-ink-soft border-l border-brand-500/20 pl-2">
                      Formato: <strong>{layout}</strong>
                    </span>
                    {sec.mediaType === 'video' && (
                      <span className="inline-flex items-center gap-1 text-brand-600 border-l border-brand-500/20 pl-2 font-medium">
                        <Film className="w-3.5 h-3.5" /> Video ({sec.videoConfig?.aspectRatio || '16:9'})
                      </span>
                    )}
                    {sec.mediaType === 'image' && (
                      <span className="inline-flex items-center gap-1 text-ink-soft border-l border-brand-500/20 pl-2">
                        <ImageIcon className="w-3.5 h-3.5" /> Imagen
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await customSectionRepo.update(sec.id, { published: !sec.published });
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-brand-900 text-white rounded hover:bg-brand-700"
                    >
                      {sec.published ? 'Ocultar' : 'Hacer visible'}
                    </button>
                    <Link
                      to="/admin/contenido"
                      className="px-3 py-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Configurar en panel
                    </Link>
                  </div>
                </div>
              )}

              <div
                ref={(el) => {
                  if (el) refs.current.set(sec.id, el);
                  else refs.current.delete(sec.id);
                }}
                className={gridLayoutClass}
              >
                {/* Bloque Textual */}
                <div className={textColClass}>
                  {sec.kicker && (
                    <p className={`text-xs font-medium uppercase tracking-[0.3em] md:text-sm ${textKickerClass}`}>
                      {sec.kicker}
                    </p>
                  )}
                  <h2 className={`text-3xl font-light tracking-wide sm:text-4xl md:text-5xl leading-tight ${textTitleClass}`}>
                    {sec.title}
                  </h2>
                  <div className={`text-base md:text-lg font-light leading-relaxed whitespace-pre-line ${textBodyClass}`}>
                    {sec.content}
                  </div>

                  {sec.ctaText && sec.ctaLink && (
                    <div className={`pt-4 ${hasMedia && layout !== 'full-width' ? '' : 'flex justify-center'}`}>
                      {sec.ctaLink.startsWith('http') ? (
                        <a
                          href={sec.ctaLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-none bg-brand-500 text-white font-medium text-xs uppercase tracking-widest hover:bg-brand-600 transition-colors shadow-sm"
                        >
                          {sec.ctaText}
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      ) : (
                        <Link to={sec.ctaLink}>
                          <Button variant={isDark ? 'outline' : 'primary'} dark={isDark}>
                            {sec.ctaText}
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Bloque Multimedia (Imagen o Video) */}
                {hasMedia && (
                  <div className={mediaColClass}>
                    {sec.mediaType === 'video' && sec.mediaUrl ? (
                      <SectionVideoPlayer
                        src={sec.mediaUrl}
                        config={sec.videoConfig}
                      />
                    ) : (
                      <div className="overflow-hidden rounded-sm shadow-xl border border-hairline/20 bg-black/10 aspect-[16/10] max-h-[540px]">
                        <Photo
                          src={sec.mediaUrl || ''}
                          alt={sec.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Container>
          </section>
        );
      })}
    </>
  );
}
