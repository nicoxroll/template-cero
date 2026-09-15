// Leads del panel (ADMIN-03): consultas de contacto (leadRepo) y suscripciones
// al newsletter (newsletterRepo), en tabs, con tabla ordenable, skeletons y
// empty states.
//
// Además de listar, el panel GESTIONA: cada consulta tiene estado en el
// pipeline comercial y notas internas, se busca y se filtra, se exporta a CSV
// y el borrado pide confirmación. Una consulta perdida es plata perdida —
// listar sin gestionar deja el seguimiento en el WhatsApp de alguien.

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Inbox,
  Mail,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
  leadRepo,
  newsletterRepo,
  type Lead,
  type LeadStatus,
  type NewsletterSub,
} from '../../data';
import { usePageMeta } from '../../lib/usePageMeta';
import { downloadCsv, stamp, toCsv } from '../../lib/csv';
import { Skeleton, useMinVisible } from '../../components/ui/Skeleton';
import AdminShell from '../../components/admin/shell/AdminShell';
import ConfirmDialog from '../../components/admin/crud/ConfirmDialog';
import { FilterSelect, SearchInput } from '../../components/admin/crud/ListControls';
import { useToast } from '../../components/admin/crud/Toast';

type Tab = 'contacto' | 'newsletter';
type SortDir = 'asc' | 'desc';

const LEAD_SOURCE_LABELS: Record<Lead['source'], string> = {
  contacto: 'Contacto',
  inversion: 'Inversión',
};

/** Cada estado del pipeline con su propio peso visual: 'nuevo' resalta (es lo
 * que hay que atender), 'descartado' se apaga. */
const STATUS_BADGE: Record<LeadStatus, string> = {
  nuevo: 'border-brand-900 bg-brand-900 text-white',
  contactado: 'border-brand-100 bg-brand-50 text-brand-700',
  calificado: 'border-brand-500 bg-brand-100 text-brand-900',
  cerrado: 'border-line bg-paper-soft text-ink-soft',
  descartado: 'border-line bg-transparent text-ink-soft/70',
};

const STATUS_OPTIONS = LEAD_STATUS_ORDER.map((value) => ({
  value,
  label: LEAD_STATUS_LABELS[value],
}));

const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DATE_FMT.format(d);
}

const TH_CLS =
  'px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-ink-soft';

function SortHeader({
  label,
  column,
  active,
  dir,
  onSort,
}: {
  label: string;
  column: string;
  active: boolean;
  dir: SortDir;
  onSort: (column: string) => void;
}) {
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th scope="col" className={TH_CLS} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`group inline-flex items-center gap-1.5 uppercase tracking-widest transition-colors duration-300 ${
          active ? 'text-ink' : 'hover:text-ink'
        }`}
      >
        {label}
        <Icon
          size={12}
          strokeWidth={1.5}
          className={active ? 'text-brand-500' : 'text-ink-soft/40 transition-colors duration-300 group-hover:text-ink-soft'}
          aria-hidden
        />
      </button>
    </th>
  );
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div aria-hidden className="border border-line bg-paper">
      <div className="border-b border-line px-4 py-3">
        <Skeleton className="h-4 w-2/5" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="grid items-center gap-4 border-b border-line px-4 py-4 last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-4 ${j === 0 ? 'w-4/5' : 'w-3/5'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof Inbox; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center border border-line bg-paper px-6 py-20 text-center">
      <span className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-brand-500 dark:border-brand-700/40 dark:bg-brand-900/40 dark:text-brand-300">
        <Icon size={22} strokeWidth={1.5} aria-hidden />
      </span>
      <h2 className="text-xl font-light tracking-wide text-ink">{title}</h2>
      <p className="mt-3 max-w-sm text-sm font-light leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

function compare(a: string, b: string, dir: SortDir): number {
  const r = a.localeCompare(b, 'es', { sensitivity: 'base' });
  return dir === 'asc' ? r : -r;
}

/** Fila expandible: mensaje del visitante + notas internas editables. */
function LeadDetail({
  lead,
  onSaveNotes,
}: {
  lead: Lead;
  onSaveNotes: (notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [saving, setSaving] = useState(false);
  const dirty = notes !== (lead.notes ?? '');

  return (
    <div className="grid gap-6 bg-paper-soft/40 px-4 py-5 md:grid-cols-2">
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-widest text-ink-soft">
          Mensaje del visitante
        </h4>
        <p className="text-sm font-light leading-relaxed text-ink-soft">
          {lead.message || 'Sin mensaje.'}
        </p>
      </div>
      <div>
        <label
          htmlFor={`notes-${lead.id}`}
          className="mb-2 block text-xs font-medium uppercase tracking-widest text-ink-soft"
        >
          Notas internas
        </label>
        <textarea
          id={`notes-${lead.id}`}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Qué se habló, próximos pasos, presupuesto estimado…"
          className="w-full rounded-none border border-line bg-paper px-3 py-2 text-sm font-light text-ink placeholder:text-ink-soft/50 transition-colors focus:border-brand-500 focus:outline-none"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSaveNotes(notes);
              } finally {
                setSaving(false);
              }
            }}
            className="border border-ink px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar nota'}
          </button>
          <span className="text-xs font-light text-ink-soft/70">
            Solo visible en el panel — nunca se publica.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminLeads() {
  usePageMeta({ title: 'Admin — Leads' });

  const [tab, setTab] = useState<Tab>('contacto');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [subs, setSubs] = useState<NewsletterSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'todos'>('todos');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<
    { kind: 'lead'; lead: Lead } | { kind: 'sub'; sub: NewsletterSub } | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const showSkeleton = useMinVisible(loading);
  const { toastEl, showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    Promise.all([leadRepo.list(), newsletterRepo.list()])
      .then(([l, n]) => {
        if (cancelled) return;
        setLeads(l);
        setSubs(n);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSort = useCallback(
    (column: string) => {
      if (column === sortCol) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortCol(column);
        setSortDir(column === 'createdAt' ? 'desc' : 'asc');
      }
    },
    [sortCol],
  );

  const switchTab = (next: Tab) => {
    setTab(next);
    setSortCol('createdAt');
    setSortDir('desc');
    setQuery('');
    setExpanded(null);
  };

  const visibleLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    const col = sortCol as keyof Lead;
    return leads
      .filter((l) => {
        if (statusFilter !== 'todos' && l.status !== statusFilter) return false;
        if (!q) return true;
        return (
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => compare(String(a[col] ?? ''), String(b[col] ?? ''), sortDir));
  }, [leads, query, statusFilter, sortCol, sortDir]);

  const visibleSubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const col = sortCol as keyof NewsletterSub;
    return subs
      .filter((s) => !q || s.email.toLowerCase().includes(q))
      .sort((a, b) => compare(String(a[col] ?? ''), String(b[col] ?? ''), sortDir));
  }, [subs, query, sortCol, sortDir]);

  const changeStatus = async (lead: Lead, status: LeadStatus) => {
    // Optimista: cambiar de estado es la acción más repetida del panel y
    // esperar 500 ms de latencia simulada por cada click la vuelve pesada.
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    try {
      await leadRepo.update(lead.id, { status });
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)));
      showToast('No se pudo actualizar el estado.', 'error');
    }
  };

  const saveNotes = async (lead: Lead, notes: string) => {
    try {
      const updated = await leadRepo.update(lead.id, { notes });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
      showToast('Nota guardada.');
    } catch {
      showToast('No se pudo guardar la nota.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      if (toDelete.kind === 'lead') {
        await leadRepo.remove(toDelete.lead.id);
        setLeads((prev) => prev.filter((l) => l.id !== toDelete.lead.id));
        showToast('Consulta eliminada.');
      } else {
        await newsletterRepo.remove(toDelete.sub.id);
        setSubs((prev) => prev.filter((s) => s.id !== toDelete.sub.id));
        showToast('Suscripción eliminada.');
      }
      setToDelete(null);
    } catch {
      showToast('No se pudo eliminar.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const exportLeads = () => {
    downloadCsv(
      `leads-${stamp()}.csv`,
      toCsv(visibleLeads, [
        { header: 'Nombre', value: (l) => l.name },
        { header: 'Email', value: (l) => l.email },
        { header: 'Teléfono', value: (l) => l.phone },
        { header: 'Origen', value: (l) => LEAD_SOURCE_LABELS[l.source] },
        { header: 'Interés', value: (l) => l.interestSlug ?? '' },
        { header: 'Estado', value: (l) => LEAD_STATUS_LABELS[l.status] },
        { header: 'Mensaje', value: (l) => l.message },
        { header: 'Notas internas', value: (l) => l.notes ?? '' },
        { header: 'Fecha', value: (l) => formatDate(l.createdAt) },
      ]),
    );
    showToast(`${visibleLeads.length} consultas exportadas.`);
  };

  const exportSubs = () => {
    downloadCsv(
      `newsletter-${stamp()}.csv`,
      toCsv(visibleSubs, [
        { header: 'Email', value: (s) => s.email },
        { header: 'Fecha de alta', value: (s) => formatDate(s.createdAt) },
      ]),
    );
    showToast(`${visibleSubs.length} suscripciones exportadas.`);
  };

  // Contadores del pipeline: de un vistazo, cuántas consultas esperan respuesta.
  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(LEAD_STATUS_ORDER.map((s) => [s, 0])) as Record<
      LeadStatus,
      number
    >;
    leads.forEach((l) => {
      counts[l.status] = (counts[l.status] ?? 0) + 1;
    });
    return counts;
  }, [leads]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'contacto', label: 'Consultas', count: leads.length },
    { key: 'newsletter', label: 'Newsletter', count: subs.length },
  ];

  const currentCount = tab === 'contacto' ? visibleLeads.length : visibleSubs.length;

  return (
    <AdminShell
      title="Leads"
      subtitle="Consultas recibidas por el formulario de contacto y suscripciones al aviso de nuevas oportunidades."
      actions={
        <button
          type="button"
          onClick={tab === 'contacto' ? exportLeads : exportSubs}
          disabled={currentCount === 0}
          className="inline-flex items-center gap-2 rounded-none border border-ink px-6 py-3 text-sm font-medium uppercase tracking-widest text-ink transition-all duration-300 hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-40"
        >
          <Download className="h-4 w-4" aria-hidden /> Exportar CSV
        </button>
      }
    >
      {/* Tabs */}
      <div role="tablist" aria-label="Tipo de leads" className="mb-6 flex border-b border-line">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => switchTab(key)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-medium uppercase tracking-widest transition-colors duration-300 ${
              tab === key
                ? 'border-brand-900 text-ink dark:border-brand-500'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {label}
            {!loading && (
              <span
                className={`inline-flex min-w-6 justify-center rounded-sm px-1.5 py-0.5 text-[0.65rem] tracking-normal transition-colors duration-300 ${
                  tab === key ? 'bg-brand-100 text-brand-700' : 'bg-paper-soft text-ink-soft'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pipeline + búsqueda */}
      {!loading && tab === 'contacto' && leads.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {LEAD_STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(statusFilter === s ? 'todos' : s)}
                aria-pressed={statusFilter === s}
                className={`border px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest transition-colors duration-300 ${
                  statusFilter === s
                    ? STATUS_BADGE[s]
                    : 'border-line bg-paper text-ink-soft hover:border-brand-500 hover:text-ink'
                }`}
              >
                {LEAD_STATUS_LABELS[s]} <span className="tabular-nums">({statusCounts[s]})</span>
              </button>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar por nombre, email, teléfono o mensaje"
              resultLabel={`${visibleLeads.length} consultas`}
            />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              label="Filtrar por estado"
              allLabel="Todos los estados"
            />
            <span className="ml-auto text-xs font-light text-ink-soft">
              {visibleLeads.length} de {leads.length}
            </span>
          </div>
        </>
      )}

      {!loading && tab === 'newsletter' && subs.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar por email"
            resultLabel={`${visibleSubs.length} suscripciones`}
          />
          <span className="ml-auto text-xs font-light text-ink-soft">
            {visibleSubs.length} de {subs.length}
          </span>
        </div>
      )}

      {showSkeleton ? (
        <TableSkeleton cols={tab === 'contacto' ? 6 : 3} />
      ) : loading ? null : tab === 'contacto' ? (
        leads.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Sin consultas por ahora"
            body="Cuando un visitante envíe el formulario de contacto o consulte por una inversión, va a aparecer acá."
          />
        ) : visibleLeads.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Ninguna consulta coincide"
            body="Probá con otro término de búsqueda o quitá el filtro de estado."
          />
        ) : (
          <div data-lenis-prevent className="overflow-x-auto border border-line bg-paper">
            <table className="w-full min-w-[68rem] text-left">
              <thead className="border-b border-line bg-paper-soft/60">
                <tr>
                  <SortHeader label="Nombre" column="name" active={sortCol === 'name'} dir={sortDir} onSort={handleSort} />
                  <SortHeader label="Email" column="email" active={sortCol === 'email'} dir={sortDir} onSort={handleSort} />
                  <th scope="col" className={TH_CLS}>Teléfono</th>
                  <SortHeader label="Origen" column="source" active={sortCol === 'source'} dir={sortDir} onSort={handleSort} />
                  <SortHeader label="Estado" column="status" active={sortCol === 'status'} dir={sortDir} onSort={handleSort} />
                  <SortHeader label="Fecha" column="createdAt" active={sortCol === 'createdAt'} dir={sortDir} onSort={handleSort} />
                  <th scope="col" className={TH_CLS}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleLeads.map((lead) => (
                  // Fragment con key: cada lead emite dos <tr> hermanos (fila +
                  // detalle expandido) y no pueden envolverse en un <div>
                  // dentro de <tbody> sin romper la tabla.
                  <Fragment key={lead.id}>
                    <tr className="group border-b border-line align-top transition-colors duration-300 hover:bg-brand-50/50 dark:hover:bg-brand-900/30">
                      <td className="px-4 py-4 text-sm font-light text-ink">{lead.name}</td>
                      <td className="px-4 py-4 text-sm font-light text-ink-soft">
                        <a
                          href={`mailto:${lead.email}`}
                          className="transition-colors duration-300 hover:text-brand-700 dark:hover:text-brand-300"
                        >
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm font-light text-ink-soft">{lead.phone || '—'}</td>
                      <td className="px-4 py-4">
                        <span className="inline-block border border-brand-100 bg-brand-50 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-widest text-brand-700">
                          {LEAD_SOURCE_LABELS[lead.source]}
                        </span>
                        {lead.interestSlug && (
                          <span className="mt-1 block text-xs font-light text-ink-soft">{lead.interestSlug}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => void changeStatus(lead, e.target.value as LeadStatus)}
                          aria-label={`Estado de ${lead.name}`}
                          className={`cursor-pointer border px-2 py-1 text-[0.65rem] font-medium uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${STATUS_BADGE[lead.status]}`}
                        >
                          {LEAD_STATUS_ORDER.map((s) => (
                            <option key={s} value={s} className="bg-paper text-ink">
                              {LEAD_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-light text-ink-soft">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                            aria-expanded={expanded === lead.id}
                            aria-label={`Ver mensaje y notas de ${lead.name}`}
                            className={`p-1.5 transition-colors duration-300 hover:text-brand-700 dark:hover:text-brand-300 ${
                              lead.notes ? 'text-brand-500' : 'text-ink-soft'
                            }`}
                          >
                            <MessageSquare size={15} strokeWidth={1.5} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete({ kind: 'lead', lead })}
                            aria-label={`Eliminar consulta de ${lead.name}`}
                            className="p-1.5 text-ink-soft opacity-0 transition-all duration-300 hover:text-red-700 focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Trash2 size={15} strokeWidth={1.5} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded === lead.id && (
                      <tr className="border-b border-line">
                        <td colSpan={7} className="p-0">
                          <LeadDetail lead={lead} onSaveNotes={(notes) => saveNotes(lead, notes)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : subs.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Sin suscripciones por ahora"
          body="Los emails que se registren en «avisarme de nuevas oportunidades» van a aparecer acá."
        />
      ) : visibleSubs.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Ningún email coincide"
          body="Probá con otro término de búsqueda."
        />
      ) : (
        <div data-lenis-prevent className="overflow-x-auto border border-line bg-paper">
          <table className="w-full min-w-[36rem] text-left">
            <thead className="border-b border-line bg-paper-soft/60">
              <tr>
                <SortHeader label="Email" column="email" active={sortCol === 'email'} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Fecha de alta" column="createdAt" active={sortCol === 'createdAt'} dir={sortDir} onSort={handleSort} />
                <th scope="col" className={TH_CLS}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleSubs.map((sub) => (
                <tr
                  key={sub.id}
                  className="group border-b border-line transition-colors duration-300 last:border-b-0 hover:bg-brand-50/50 dark:hover:bg-brand-900/30"
                >
                  <td className="px-4 py-4 text-sm font-light text-ink">{sub.email}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-light text-ink-soft">
                    {formatDate(sub.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setToDelete({ kind: 'sub', sub })}
                      aria-label={`Eliminar suscripción ${sub.email}`}
                      className="p-1.5 text-ink-soft opacity-0 transition-all duration-300 hover:text-red-700 focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 size={15} strokeWidth={1.5} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Borrar un lead destruye una consulta comercial: mismo trato que los
          proyectos, que ya pedían confirmación. */}
      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete?.kind === 'sub' ? 'Eliminar suscripción' : 'Eliminar consulta'}
        message={
          toDelete === null
            ? ''
            : toDelete.kind === 'sub'
              ? `Se eliminará la suscripción de ${toDelete.sub.email}. Esta acción no se puede deshacer.`
              : `Se eliminará la consulta de ${toDelete.lead.name} (${toDelete.lead.email}), incluidas sus notas internas. Esta acción no se puede deshacer.`
        }
        busy={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setToDelete(null)}
      />

      {toastEl}
    </AdminShell>
  );
}
