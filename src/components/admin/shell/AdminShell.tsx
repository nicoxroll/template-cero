// Shell del panel de administración (ADMIN-04): guard de sesión + sidebar + header de página.
// Toda página /admin/* (salvo el login) se envuelve en <AdminShell>.

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Link, Navigate, NavLink, useNavigate } from 'react-router';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Inbox,
  Info,
  LayoutDashboard,
  LogOut,
  Settings2,
  SquarePen,
  TrendingUp,
} from 'lucide-react';
import { gsap } from '../../../lib/gsapReveal';
import { prefersReducedMotion } from '../../../lib/useReducedMotion';
import { getSession, isAuthenticated, isAuthReady, logout } from './adminAuth';
import { USING_REAL_BACKEND, isBackendDegraded, subscribeBackendStatus } from '../../../data';
import ThemeToggle from '../../ui/ThemeToggle';
import LogoMark from '../../ui/LogoMark';
import AdminSearch from './AdminSearch';
import { siteConfig } from '../../../config/site';
import AdminSessionModal from './AdminSessionModal';


const NAV_ITEMS = [
  { to: '/admin/panel', label: 'Panel', icon: LayoutDashboard },
  { to: '/admin/proyectos', label: 'Proyectos', icon: Building2 },
  { to: '/admin/inversiones', label: 'Inversiones', icon: TrendingUp },
  { to: '/admin/leads', label: 'Leads', icon: Inbox },
  { to: '/admin/contenido', label: 'Contenido', icon: SquarePen },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings2 },
] as const;

interface AdminShellProps {
  /** Título de la vista (header de página) */
  title: string;
  /** Bajada opcional bajo el título */
  subtitle?: string;
  /** Acciones a la derecha del header (botones, etc.) */
  actions?: ReactNode;
  children: ReactNode;
}

export default function AdminShell({ title, subtitle, actions, children }: AdminShellProps) {
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const session = getSession();

  // useSyncExternalStore y no un useState + useEffect: la degradación se
  // descubre cuando falla la primera lectura, que puede ser antes o después de
  // que monte este componente. La suscripción cubre los dos casos sin carreras.
  const degraded = useSyncExternalStore(
    subscribeBackendStatus,
    isBackendDegraded,
    () => false,
  );

  // Tres estados posibles, y los tres se muestran. Un panel que sólo avisa
  // cuando algo falla obliga a adivinar el caso bueno.
  const backend = !USING_REAL_BACKEND
    ? {
        etiqueta: 'Modo demostración',
        detalle:
          'Sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY: los datos salen del navegador y no se guardan en ningún servidor.',
        punto: 'bg-amber-400',
        texto: 'text-amber-300',
      }
    : degraded
      ? {
          etiqueta: 'Base sin responder',
          detalle:
            'Hay credenciales configuradas pero la base no contesta: se están mostrando datos de ejemplo y lo que guardes va a fallar.',
          punto: 'bg-red-500',
          texto: 'text-red-300',
        }
      : {
          etiqueta: 'Conectado a Supabase',
          detalle: 'Los datos salen de la base real y los cambios se guardan.',
          punto: 'bg-emerald-400',
          texto: 'text-brand-300',
        };

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch {
        // Modo privado o storage lleno: la preferencia no se recuerda entre
        // sesiones, pero el sidebar igual se pliega en esta.
      }
      return next;
    });
  };

  useEffect(() => {
    if (!mainRef.current || prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
    );
    return () => {
      tween.kill();
    };
  }, []);

  // Guard (ADMIN-05): sin sesión → login. `isAuthReady()` evita el rebote
  // espurio mientras Supabase resuelve la sesión guardada — sin él, recargar
  // /admin/proyectos con sesión válida te expulsa al login.
  if (isAuthReady() && !isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    void logout().finally(() => navigate('/admin', { replace: true }));
  };

  return (
    <div className={`flex min-h-screen bg-paper-soft transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      {/* Sidebar — desktop */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-brand-900 text-white transition-all duration-300 lg:flex ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className={`flex items-center justify-between pb-8 pt-8 ${collapsed ? 'px-4 flex-col gap-4' : 'px-6'}`}>
          <Link
            to="/admin/panel"
            title="Ir al inicio del panel"
            className="flex items-center gap-2.5 leading-none transition-opacity hover:opacity-85"
          >
            <LogoMark tone="current" className="h-7 w-auto shrink-0 text-brand-300" />
            {!collapsed && (
              <span className="flex flex-col">
                <span className="text-sm font-light tracking-[0.35em] text-white uppercase">{siteConfig.name}</span>
                <span className="mt-1.5 text-[0.5rem] font-medium tracking-[0.4em] text-brand-300">
                  ADMINISTRACIÓN
                </span>
              </span>
            )}
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle dark />
            <button
              type="button"
              onClick={toggleSidebar}
              title={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
              aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
              className="p-1.5 text-white/50 transition-colors hover:text-white"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="px-3 pb-4">
            <AdminSearch />
          </div>
        )}

        <nav className="flex-1 space-y-1 px-3" aria-label="Secciones del panel">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `group flex items-center border-l-2 py-3 text-xs font-medium uppercase tracking-widest transition-all duration-300 ${
                  collapsed ? 'justify-center px-0' : 'gap-3 px-4'
                } ${
                  isActive
                    ? 'border-brand-500 bg-white/5 text-white'
                    : 'border-transparent text-white/50 hover:border-white/20 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.5} className="shrink-0" aria-hidden />
              {!collapsed && (
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-6">
          {/* Estado del backend, SIEMPRE visible.
              Antes sólo había aviso cuando algo andaba mal, así que "conectado"
              y "el banner no se renderizó" se veían exactamente igual: nada. Y
              el panel en modo demo es idéntico al real salvo por una línea de
              texto arriba, con el riesgo de editar datos de ejemplo creyendo
              que se edita la base. */}
          {!collapsed ? (
            <p
              className="mb-4 flex items-center gap-2 px-4 text-[0.65rem] font-medium uppercase tracking-widest"
              title={backend.detalle}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${backend.punto}`} aria-hidden />
              <span className={backend.texto}>{backend.etiqueta}</span>
            </p>
          ) : (
            <p className="mb-4 flex justify-center" title={backend.detalle}>
              <span className={`h-2 w-2 rounded-full ${backend.punto}`} />
              <span className="sr-only">{backend.etiqueta}</span>
            </p>
          )}

          {session && !collapsed && (
            <p className="mb-4 truncate px-4 text-xs font-light text-white/70" title={session.email}>
              {session.email}
            </p>
          )}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Volver al sitio web"
            className={`group mb-1 flex w-full items-center text-xs font-medium uppercase tracking-widest text-white/60 transition-colors duration-300 hover:text-white ${
              collapsed ? 'justify-center py-2.5' : 'gap-3 px-4 py-2'
            }`}
          >
            <ExternalLink size={18} strokeWidth={1.5} aria-hidden />
            {!collapsed && (
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                Volver al sitio
              </span>
            )}
          </a>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className={`group flex w-full items-center text-xs font-medium uppercase tracking-widest text-white/50 transition-colors duration-300 hover:text-white ${
              collapsed ? 'justify-center py-2.5' : 'gap-3 px-4 py-2'
            }`}
          >
            <LogOut size={18} strokeWidth={1.5} aria-hidden />
            {!collapsed && (
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                Cerrar sesión
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Topbar — mobile / tablet */}
      <div className="fixed inset-x-0 top-0 z-30 bg-brand-900 text-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex flex-col leading-none">
            <span className="text-sm font-light tracking-[0.3em] text-white uppercase">{siteConfig.name}</span>
            <span className="mt-1 text-[0.5rem] font-medium tracking-[0.4em] text-brand-300">
              ADMINISTRACIÓN
            </span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Volver al sitio web"
              title="Volver al sitio web"
              className="p-2 text-white/60 transition-colors duration-300 hover:text-white"
            >
              <ExternalLink size={18} strokeWidth={1.5} aria-hidden />
            </a>
            <ThemeToggle dark />
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="p-2 text-white/60 transition-colors duration-300 hover:text-white"
            >
              <LogOut size={18} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
        <nav
          data-lenis-prevent className="flex gap-1 overflow-x-auto border-t border-white/10 px-2"
          aria-label="Secciones del panel"
        >
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-4 py-3 text-[0.65rem] font-medium uppercase tracking-widest transition-colors duration-300 ${
                  isActive
                    ? 'border-brand-500 text-white'
                    : 'border-transparent text-white/50 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Contenido */}
      <main ref={mainRef} className="min-w-0 flex-1 pt-28 lg:pt-0">
        <header className="border-b border-line bg-paper">
          <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-8 md:px-10">
            <div>
              <h1 className="text-2xl font-light uppercase tracking-wide text-ink md:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm font-light leading-relaxed text-ink-soft">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
          {/* Dos avisos distintos que antes eran uno solo.
              · Sin backend configurado: modo demo, todo local, esperado.
              · Con backend configurado pero CAÍDO: el panel está mostrando los
                datos de ejemplo porque las lecturas cayeron al fallback, y
                cualquier cosa que el equipo guarde va a fallar. Sin este aviso
                se edita contenido de demostración creyendo que se edita la base
                —el peor error posible en un panel— porque a simple vista se ve
                idéntico a los datos reales. */}
          {!USING_REAL_BACKEND ? (
            <div className="flex items-center gap-2 border-t border-hairline bg-brand-50 px-6 py-2 text-xs font-light text-brand-900 md:px-10 dark:border-brand-700/40 dark:bg-brand-900/40 dark:text-brand-100">
              <Info size={14} strokeWidth={1.5} className="shrink-0 text-brand-500" aria-hidden />
              <span>Vista previa — datos de demostración, sin persistencia en servidor.</span>
            </div>
          ) : degraded ? (
            <div
              role="alert"
              className="flex items-center gap-2 border-t border-red-200 bg-red-50 px-6 py-2 text-xs font-light text-red-800 md:px-10 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            >
              <Info size={14} strokeWidth={1.5} className="shrink-0" aria-hidden />
              <span>
                La base no responde: estás viendo datos de ejemplo y lo que guardes va a fallar.
                Revisá las credenciales de Supabase y que el proyecto esté activo.
              </span>
            </div>
          ) : null}
        </header>
        <div className="px-6 py-8 md:px-10 md:py-10">{children}</div>
      </main>
      <AdminSessionModal />
    </div>
  );
}

