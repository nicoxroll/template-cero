// Buscador general del panel (⌘K / Ctrl+K).
//
// Por qué existe: el contenido está repartido en cinco pantallas —proyectos,
// inversiones, leads, contenido y configuración— y cada una tiene su propio
// filtro. Para encontrar "Torre Libertador" había que acordarse de que un
// proyecto vive en Proyectos y una consulta sobre ese proyecto en Leads, ir a
// cada pantalla y filtrar ahí. Acá se escribe una vez y se busca en todo.
//
// Trae los datos una sola vez al abrir y filtra en memoria. Es deliberado: el
// panel de una desarrolladora maneja decenas de registros, no millones, así que
// una consulta por tecla al servidor sería gastar red para resolver algo que
// entra holgado en el navegador — y encima con lag.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, Inbox, Search, Settings2, SquarePen, TrendingUp, X } from 'lucide-react';
import {
  investmentRepo,
  leadRepo,
  projectRepo,
  serviceRepo,
  teamRepo,
  type Investment,
  type Lead,
  type Project,
  type Service,
  type TeamMember,
} from '../../../data';
import { pauseSmoothScroll, resumeSmoothScroll } from '../../../lib/smoothScroll';

interface Resultado {
  id: string;
  titulo: string;
  detalle: string;
  seccion: string;
  destino: string;
  Icon: typeof Building2;
}

/** Normaliza para comparar: sin acentos y en minúsculas.
 *
 * Sin esto, buscar "alamos" no encuentra "Edificio Álamos", que es exactamente
 * lo que alguien va a tipear — nadie pone el acento cuando busca. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function AdminSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [datos, setDatos] = useState<{
    projects: Project[];
    investments: Investment[];
    leads: Lead[];
    services: Service[];
    team: TeamMember[];
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const cerrar = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  // ⌘K en Mac, Ctrl+K en el resto. Es el atajo que la gente ya tiene en los
  // dedos por otras herramientas; inventar uno propio sería pedirle que aprenda.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') cerrar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cerrar]);

  // Los datos se traen al ABRIR, no al montar: el panel carga cinco pantallas y
  // no tiene sentido pagar cinco consultas más en cada visita por si acaso.
  useEffect(() => {
    if (!open || datos) return;
    let vivo = true;
    void Promise.all([
      projectRepo.list(),
      investmentRepo.list(),
      leadRepo.list(),
      serviceRepo.list(),
      teamRepo.list(),
    ])
      .then(([projects, investments, leads, services, team]) => {
        if (vivo) setDatos({ projects, investments, leads, services, team });
      })
      .catch(() => {
        // Sin datos el buscador queda vacío pero abre igual: mejor eso que un
        // modal que no responde.
        if (vivo) setDatos({ projects: [], investments: [], leads: [], services: [], team: [] });
      });
    return () => {
      vivo = false;
    };
  }, [open, datos]);

  useEffect(() => {
    if (!open) {
      resumeSmoothScroll();
      return;
    }
    document.body.style.overflow = 'hidden';
    pauseSmoothScroll();
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      resumeSmoothScroll();
    };
  }, [open]);

  const resultados = useMemo<Resultado[]>(() => {
    const q = normalizar(query.trim());
    if (!datos || q.length < 2) return [];

    const coincide = (...campos: (string | null | undefined)[]) =>
      campos.some((c) => c && normalizar(c).includes(q));

    const out: Resultado[] = [];

    for (const p of datos.projects) {
      if (coincide(p.name, p.location, p.slug, p.description)) {
        out.push({
          id: 'p-' + p.slug,
          titulo: p.name,
          detalle: `${p.location}${p.published ? '' : ' · borrador'}`,
          seccion: 'Proyecto',
          destino: '/admin/proyectos',
          Icon: Building2,
        });
      }
    }

    for (const i of datos.investments) {
      if (coincide(i.title, i.slug, i.description)) {
        out.push({
          id: 'i-' + i.slug,
          titulo: i.title,
          detalle: `${i.status}${i.published ? '' : ' · borrador'}`,
          seccion: 'Inversión',
          destino: '/admin/inversiones',
          Icon: TrendingUp,
        });
      }
    }

    for (const l of datos.leads) {
      if (coincide(l.name, l.email, l.phone, l.message, l.interestSlug)) {
        out.push({
          id: 'l-' + l.id,
          titulo: l.name,
          detalle: `${l.email} · ${l.status}`,
          seccion: 'Consulta',
          destino: '/admin/leads',
          Icon: Inbox,
        });
      }
    }

    for (const s of datos.services) {
      if (coincide(s.title, s.description)) {
        out.push({
          id: 's-' + s.id,
          titulo: s.title,
          detalle: 'Servicio del sitio',
          seccion: 'Contenido',
          destino: '/admin/contenido',
          Icon: SquarePen,
        });
      }
    }

    for (const m of datos.team) {
      if (coincide(m.name, m.role, m.bio)) {
        out.push({
          id: 'm-' + m.id,
          titulo: m.name,
          detalle: m.role,
          seccion: 'Equipo',
          destino: '/admin/contenido',
          Icon: SquarePen,
        });
      }
    }

    // Las pantallas del panel también son resultados: buscar "configuracion"
    // o "leads" tiene que llevar ahí, sin obligar a usar el menú lateral.
    const PANTALLAS = [
      { titulo: 'Configuración', destino: '/admin/configuracion', Icon: Settings2 },
      { titulo: 'Proyectos', destino: '/admin/proyectos', Icon: Building2 },
      { titulo: 'Inversiones', destino: '/admin/inversiones', Icon: TrendingUp },
      { titulo: 'Leads', destino: '/admin/leads', Icon: Inbox },
      { titulo: 'Contenido', destino: '/admin/contenido', Icon: SquarePen },
    ];
    for (const p of PANTALLAS) {
      if (normalizar(p.titulo).includes(q)) {
        out.push({
          id: 'nav-' + p.destino,
          titulo: p.titulo,
          detalle: 'Ir a la sección',
          seccion: 'Panel',
          destino: p.destino,
          Icon: p.Icon,
        });
      }
    }

    return out.slice(0, 40);
  }, [datos, query]);

  const ir = (destino: string) => {
    navigate(destino);
    cerrar();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring flex w-full items-center gap-2 border border-white/15 bg-white/5 px-3 py-2 text-left text-xs font-light text-white/50 transition-colors hover:border-white/30 hover:text-white/80"
      >
        <Search size={14} strokeWidth={1.5} className="shrink-0" aria-hidden />
        <span className="flex-1 truncate">Buscar…</span>
        <kbd className="hidden shrink-0 border border-white/15 px-1.5 py-0.5 text-[0.6rem] tracking-widest text-white/40 sm:inline">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[10vh]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={cerrar}
            aria-hidden
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Buscador del panel"
            className="relative flex max-h-[70vh] w-full max-w-xl flex-col border border-line bg-paper shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Search size={18} strokeWidth={1.5} className="shrink-0 text-brand-500" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar proyectos, inversiones, consultas, equipo…"
                className="flex-1 bg-transparent text-sm font-light text-ink outline-none placeholder:text-ink-soft/50"
              />
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar buscador"
                className="p-1 text-ink-soft transition-colors hover:text-ink"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* data-lenis-prevent: el panel corre con Lenis, que se queda la
                rueda a nivel documento si no se marca el contenedor. */}
            <div data-lenis-prevent className="flex-1 overflow-y-auto">
              {query.trim().length < 2 ? (
                <p className="px-4 py-8 text-center text-xs font-light text-ink-soft">
                  Escribí al menos dos letras. Busca por nombre, ubicación, email o texto.
                </p>
              ) : !datos ? (
                <p className="px-4 py-8 text-center text-xs font-light text-ink-soft">Buscando…</p>
              ) : resultados.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs font-light text-ink-soft">
                  Sin resultados para “{query}”.
                </p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {resultados.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => ir(r.destino)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper-soft"
                      >
                        <r.Icon
                          size={16}
                          strokeWidth={1.5}
                          className="shrink-0 text-brand-500"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-light text-ink">
                            {r.titulo}
                          </span>
                          <span className="block truncate text-xs font-light text-ink-soft">
                            {r.detalle}
                          </span>
                        </span>
                        <span className="shrink-0 text-[0.6rem] font-medium uppercase tracking-widest text-ink-soft/60">
                          {r.seccion}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
