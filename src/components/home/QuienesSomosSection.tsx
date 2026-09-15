// Quiénes somos (CONF-01, CONF-02): mensaje institucional, métricas de
// trayectoria con count-up on reveal y equipo con fotos desde teamRepo.
// CONTRATO: este componente renderiza contenido en flujo normal; el dueño de
// HomeStory instala el scrub/pin ALREDEDOR de él, sin editar este archivo.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink, Eye, EyeOff } from 'lucide-react';
import { configRepo, teamRepo, type CompanyMetrics, type TeamMember } from '../../data';
import { gsap, gsapReveal, REVEAL } from '../../lib/gsapReveal';
import { prefersReducedMotion } from '../../lib/useReducedMotion';
import Container from '../ui/Container';
import { Skeleton, useMinVisible, Photo } from '../ui/Skeleton';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../ui/InlineEditOverlay';

const nf = new Intl.NumberFormat('es-AR');

interface MetricDef {
  key: keyof CompanyMetrics;
  label: string;
  suffix?: string;
}

const METRIC_DEFS: MetricDef[] = [
  { key: 'years', label: 'Años de trayectoria' },
  { key: 'm2', label: 'm² construidos' },
  { key: 'projects', label: 'Proyectos entregados' },
];

/** Cifra con count-up al entrar en viewport (una sola vez, respeta reduced motion). */
function MetricCountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = nf.format(value) + suffix;
      return;
    }
    const counter = { val: 0 };
    const tween = gsap.to(counter, {
      val: value,
      duration: 1.8,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = nf.format(Math.round(counter.val)) + suffix;
      },
      scrollTrigger: {
        trigger: el,
        start: REVEAL.start,
        once: true,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [value, suffix]);

  // Se renderiza el valor final para no-JS/SEO; GSAP lo pisa al animar.
  return (
    <span ref={ref} className="tabular-nums">
      {nf.format(value)}
      {suffix}
    </span>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 border-y border-hairline py-10 sm:grid-cols-3 md:gap-8 md:py-12">
      {METRIC_DEFS.map((m) => (
        <div key={m.key} className="flex flex-col items-center gap-3 text-center">
          <Skeleton className="h-12 w-32 md:h-14" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="space-y-3 pt-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function QuienesSomosSection() {
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null);
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const loading = metrics === null || team === null;
  const showSkeleton = useMinVisible(loading);

  const metricsRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  const {
    data: quienesData,
    update: updateQuienes,
    save: saveQuienesContent,
    cancel: cancelQuienes,
  } = useLiveSection({
    kicker: { key: 'quienes.kicker', default: 'Quiénes somos' },
    title: { key: 'quienes.title', default: 'Transformamos ideas en proyectos de valor' },
    intro: {
      key: 'quienes.intro',
      default:
        'Brindamos soluciones integrales en desarrollo inmobiliario, arquitectura, construcción, infraestructura, financiamiento e inversiones, acompañando cada etapa con planificación estratégica, innovación y compromiso profesional.',
    },
    teamKicker: { key: 'quienes.teamKicker', default: 'Nuestro equipo' },
    teamTitle: { key: 'quienes.teamTitle', default: 'Las personas detrás de cada proyecto' },
    teamVisible: { key: 'quienes.teamVisible', default: 'false' },
  });

  const isTeamVisible = quienesData.teamVisible === 'true';

  const [editableMetrics, setEditableMetrics] = useState({
    years: 0,
    m2: 0,
    projects: 0,
  });

  useEffect(() => {
    let alive = true;
    configRepo
      .get()
      .then((cfg) => {
        if (alive) {
          setMetrics(cfg.metrics);
          setEditableMetrics(cfg.metrics);
        }
      })
      .catch(() => {
        if (alive) {
          setMetrics({ years: 0, m2: 0, projects: 0 });
          setEditableMetrics({ years: 0, m2: 0, projects: 0 });
        }
      });
    teamRepo
      .list()
      .then((members) => {
        if (alive) setTeam(members);
      })
      .catch(() => {
        if (alive) setTeam([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async () => {
    await saveQuienesContent();
    if (editableMetrics) {
      await configRepo.update({ metrics: editableMetrics });
      setMetrics(editableMetrics);
    }
  };

  useEffect(() => {
    if (loading) return;
    const cleanups: Array<() => void> = [];
    if (metricsRef.current) {
      cleanups.push(
        gsapReveal(Array.from(metricsRef.current.children), { stagger: REVEAL.stagger }),
      );
    }
    if (teamRef.current) {
      cleanups.push(
        gsapReveal(Array.from(teamRef.current.children), { stagger: REVEAL.stagger }),
      );
    }
    return () => cleanups.forEach((fn) => fn());
  }, [loading]);

  return (
    <EditableSectionWrapper
      sectionId="home-quienes-somos"
      sectionLabel="Quiénes Somos"
      onSave={handleSave}
      onCancel={cancelQuienes}
      pencilPosition="top-8 right-8"
    >
      {(isEditing) => (
        <section id="quienes-somos" className="bg-paper-soft py-20 md:py-28 lg:py-32">
          <Container>
            <div className="mb-12 md:mb-16 text-center max-w-3xl mx-auto">
              <EditableText
                as="p"
                value={quienesData.kicker}
                isEditing={isEditing}
                onChange={(val) => updateQuienes('kicker', val)}
                className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-brand-500 md:text-sm block"
              />
              <EditableText
                as="h2"
                value={quienesData.title}
                isEditing={isEditing}
                onChange={(val) => updateQuienes('title', val)}
                className="text-3xl font-light tracking-wide text-ink sm:text-4xl md:text-5xl block"
              />
              <EditableText
                as="p"
                value={quienesData.intro}
                isEditing={isEditing}
                multiline
                onChange={(val) => updateQuienes('intro', val)}
                className="mt-5 text-base font-light leading-relaxed text-ink-soft md:text-lg block"
              />
            </div>

            {/* CONF-01 — métricas de trayectoria */}
            {isEditing ? (
              <div className="border-y border-brand-500/30 bg-paper py-8 px-4 rounded-lg my-8">
                <p className="text-center font-mono text-xs uppercase text-brand-500 font-bold mb-6 tracking-widest">
                  Editar Métricas de Trayectoria
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-ink-soft block font-medium">Años de trayectoria</label>
                    <input
                      type="number"
                      value={editableMetrics.years}
                      onChange={(e) =>
                        setEditableMetrics((prev) => ({ ...prev, years: Number(e.target.value) || 0 }))
                      }
                      className="border border-brand-500/50 rounded px-3 py-1.5 text-xl font-light text-ink text-center w-32 bg-paper-soft"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-ink-soft block font-medium">m² construidos</label>
                    <input
                      type="number"
                      value={editableMetrics.m2}
                      onChange={(e) =>
                        setEditableMetrics((prev) => ({ ...prev, m2: Number(e.target.value) || 0 }))
                      }
                      className="border border-brand-500/50 rounded px-3 py-1.5 text-xl font-light text-ink text-center w-36 bg-paper-soft"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-ink-soft block font-medium">Proyectos entregados</label>
                    <input
                      type="number"
                      value={editableMetrics.projects}
                      onChange={(e) =>
                        setEditableMetrics((prev) => ({ ...prev, projects: Number(e.target.value) || 0 }))
                      }
                      className="border border-brand-500/50 rounded px-3 py-1.5 text-xl font-light text-ink text-center w-32 bg-paper-soft"
                    />
                  </div>
                </div>
              </div>
            ) : showSkeleton ? (
              <MetricsSkeleton />
            ) : loading || (metrics.years === 0 && metrics.m2 === 0 && metrics.projects === 0) ? null : (
              <div
                ref={metricsRef}
                className="grid grid-cols-1 gap-6 border-y border-hairline py-10 sm:grid-cols-3 md:gap-8 md:py-12"
              >
                {METRIC_DEFS.map((m) => (
                  <div key={m.key} className="flex flex-col items-center gap-2 text-center">
                    <p className="text-4xl font-light tracking-wide text-ink md:text-5xl">
                      <MetricCountUp value={metrics[m.key]} suffix={m.suffix} />
                    </p>
                    <p className="text-xs font-medium uppercase tracking-widest text-ink-soft">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* CONF-02 — equipo */}
            {(isTeamVisible || isEditing) && ((isTeamVisible && (showSkeleton || (!loading && team.length > 0))) || isEditing) && (
              <div className="mt-16 md:mt-20">
                {isEditing && (
                  <div className="mb-8 space-y-3">
                    <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        {isTeamVisible ? (
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
                          onClick={() => updateQuienes('teamVisible', isTeamVisible ? 'false' : 'true')}
                          className={`px-3 py-1.5 font-medium tracking-wide uppercase transition-colors rounded ${
                            isTeamVisible
                              ? 'bg-paper hover:bg-paper-soft text-ink border border-line'
                              : 'bg-brand-900 hover:bg-brand-700 text-white'
                          }`}
                        >
                          {isTeamVisible ? 'Ocultar sección' : 'Hacer visible'}
                        </button>
                        <Link
                          to="/admin/contenido"
                          className="inline-flex items-center gap-1.5 font-bold uppercase text-brand-600 hover:text-brand-700"
                        >
                          Gestionar Equipo en Panel <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {showSkeleton ? (
                  <TeamSkeleton />
                ) : loading ? null : (
                  <div
                    ref={teamRef}
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4"
                  >
                    {team.map((member) => (
                      <article key={member.id} className="group">
                        <div className="overflow-hidden bg-paper-soft">
                          <Photo
                            src={member.photo}
                            alt={member.name}
                            loading="lazy"
                            className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                        <div className="pt-5">
                          <h4 className="text-lg font-light tracking-wide text-ink">{member.name}</h4>
                          <p className="mt-1 text-xs font-medium uppercase tracking-widest text-brand-500">
                            {member.role}
                          </p>
                          <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
                            {member.bio}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Container>
        </section>
      )}
    </EditableSectionWrapper>
  );
}
