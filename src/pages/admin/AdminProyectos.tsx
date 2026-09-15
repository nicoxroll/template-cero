// ADMIN-01: CRUD de proyectos sobre projectRepo (capa mock localStorage).
// Listado con thumbnails + estado, alta/edición en side-panel, borrado con
// confirmación, skeletons anti-flash y toast de feedback.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { usePageMeta } from '../../lib/usePageMeta';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  projectRepo,
  type Project,
  type ProjectStatus,
} from '../../data';
import { Skeleton, useMinVisible } from '../../components/ui/Skeleton';
import AdminShell from '../../components/admin/shell/AdminShell';
import SidePanel from '../../components/admin/crud/SidePanel';
import ConfirmDialog from '../../components/admin/crud/ConfirmDialog';
import ProjectForm from '../../components/admin/crud/ProjectForm';
import {
  FilterSelect,
  PublishToggle,
  SearchInput,
  ViewPublicLink,
} from '../../components/admin/crud/ListControls';
import { useToast } from '../../components/admin/crud/Toast';

type PanelState = { mode: 'create' } | { mode: 'edit'; project: Project } | null;

const STATUS_OPTIONS = (Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(
  ([value, label]) => ({ value, label }),
);

type VisibilityFilter = 'publicados' | 'borradores';
const VISIBILITY_OPTIONS: ReadonlyArray<{ value: VisibilityFilter; label: string }> = [
  { value: 'publicados', label: 'Solo publicados' },
  { value: 'borradores', label: 'Solo borradores' },
];

const STATUS_BADGE: Record<Project['status'], string> = {
  'en-pozo': 'border-brand-100 bg-brand-50 text-brand-700',
  'en-obra': 'border-brand-100 bg-brand-100 text-brand-900',
  terminado: 'border-brand-900 bg-brand-900 text-white',
};

function RowsSkeleton() {
  return (
    <div aria-hidden className="divide-y divide-line border border-line bg-paper">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-12 w-16 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="hidden h-6 w-20 sm:block" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function AdminProyectos() {
  usePageMeta({ title: 'Admin — Proyectos' });

  const [projects, setProjects] = useState<Project[] | null>(null);
  const loading = projects === null;
  const showSkeleton = useMinVisible(loading);

  const [panel, setPanel] = useState<PanelState>(null);
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'todos'>('todos');
  const [visibility, setVisibility] = useState<VisibilityFilter | 'todos'>('todos');
  const [publishing, setPublishing] = useState<string | null>(null);
  const { toastEl, showToast } = useToast();

  const load = useCallback(async () => {
    setProjects(await projectRepo.list());
  }, []);

  // La carga inicial resuelve por .then() y no con `void load()`: llamar a una
  // función async en el cuerpo del efecto hace que el setState quede a ojos
  // del linter como síncrono dentro del efecto (react-hooks/set-state-in-effect).
  useEffect(() => {
    let alive = true;
    void projectRepo
      .list()
      .then((list) => {
        if (alive) setProjects(list);
      })
      // Lista vacia y no null: el estado vacio del panel explica que no hay
      // nada; el skeleton girando para siempre no explica nada.
      .catch(() => {
        if (alive) setProjects([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async (project: Project) => {
    if (panel?.mode === 'edit') {
      await projectRepo.update(panel.project.slug, project);
      showToast('Proyecto actualizado.');
    } else {
      await projectRepo.create(project);
      showToast('Proyecto creado.');
    }
    setPanel(null);
    await load();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await projectRepo.remove(toDelete.slug);
      showToast('Proyecto eliminado.');
      setToDelete(null);
      await load();
    } catch {
      showToast('No se pudo eliminar el proyecto.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (project: Project) => {
    setPublishing(project.slug);
    try {
      await projectRepo.update(project.slug, { published: !project.published });
      showToast(project.published ? 'Proyecto pasado a borrador.' : 'Proyecto publicado.');
      await load();
    } catch {
      showToast('No se pudo cambiar el estado de publicación.', 'error');
    } finally {
      setPublishing(null);
    }
  };

  const existingSlugs = (projects ?? []).map((p) => p.slug);

  // Búsqueda por nombre, ubicación y slug: los tres campos por los que el
  // equipo identifica un proyecto cuando la lista deja de entrar en pantalla.
  const filtered = useMemo(() => {
    if (!projects) return null;
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== 'todos' && p.status !== statusFilter) return false;
      if (visibility === 'publicados' && !p.published) return false;
      if (visibility === 'borradores' && p.published) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    });
  }, [projects, query, statusFilter, visibility]);

  const hasFilters = query.trim() !== '' || statusFilter !== 'todos' || visibility !== 'todos';

  return (
    <AdminShell
      title="Proyectos"
      subtitle="Los cambios se reflejan en el sitio público al navegar o recargar."
      actions={
        <button
          type="button"
          onClick={() => setPanel({ mode: 'create' })}
          className="inline-flex items-center gap-2 rounded-none bg-brand-900 px-6 py-3 text-sm font-medium uppercase tracking-widest text-white transition-all duration-300 hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden /> Nuevo proyecto
        </button>
      }
    >
      <div>
        {!loading && projects.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar por nombre, ubicación o slug"
              resultLabel={`${filtered?.length ?? 0} proyectos`}
            />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              label="Filtrar por estado de obra"
              allLabel="Todos los estados"
            />
            <FilterSelect
              value={visibility}
              onChange={setVisibility}
              options={VISIBILITY_OPTIONS}
              label="Filtrar por visibilidad"
              allLabel="Publicados y borradores"
            />
            <span className="ml-auto text-xs font-light text-ink-soft">
              {filtered?.length ?? 0} de {projects.length}
            </span>
          </div>
        )}

        {showSkeleton ? (
          <RowsSkeleton />
        ) : loading ? null : projects.length === 0 ? (
          <div className="flex flex-col items-center border border-line bg-paper px-6 py-20 text-center">
            <Building2 className="h-10 w-10 text-brand-300" aria-hidden />
            <h2 className="mt-4 text-xl font-light tracking-wide text-ink">
              Todavía no hay proyectos
            </h2>
            <p className="mt-2 max-w-sm text-sm font-light text-ink-soft">
              Cree el primer proyecto para que aparezca en el sitio público.
            </p>
            <button
              type="button"
              onClick={() => setPanel({ mode: 'create' })}
              className="mt-6 inline-flex items-center gap-2 rounded-none bg-brand-900 px-6 py-3 text-sm font-medium uppercase tracking-widest text-white transition-all duration-300 hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" aria-hidden /> Crear proyecto
            </button>
          </div>
        ) : filtered && filtered.length === 0 ? (
          <div className="flex flex-col items-center border border-line bg-paper px-6 py-16 text-center">
            <Building2 className="h-8 w-8 text-brand-300" aria-hidden />
            <p className="mt-4 text-sm font-light text-ink-soft">
              Ningún proyecto coincide con la búsqueda o los filtros aplicados.
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
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-line text-xs font-medium uppercase tracking-widest text-ink-soft">
                  <th className="px-4 py-3 font-medium">Proyecto</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Visibilidad</th>
                  <th className="px-4 py-3 font-medium">Imágenes</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(filtered ?? []).map((p) => (
                  <tr key={p.slug} className="transition-colors duration-300 hover:bg-brand-50/50 dark:hover:bg-brand-900/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <img
                          src={p.coverImage}
                          alt=""
                          loading="lazy"
                          className="h-12 w-16 shrink-0 border border-line bg-paper-soft object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-ink">{p.name}</p>
                          <p className="text-xs font-light text-ink-soft">{p.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-light text-ink-soft">
                      {PROJECT_TYPE_LABELS[p.type]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest ${STATUS_BADGE[p.status]}`}
                      >
                        {PROJECT_STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <PublishToggle
                        published={p.published}
                        name={p.name}
                        busy={publishing === p.slug}
                        onToggle={() => void handleTogglePublish(p)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-light text-ink-soft">
                        {p.gallery.length + 1}
                      </span>
                      {p.isRender && (
                        <span className="ml-2 inline-block border border-hairline px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-brand-500">
                          Render
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <ViewPublicLink
                          to={`/proyectos/${p.slug}`}
                          published={p.published}
                          name={p.name}
                        />
                        <button
                          type="button"
                          aria-label={`Editar ${p.name}`}
                          onClick={() => setPanel({ mode: 'edit', project: p })}
                          className="rounded-sm p-2 text-ink-soft transition-colors duration-300 hover:bg-paper-soft hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${p.name}`}
                          onClick={() => setToDelete(p)}
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
          </div>
        )}
      </div>

      <SidePanel
        open={panel !== null}
        title={panel?.mode === 'edit' ? 'Editar proyecto' : 'Nuevo proyecto'}
        subtitle={panel?.mode === 'edit' ? panel.project.name : undefined}
        onClose={() => setPanel(null)}
      >
        {panel && (
          <ProjectForm
            key={panel.mode === 'edit' ? panel.project.slug : 'create'}
            initial={panel.mode === 'edit' ? panel.project : undefined}
            existingSlugs={existingSlugs}
            onSubmit={handleSave}
            onCancel={() => setPanel(null)}
          />
        )}
      </SidePanel>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar proyecto"
        message={
          toDelete
            ? `"${toDelete.name}" se quitará del sitio público de forma permanente. Esta acción no se puede deshacer.`
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
