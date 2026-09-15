import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink, Eye, EyeOff } from 'lucide-react';
import { investmentRepo, type Investment } from '../../data';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { SkeletonCard, useMinVisible } from '../ui/Skeleton';
import InvestmentCard from '../inversiones/InvestmentCard';
import { gsapReveal, REVEAL } from '../../lib/gsapReveal';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../ui/InlineEditOverlay';

export default function InversionesStrip() {
  const [investments, setInvestments] = useState<Investment[] | null>(null);
  const loading = investments === null;
  const showSkeleton = useMinVisible(loading);
  const gridRef = useRef<HTMLDivElement>(null);

  const {
    data: sectionData,
    update: updateSection,
    save: handleSave,
    cancel: handleCancel,
  } = useLiveSection({
    kicker: { key: 'inversiones.kicker', default: 'Inversiones' },
    title: { key: 'inversiones.title', default: 'Oportunidades abiertas' },
    intro: {
      key: 'inversiones.intro',
      default:
        'Participe en nuestros desarrollos a través de fideicomisos con estructura jurídica clara, hitos de obra auditables y salida definida.',
    },
    ctaText: { key: 'inversiones.ctaText', default: 'Ver todas las oportunidades' },
    sectionVisible: { key: 'inversiones.visible', default: 'true' },
  });

  const isVisible = sectionData.sectionVisible !== 'false';

  useEffect(() => {
    let alive = true;
    investmentRepo
      .listActive()
      .then((list) => {
        if (alive) setInvestments(list.slice(0, 3));
      })
      .catch(() => {
        if (alive) setInvestments([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!investments || investments.length === 0 || !gridRef.current) return;
    return gsapReveal(Array.from(gridRef.current.children), { stagger: REVEAL.stagger });
  }, [investments]);

  if (investments !== null && investments.length === 0) return null;

  return (
    <EditableSectionWrapper
      sectionId="home-inversiones"
      sectionLabel="Inversiones Destacadas"
      onSave={handleSave}
      onCancel={handleCancel}
      pencilPosition="top-8 right-8"
    >
      {(isEditing) => {
        if (!isVisible && !isEditing) return null;
        return (
          <section id="inversiones" className="bg-paper-soft py-20 md:py-28 lg:py-32">
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
                      onClick={() => updateSection('sectionVisible', isVisible ? 'false' : 'true')}
                      className={`px-3 py-1.5 font-medium tracking-wide uppercase transition-colors rounded ${
                        isVisible
                          ? 'bg-paper hover:bg-paper-soft text-ink border border-line'
                          : 'bg-brand-900 hover:bg-brand-700 text-white'
                      }`}
                    >
                      {isVisible ? 'Ocultar sección' : 'Hacer visible'}
                    </button>
                    <Link
                      to="/admin/inversiones"
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
                <div className="mb-8 p-3 bg-paper border border-line rounded flex items-center justify-between text-xs">
                  <span className="text-ink-soft">
                    Para crear o gestionar oportunidades de inversión, tickets y estados:
                  </span>
                  <Link
                    to="/admin/inversiones"
                    className="inline-flex items-center gap-1.5 font-bold uppercase text-brand-600 hover:text-brand-700"
                  >
                    Ir a Inversiones <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {showSkeleton ? (
                <div className="grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : loading ? null : (
                <div ref={gridRef} className="grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                  {investments.map((inv) => (
                    <div key={inv.slug}>
                      <InvestmentCard investment={inv} />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-12 flex items-center gap-4">
                {isEditing ? (
                  <div className="inline-flex items-center gap-2 p-2 border border-brand-500/50 rounded bg-paper">
                    <span className="text-xs uppercase font-mono text-brand-500">Texto Botón:</span>
                    <EditableText
                      value={sectionData.ctaText}
                      isEditing={isEditing}
                      onChange={(val) => updateSection('ctaText', val)}
                      className="text-sm font-medium"
                    />
                  </div>
                ) : (
                  <Button variant="outline" to="/inversiones">
                    {sectionData.ctaText}
                  </Button>
                )}
              </div>
            </Container>
          </section>
        );
      }}
    </EditableSectionWrapper>
  );
}
