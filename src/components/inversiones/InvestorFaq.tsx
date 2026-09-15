// INV-04: FAQ de inversores — acordeón con animación GSAP y reveal al scrollear.
// Fideicomiso al costo, riesgos, retornos y proceso de inversión. Tono serio, es-AR.
// Soporta edición en vivo para administradores.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { gsap, gsapReveal, REVEAL } from '../../lib/gsapReveal';
import { prefersReducedMotion } from '../../lib/useReducedMotion';
import { faqRepo, type FaqItem } from '../../data';
import Container from '../ui/Container';
import { Skeleton, useMinVisible } from '../ui/Skeleton';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../ui/InlineEditOverlay';

function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { height: open ? 'auto' : 0, opacity: open ? 1 : 0 });
      return;
    }
    gsap.to(el, {
      height: open ? 'auto' : 0,
      opacity: open ? 1 : 0,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  }, [open]);

  return (
    <div className="border-b border-hairline">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-6 text-left transition-colors duration-300 hover:text-brand-700 dark:hover:text-brand-300"
      >
        <span className="text-lg font-light tracking-wide text-ink md:text-xl">{item.question}</span>
        <ChevronDown
          aria-hidden
          className={`h-5 w-5 shrink-0 text-brand-500 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div ref={bodyRef} className="h-0 overflow-hidden opacity-0">
        <p className="pb-8 pr-10 text-base font-light leading-relaxed text-ink-soft">{item.answer}</p>
      </div>
    </div>
  );
}

function FaqSkeleton() {
  return (
    <div aria-hidden className="max-w-3xl border-t border-hairline">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-6 border-b border-hairline py-6">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-5 w-5 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function InvestorFaq() {
  const [items, setItems] = useState<FaqItem[] | null>(null);
  const loading = items === null;
  const showSkeleton = useMinVisible(loading);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    data: sectionData,
    update: updateSection,
    save: handleSave,
    cancel: handleCancel,
  } = useLiveSection({
    kicker: { key: 'inversiones.faq.kicker', default: 'Preguntas frecuentes' },
    title: { key: 'inversiones.faq.title', default: 'Antes de invertir' },
    intro: {
      key: 'inversiones.faq.intro',
      default:
        'Respuestas claras a las consultas más habituales de nuestros inversores. Ante cualquier duda adicional, nuestro equipo está disponible para una reunión sin compromiso.',
    },
    faqVisible: { key: 'inversiones.faq.visible', default: 'true' },
  });

  const isVisible = sectionData.faqVisible !== 'false';

  useEffect(() => {
    let alive = true;
    faqRepo
      .list()
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loading || !listRef.current) return;
    const rows = Array.from(listRef.current.children);
    if (rows.length === 0) return;
    return gsapReveal(rows, { stagger: REVEAL.stagger });
  }, [loading, items]);

  if (!loading && items.length === 0) return null;

  return (
    <EditableSectionWrapper
      sectionId="inversiones-faq"
      sectionLabel="Preguntas Frecuentes de Inversores"
      onSave={handleSave}
      onCancel={handleCancel}
      pencilPosition="top-8 right-8"
    >
      {(isEditing) => {
        if (!isVisible && !isEditing) return null;
        return (
          <section className="bg-paper-soft py-20 md:py-28 lg:py-32">
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
                      onClick={() => updateSection('faqVisible', isVisible ? 'false' : 'true')}
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
                  Para agregar, reordenar o redactar las respuestas de cada pregunta:
                </span>
                <Link
                  to="/admin/contenido"
                  className="inline-flex items-center gap-1.5 font-bold uppercase text-brand-600 hover:text-brand-700"
                >
                  Administrador de FAQ <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {showSkeleton ? (
              <FaqSkeleton />
            ) : loading ? null : (
              <div ref={listRef} className="max-w-3xl border-t border-hairline">
                {items.map((item, i) => (
                  <FaqRow
                    key={item.id}
                    item={item}
                    open={openIndex === i}
                    onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                  />
                ))}
              </div>
            )}
          </Container>
        </section>
        );
      }}
    </EditableSectionWrapper>
  );
}
