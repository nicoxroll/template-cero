// ADMIN-02: CRUD de oportunidades de inversión sobre investmentRepo (mock localStorage).
// Mismo patrón que AdminProyectos: listado, side-panel de alta/edición,
// confirmación de borrado, skeletons anti-flash y toast.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import { usePageMeta } from '../../lib/usePageMeta';
import {
  INVESTMENT_STATUS_LABELS,
  investmentRepo,
  projectRepo,
  type Investment,
  type InvestmentStatus,
  type Project,
} from '../../data';
import { Skeleton, useMinVisible } from '../../components/ui/Skeleton';
import AdminShell from '../../components/admin/shell/AdminShell';
import ReturnDisclaimer from '../../components/inversiones/ReturnDisclaimer';
import SidePanel from '../../components/admin/crud/SidePanel';
import ConfirmDialog from '../../components/admin/crud/ConfirmDialog';
import InvestmentForm from '../../components/admin/crud/InvestmentForm';
import {
  FilterSelect,
  PublishToggle,
  SearchInput,
  ViewPublicLink,
} from '../../components/admin/crud/ListControls';
import { useToast } from '../../components/admin/crud/Toast';

type PanelState = { mode: 'create' } | { mode: 'edit'; investment: Investment } | null;

const STATUS_BADGE: Record<Investment['status'], string> = {
  activa: 'border-brand-900 bg-brand-900 text-white',
  proximamente: 'border-brand-100 bg-brand-50 text-brand-700',
  cerrada: 'border-line bg-paper-soft text-ink-soft',
};

const STATUS_OPTIONS = (Object.entries(INVESTMENT_STATUS_LABELS) as [InvestmentStatus, string][]).map(
  ([value, label]) => ({ value, label }),
);

type VisibilityFilter = 'publicadas' | 'borradores';
const VISIBILITY_OPTIONS: ReadonlyArray<{ value: VisibilityFilter; label: string }> = [
  { value: 'publicadas', label: 'Solo publicadas' },
  { value: 'borradores', label: 'Solo borradores' },
];

function formatAmount(inv: Investment): string {
  return `${inv.currency} ${inv.amount.toLocaleString('es-AR')}`;
}

function RowsSkeleton() {
  return (
    <div aria-hidden className="divide-y divide-line border border-line bg-paper">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-12 w-16 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="hidden h-6 w-24 sm:block" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function AdminInversiones() {
  usePageMeta({ title: 'Admin — Inversiones' });

  const [investments, setInvestments] = useState<Investment[] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const loading = investments === null;
  const showSkeleton = useMinVisible(loading);

  const [panel, setPanel] = useState<PanelState>(null);
  const [toDelete, setToDelete] = useState<Investment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvestmentStatus | 'todos'>('todos');
  const [visibility, setVisibility] = useState<VisibilityFilter | 'todos'>('todos');
  const [publishing, setPublishing] = useState<string | null>(null);
  const { toastEl, showToast } = useToast();

  const load = useCallback(async () => {
    setInvestments(await investmentRepo.list());
  }, []);

  // La carga inicial resuelve por .then() y no con `void load()`: llamar a una
  // función async en el cuerpo del efecto hace que el setState quede a ojos
  // del linter como síncrono dentro del efecto (react-hooks/set-state-in-effect).
  useEffect(() => {
    let alive = true;
    void Promise.all([investmentRepo.list(), projectRepo.list()])
      .then(([invs, projs]) => {
        if (!alive) return;
        setInvestments(invs);
        // Proyectos: solo para el select de vinculación del formulario.
        setProjects(projs);
      })
      .catch(() => {
        if (alive) setInvestments([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async (investment: Investment) => {
    if (panel?.mode === 'edit') {
      await investmentRepo.update(panel.investment.slug, investment);
      showToast('Oportunidad actualizada.');
    } else {
      await investmentRepo.create(investment);
      showToast('Oportunidad creada.');
    }
    setPanel(null);
    await load();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await investmentRepo.remove(toDelete.slug);
      showToast('Oportunidad eliminada.');
      setToDelete(null);
      await load();
    } catch {
      showToast('No se pudo eliminar la oportunidad.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (inv: Investment) => {
    setPublishing(inv.slug);
    try {
      await investmentRepo.update(inv.slug, { published: !inv.published });
      showToast(inv.published ? 'Oportunidad pasada a borrador.' : 'Oportunidad publicada.');
      await load();
    } catch {
      showToast('No se pudo cambiar el estado de publicación.', 'error');
    } finally {
      setPublishing(null);
    }
  };

  const existingSlugs = (investments ?? []).map((i) => i.slug);
  const filtered = useMemo(() => {
    if (!investments) return null;
    const q = query.trim().toLowerCase();
    return investments.filter((inv) => {
      if (statusFilter !== 'todos' && inv.status !== statusFilter) return false;
      if (visibility === 'publicadas' && !inv.published) return false;
      if (visibility === 'borradores' && inv.published) return false;
      if (!q) return true;
      return inv.title.toLowerCase().includes(q) || inv.slug.toLowerCase().includes(q);
    });
  }, [investments, query, statusFilter, visibility]);

  const hasFilters = query.trim() !== '' || statusFilter !== 'todos' || visibility !== 'todos';

  const projectName = (slug: string | null) =>
    slug ? (projects.find((p) => p.slug === slug)?.name ?? slug) : '—';

  return (
    <AdminShell
      title="Inversiones"
      subtitle="Toda cifra de retorno se publica como estimación, nunca como garantía."
      actions={
        <button
          type="button"
          onClick={() => setPanel({ mode: 'create' })}
          className="inline-flex items-center gap-2 rounded-none bg-brand-900 px-6 py-3 text-sm font-medium uppercase tracking-widest text-white transition-all duration-300 hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden /> Nueva oportunidad
        </button>
      }
    >
      <div>
        {!loading && investments.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar por título o slug"
              resultLabel={`${filtered?.length ?? 0} oportunidades`}
            />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              label="Filtrar por estado"
              allLabel="Todos los estados"
            />
            <FilterSelect
              value={visibility}
              onChange={setVisibility}
              options={VISIBILITY_OPTIONS}
              label="Filtrar por visibilidad"
              allLabel="Publicadas y borradores"
            />
            <span className="ml-auto text-xs font-light text-ink-soft">
              {filtered?.length ?? 0} de {investments.length}
            </span>
          </div>
        )}

        {showSkeleton ? (
          <RowsSkeleton />
        ) : loading ? null : investments.length === 0 ? (
          <div className="flex flex-col items-center border border-line bg-paper px-6 py-20 text-center">
            <Landmark className="h-10 w-10 text-brand-300" aria-hidden />
            <h2 className="mt-4 text-xl font-light tracking-wide text-ink">
              Todavía no hay oportunidades
            </h2>
            <p className="mt-2 max-w-sm text-sm font-light text-ink-soft">
              Cree la primera oportunidad de inversión para publicarla en el sitio.
            </p>
            <button
              type="button"
              onClick={() => setPanel({ mode: 'create' })}
              className="mt-6 inline-flex items-center gap-2 rounded-none bg-brand-900 px-6 py-3 text-sm font-medium uppercase tracking-widest text-white transition-all duration-300 hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" aria-hidden /> Crear oportunidad
            </button>
          </div>
        ) : filtered && filtered.length === 0 ? (
          <div className="flex flex-col items-center border border-line bg-paper px-6 py-16 text-center">
            <Landmark className="h-8 w-8 text-brand-300" aria-hidden />
            <p className="mt-4 text-sm font-light text-ink-soft">
              Ninguna oportunidad coincide con la búsqueda o los filtros aplicados.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('todos');
                  setVisibility('todos');
                }}
                className="mt-4 text-xs font-medium uppercase tracking-widest text-brand-500 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div data-lenis-prevent className="overflow-x-auto border border-line bg-paper">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-line text-xs font-medium uppercase tracking-widest text-ink-soft">
                  <th className="px-4 py-3 font-medium">Oportunidad</th>
                  <th className="px-4 py-3 font-medium">Monto mínimo</th>
                  <th className="px-4 py-3 font-medium">Retorno estimado</th>
                  <th className="px-4 py-3 font-medium">Plazo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Visibilidad</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(filtered ?? []).map((inv) => (
                  <tr key={inv.slug} className="transition-colors duration-300 hover:bg-brand-50/50 dark:hover:bg-brand-900/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <img
                          src={inv.coverImage}
                          alt=""
                          loading="lazy"
                          className="h-12 w-16 shrink-0 border border-line bg-paper-soft object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-ink">{inv.title}</p>
                          <p className="text-xs font-light text-ink-soft">
                            {projectName(inv.projectSlug)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-light text-ink">
                      {formatAmount(inv)}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-sm font-light text-ink-soft">
                      {inv.estReturn}
                    </td>
                    <td className="px-4 py-3 text-sm font-light text-ink-soft">
                      {inv.termMonths} meses
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest ${STATUS_BADGE[inv.status]}`}
                      >
                        {INVESTMENT_STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <PublishToggle
                        published={inv.published}
                        name={inv.title}
                        busy={publishing === inv.slug}
                        onToggle={() => void handleTogglePublish(inv)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <ViewPublicLink
                          to={`/inversiones/${inv.slug}`}
                          published={inv.published}
                          name={inv.title}
                        />
                        <button
                          type="button"
                          aria-label={`Editar ${inv.title}`}
                          onClick={() => setPanel({ mode: 'edit', investment: inv })}
                          className="rounded-sm p-2 text-ink-soft transition-colors duration-300 hover:bg-paper-soft hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${inv.title}`}
                          onClick={() => setToDelete(inv)}
                          className="rounded-sm p-2 text-ink-soft transition-colors duration-300 hover:bg-paper-soft hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* INV-03: disclaimer también junto a las cifras del admin */}
            <ReturnDisclaimer className="border-t border-line px-4 py-3" />
          </div>
        )}
      </div>

      <SidePanel
        open={panel !== null}
        title={panel?.mode === 'edit' ? 'Editar oportunidad' : 'Nueva oportunidad'}
        subtitle={panel?.mode === 'edit' ? panel.investment.title : undefined}
        onClose={() => setPanel(null)}
      >
        {panel && (
          <InvestmentForm
            key={panel.mode === 'edit' ? panel.investment.slug : 'create'}
            initial={panel.mode === 'edit' ? panel.investment : undefined}
            existingSlugs={existingSlugs}
            projects={projects}
            onSubmit={handleSave}
            onCancel={() => setPanel(null)}
          />
        )}
      </SidePanel>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar oportunidad"
        message={
          toDelete
            ? `"${toDelete.title}" se quitará del sitio público de forma permanente. Esta acción no se puede deshacer.`
            : ''
        }
        busy={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setToDelete(null)}
      />

      {toastEl}
    </AdminShell>
  );
}
