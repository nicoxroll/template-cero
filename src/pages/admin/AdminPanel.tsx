// Panel de inicio del admin: el estado del sitio de un vistazo.
// Es la vista que la referencia realstack no tiene — entra al CRUD directo.
// Acá lo primero que ve el equipo es qué está publicado, qué quedó en borrador
// y qué consultas están sin responder, con accesos directos a resolverlo.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Building2,
  FileWarning,
  Inbox,
  Mail,
  TrendingUp,
} from 'lucide-react';
import {
  LEAD_STATUS_LABELS,
  investmentRepo,
  leadRepo,
  newsletterRepo,
  projectRepo,
  type Investment,
  type Lead,
  type NewsletterSub,
  type Project,
} from '../../data';
import { usePageMeta } from '../../lib/usePageMeta';
import { Skeleton, useMinVisible } from '../../components/ui/Skeleton';
import AdminShell from '../../components/admin/shell/AdminShell';

const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DATE_FMT.format(d);
}

interface StatProps {
  icon: typeof Building2;
  label: string;
  value: number | string;
  /** Segunda línea: el dato accionable (borradores pendientes, sin responder…). */
  hint?: string;
  /** Resalta la tarjeta cuando el hint exige atención. */
  alert?: boolean;
  to: string;
}

function Stat({ icon: Icon, label, value, hint, alert = false, to }: StatProps) {
  return (
    <Link
      to={to}
      className={`group flex flex-col border bg-paper p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        alert ? 'border-brand-500' : 'border-line hover:border-brand-500/50'
      }`}
    >
      <span className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-brand-500" strokeWidth={1.5} aria-hidden />
        <ArrowRight
          className="h-4 w-4 text-ink-soft/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand-500"
          aria-hidden
        />
      </span>
      <span className="mt-6 text-4xl font-light tabular-nums tracking-wide text-ink">{value}</span>
      <span className="mt-2 text-xs font-medium uppercase tracking-widest text-ink-soft">
        {label}
      </span>
      {hint && (
        <span
          className={`mt-3 text-xs font-light ${alert ? 'text-brand-700 dark:text-brand-300' : 'text-ink-soft/70'}`}
        >
          {hint}
        </span>
      )}
    </Link>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-line bg-paper p-6">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="mt-6 h-10 w-16" />
            <Skeleton className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-line bg-paper p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-hairline last:border-0">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="border border-line bg-paper p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-hairline last:border-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  usePageMeta({ title: 'Admin — Panel' });

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [investments, setInvestments] = useState<Investment[] | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [subs, setSubs] = useState<NewsletterSub[] | null>(null);

  const loading =
    projects === null || investments === null || leads === null || subs === null;
  const showSkeleton = useMinVisible(loading);

  // Ventana de "últimos 30 días" congelada al montar: leerla en el render
  // (Date.now() dentro de un useMemo) haría que el mismo dato diera resultados
  // distintos entre renders.
  const [recentCutoff, setRecentCutoff] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([
      projectRepo.list(),
      investmentRepo.list(),
      leadRepo.list(),
      newsletterRepo.list(),
    ])
      .then(([p, i, l, n]) => {
        if (!alive) return;
        setRecentCutoff(Date.now() - 30 * 24 * 60 * 60 * 1000);
        setProjects(p);
        setInvestments(i);
        setLeads(l);
        setSubs(n);
      })
      // Estado terminal: el panel muestra ceros y las listas vacias en vez de
      // quedar en skeleton para siempre si se cae la conexion.
      .catch(() => {
        if (!alive) return;
        setProjects([]);
        setInvestments([]);
        setLeads([]);
        setSubs([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (loading) return null;
    const draftProjects = projects.filter((p) => !p.published).length;
    const draftInvestments = investments.filter((i) => !i.published).length;
    const activeInvestments = investments.filter((i) => i.published && i.status === 'activa').length;
    const newLeads = leads.filter((l) => l.status === 'nuevo').length;

    // Consultas de los últimos 30 días: la ventana con la que se mide si la
    // captación está funcionando, no el acumulado histórico.
    const recentLeads = leads.filter(
      (l) => new Date(l.createdAt).getTime() >= recentCutoff,
    ).length;

    return {
      projects: projects.length,
      publishedProjects: projects.length - draftProjects,
      draftProjects,
      investments: investments.length,
      activeInvestments,
      draftInvestments,
      leads: leads.length,
      newLeads,
      recentLeads,
      subs: subs.length,
    };
  }, [loading, projects, investments, leads, subs, recentCutoff]);

  const latestLeads = useMemo(() => {
    if (!leads) return [];
    return [...leads]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, [leads]);

  const drafts = useMemo(() => {
    if (!projects || !investments) return [];
    return [
      ...projects
        .filter((p) => !p.published)
        .map((p) => ({ key: `p-${p.slug}`, name: p.name, kind: 'Proyecto', to: '/admin/proyectos' })),
      ...investments
        .filter((i) => !i.published)
        .map((i) => ({ key: `i-${i.slug}`, name: i.title, kind: 'Inversión', to: '/admin/inversiones' })),
    ];
  }, [projects, investments]);

  return (
    <AdminShell
      title="Panel"
      subtitle="Estado del sitio, borradores pendientes de publicar y últimas consultas recibidas."
    >
      {showSkeleton || !stats ? (
        <StatsSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={Building2}
              label="Proyectos"
              value={stats.projects}
              hint={
                stats.draftProjects > 0
                  ? `${stats.draftProjects} en borrador, ${stats.publishedProjects} publicados`
                  : `${stats.publishedProjects} publicados`
              }
              alert={stats.draftProjects > 0}
              to="/admin/proyectos"
            />
            <Stat
              icon={TrendingUp}
              label="Inversiones"
              value={stats.investments}
              hint={
                stats.draftInvestments > 0
                  ? `${stats.draftInvestments} en borrador, ${stats.activeInvestments} activas`
                  : `${stats.activeInvestments} activas en el sitio`
              }
              alert={stats.draftInvestments > 0}
              to="/admin/inversiones"
            />
            <Stat
              icon={Inbox}
              label="Consultas"
              value={stats.leads}
              hint={
                stats.newLeads > 0
                  ? `${stats.newLeads} sin responder`
                  : `${stats.recentLeads} en los últimos 30 días`
              }
              alert={stats.newLeads > 0}
              to="/admin/leads"
            />
            <Stat
              icon={Mail}
              label="Newsletter"
              value={stats.subs}
              hint="Suscriptores a nuevas oportunidades"
              to="/admin/leads"
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Pendientes de publicar */}
            <section className="border border-line bg-paper">
              <header className="flex items-center gap-2 border-b border-line px-5 py-4">
                <FileWarning className="h-4 w-4 text-brand-500" strokeWidth={1.5} aria-hidden />
                <h2 className="text-xs font-medium uppercase tracking-widest text-ink">
                  Pendientes de publicar
                </h2>
              </header>
              {drafts.length === 0 ? (
                <p className="px-5 py-8 text-sm font-light text-ink-soft">
                  No hay borradores: todo lo cargado está publicado en el sitio.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {drafts.map((d) => (
                    <li key={d.key}>
                      <Link
                        to={d.to}
                        className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-brand-50/50 dark:hover:bg-brand-900/30"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-light text-ink">{d.name}</span>
                          <span className="text-xs font-light text-ink-soft">{d.kind}</span>
                        </span>
                        <span className="shrink-0 border border-line bg-paper-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-ink-soft">
                          Borrador
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Últimas consultas */}
            <section className="border border-line bg-paper">
              <header className="flex items-center justify-between border-b border-line px-5 py-4">
                <span className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-brand-500" strokeWidth={1.5} aria-hidden />
                  <h2 className="text-xs font-medium uppercase tracking-widest text-ink">
                    Últimas consultas
                  </h2>
                </span>
                <Link
                  to="/admin/leads"
                  className="text-xs font-medium uppercase tracking-widest text-brand-500 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
                >
                  Ver todas
                </Link>
              </header>
              {latestLeads.length === 0 ? (
                <p className="px-5 py-8 text-sm font-light text-ink-soft">
                  Todavía no llegaron consultas por el formulario.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {latestLeads.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-light text-ink">{l.name}</span>
                        <span className="block truncate text-xs font-light text-ink-soft">
                          {l.email}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[10px] font-medium uppercase tracking-widest text-brand-500">
                          {LEAD_STATUS_LABELS[l.status]}
                        </span>
                        <span className="block text-xs font-light text-ink-soft">
                          {formatDate(l.createdAt)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </AdminShell>
  );
}
