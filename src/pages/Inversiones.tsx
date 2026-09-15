// Inversiones — INV-01 (oportunidades activas), INV-03 (disclaimer),
// INV-04 (FAQ) e INV-05 (newsletter). Datos vía investmentRepo.
// Soporta edición en vivo para administradores.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { investmentRepo, type Investment } from '../data';
import { usePageMeta } from '../lib/usePageMeta';
import { gsapReveal, REVEAL } from '../lib/gsapReveal';
import Container from '../components/ui/Container';
import { IMAGERY } from '../lib/siteImagery';
import { useMinVisible } from '../components/ui/Skeleton';
import InvestmentCard from '../components/inversiones/InvestmentCard';
import InvestmentCardSkeleton from '../components/inversiones/InvestmentCardSkeleton';
import InvestorFaq from '../components/inversiones/InvestorFaq';
import NewsletterSignup from '../components/inversiones/NewsletterSignup';
import CalculadoraInversion from '../components/inversiones/CalculadoraInversion';
import { useLiveSection } from '../lib/useLiveSection';
import { EditableSectionWrapper, EditableText, EditableImage } from '../components/ui/InlineEditOverlay';

const STATUS_ORDER: Record<Investment['status'], number> = {
  activa: 0,
  proximamente: 1,
  cerrada: 2,
};

export default function Inversiones() {
  const [investments, setInvestments] = useState<Investment[] | null>(null);
  const loading = investments === null;
  const showSkeleton = useMinVisible(loading);
  const gridRef = useRef<HTMLDivElement>(null);

  // Hero CMS
  const {
    data: heroData,
    update: updateHero,
    save: handleSaveHero,
    cancel: handleCancelHero,
  } = useLiveSection({
    badge: { key: 'inversiones.hero.badge', default: 'Plataforma de Inversión Inmobiliaria' },
    title: { key: 'inversiones.hero.title', default: 'Rendimiento en m² con respaldo real' },
    description: {
      key: 'inversiones.hero.description',
      default:
        'Participe en desarrollos inmobiliarios de Punto Cero estructurados bajo fideicomiso al costo. Información clara, métricas actualizadas y seguimiento integral sin intermediarios.',
    },
    stat1Val: { key: 'inversiones.hero.stat1_val', default: '100%' },
    stat1Lbl: { key: 'inversiones.hero.stat1_lbl', default: 'Transparencia Fiduciaria' },
    stat2Val: { key: 'inversiones.hero.stat2_val', default: 'USD / m²' },
    stat2Lbl: { key: 'inversiones.hero.stat2_lbl', default: 'Resguardo de Valor' },
    stat3Val: { key: 'inversiones.hero.stat3_val', default: '+15 Años' },
    stat3Lbl: { key: 'inversiones.hero.stat3_lbl', default: 'Trayectoria Constructora' },
    image: { key: 'inversiones.hero.image', default: IMAGERY.wide },
  });

  // List CMS
  const {
    data: listData,
    update: updateList,
    save: handleSaveList,
    cancel: handleCancelList,
  } = useLiveSection({
    kicker: { key: 'inversiones.list.kicker', default: 'Oportunidades Vigentes' },
    title: { key: 'inversiones.list.title', default: 'Modelos de Inversión Activos' },
    intro: {
      key: 'inversiones.list.intro',
      default:
        'Explore las oportunidades de participación con ingreso mínimo, tasa estimada y plazo de finalización. Haga clic en cualquiera para ver la memoria descriptiva y los documentos.',
    },
  });

  usePageMeta({
    title: 'Inversiones',
    description:
      'Oportunidades de inversión inmobiliaria con estructura jurídica sólida, información transparente y retornos estimados en cada etapa.',
  });

  useEffect(() => {
    let cancelled = false;
    investmentRepo
      .listPublished()
      .then((list) => {
        if (cancelled) return;
        setInvestments(
          [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
        );
      })
      .catch(() => {
        if (!cancelled) setInvestments([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || !gridRef.current) return;
    const cards = Array.from(gridRef.current.children);
    if (cards.length === 0) return;
    return gsapReveal(cards, { stagger: REVEAL.stagger });
  }, [loading]);

  return (
    <main>
      <EditableSectionWrapper
        sectionId="inversiones-hero"
        sectionLabel="Hero de Inversiones"
        onSave={handleSaveHero}
        onCancel={handleCancelHero}
        pencilPosition="top-24 right-8"
      >
        {(isEditing) => (
          <section className="relative flex h-screen items-center overflow-hidden bg-brand-900 text-white">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
              style={{ backgroundImage: `url(${heroData.image || IMAGERY.wide})` }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-brand-900/25" aria-hidden="true" />

            {isEditing && (
              <div className="absolute top-24 left-8 z-30 max-w-xs">
                <EditableImage
                  value={heroData.image}
                  onChange={(val) => updateHero('image', val)}
                  isEditing={isEditing}
                  label="Foto de fondo hero"
                />
              </div>
            )}

            <Container className="relative z-10">
              <div className="max-w-3xl">
                <EditableText
                  as="span"
                  value={heroData.badge}
                  isEditing={isEditing}
                  onChange={(val) => updateHero('badge', val)}
                  className="mb-4 inline-block border border-brand-300/30 bg-brand-500/20 px-3.5 py-1 text-xs font-medium uppercase tracking-[0.3em] text-brand-300 backdrop-blur-sm"
                />
                <EditableText
                  as="h1"
                  value={heroData.title}
                  isEditing={isEditing}
                  onChange={(val) => updateHero('title', val)}
                  className="text-4xl font-light uppercase tracking-wide text-white sm:text-5xl md:text-6xl lg:text-7xl block"
                />
                <EditableText
                  as="p"
                  value={heroData.description}
                  isEditing={isEditing}
                  multiline
                  onChange={(val) => updateHero('description', val)}
                  className="mt-6 text-base font-light leading-relaxed text-white/90 md:text-lg block"
                />

                <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-3">
                  <div>
                    <EditableText
                      as="span"
                      value={heroData.stat1Val}
                      isEditing={isEditing}
                      onChange={(val) => updateHero('stat1Val', val)}
                      className="block text-2xl font-light tracking-wide text-brand-300 md:text-3xl"
                    />
                    <EditableText
                      as="span"
                      value={heroData.stat1Lbl}
                      isEditing={isEditing}
                      onChange={(val) => updateHero('stat1Lbl', val)}
                      className="mt-1 block text-xs font-light uppercase tracking-widest text-white/70"
                    />
                  </div>
                  <div>
                    <EditableText
                      as="span"
                      value={heroData.stat2Val}
                      isEditing={isEditing}
                      onChange={(val) => updateHero('stat2Val', val)}
                      className="block text-2xl font-light tracking-wide text-brand-300 md:text-3xl"
                    />
                    <EditableText
                      as="span"
                      value={heroData.stat2Lbl}
                      isEditing={isEditing}
                      onChange={(val) => updateHero('stat2Lbl', val)}
                      className="mt-1 block text-xs font-light uppercase tracking-widest text-white/70"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <EditableText
                      as="span"
                      value={heroData.stat3Val}
                      isEditing={isEditing}
                      onChange={(val) => updateHero('stat3Val', val)}
                      className="block text-2xl font-light tracking-wide text-brand-300 md:text-3xl"
                    />
                    <EditableText
                      as="span"
                      value={heroData.stat3Lbl}
                      isEditing={isEditing}
                      onChange={(val) => updateHero('stat3Lbl', val)}
                      className="mt-1 block text-xs font-light uppercase tracking-widest text-white/70"
                    />
                  </div>
                </div>
              </div>
            </Container>
          </section>
        )}
      </EditableSectionWrapper>

      <EditableSectionWrapper
        sectionId="inversiones-list"
        sectionLabel="Oportunidades de Inversión"
        onSave={handleSaveList}
        onCancel={handleCancelList}
        pencilPosition="top-8 right-8"
      >
        {(isEditing) => (
          <section className="py-20 md:py-28 lg:py-32">
            <Container>
              <div className="mb-12 md:mb-16">
                <EditableText
                  as="p"
                  value={listData.kicker}
                  isEditing={isEditing}
                  onChange={(val) => updateList('kicker', val)}
                  className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-brand-500 md:text-sm block"
                />
                <EditableText
                  as="h2"
                  value={listData.title}
                  isEditing={isEditing}
                  onChange={(val) => updateList('title', val)}
                  className="text-3xl font-light tracking-wide text-ink sm:text-4xl md:text-5xl block"
                />
                <EditableText
                  as="p"
                  value={listData.intro}
                  isEditing={isEditing}
                  multiline
                  onChange={(val) => updateList('intro', val)}
                  className="mt-4 max-w-2xl text-base font-light leading-relaxed text-ink-soft md:text-lg block"
                />
              </div>

              {isEditing && (
                <div className="mb-8 p-4 bg-brand-500/10 border border-brand-500/30 rounded flex items-center justify-between text-xs">
                  <span className="text-ink-soft">
                    Para crear nuevos fideicomisos, editar rentabilidades estimadas o estados:
                  </span>
                  <Link
                    to="/admin/inversiones"
                    className="inline-flex items-center gap-1.5 font-bold uppercase text-brand-600 hover:text-brand-700"
                  >
                    Administrador de Inversiones <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {showSkeleton ? (
                <div className="grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <InvestmentCardSkeleton key={i} />
                  ))}
                </div>
              ) : loading ? null : investments.length === 0 ? (
                <p className="text-base font-light leading-relaxed text-ink-soft">
                  En este momento no hay oportunidades publicadas. Suscríbase al newsletter para
                  recibir las próximas antes de su publicación general.
                </p>
              ) : (
                <div ref={gridRef} className="grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                  {investments.map((inv) => (
                    <InvestmentCard key={inv.slug} investment={inv} />
                  ))}
                </div>
              )}
            </Container>
          </section>
        )}
      </EditableSectionWrapper>

      <CalculadoraInversion />
      <InvestorFaq />
      <NewsletterSignup />
    </main>
  );
}
