import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { isAuthenticated } from '../admin/shell/adminAuth';
import SkinToggle from '../ui/SkinToggle';
import LogoMark from '../ui/LogoMark';
import { useHeroScrubEnabled } from '../../lib/useHeroScrubEnabled';

import { siteConfig } from '../../config/site';

const NAV_ITEMS = siteConfig.navigation.map((item) => ({
  label: item.label,
  to: item.href,
}));

/**
 * Header flotante: transparente con texto blanco sobre el hero, blanco/backdrop-blur
 * con texto ink al scrollear. Fuera de la home siempre sólido.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  // El toggle de hero solo tiene sentido en la home, y solo si el tour está
  // habilitado en Configuración: apagado, no hay nada que alternar
  // (ver src/lib/useHeroScrubEnabled.ts).
  const scrubEnabled = useHeroScrubEnabled();
  // Sesión de admin activa: initAuth() la resuelve antes del primer render, así
  // que para cuando el header monta ya se sabe si hay que ofrecer el atajo.
  const esAdmin = isAuthenticated();
  const showHeroToggle = isHome && scrubEnabled;

  // Rutas que abren con un hero a sangre: ahí el header arranca transparente y
  // se vuelve sólido al scrollear. Es una lista explícita y no un patrón porque
  // las páginas de detalle pueden renderizar un 404 sin hero, y un header
  // Rutas que abren con un hero a sangre: ahí el header arranca transparente y
  // se vuelve sólido al scrollear.
  const hasFullBleedHero =
    pathname === '/' ||
    pathname === '/proyectos' ||
    pathname.startsWith('/proyectos/') ||
    pathname === '/contacto' ||
    pathname === '/inversiones' ||
    pathname.startsWith('/inversiones/') ||
    pathname === '/blog' ||
    pathname.startsWith('/blog/');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || !hasFullBleedHero || menuOpen;

  const legible = solid ? '' : 'hero-legible';

  // Sin shadow-sm para evitar la línea dura de corte sobre el hero o el fondo
  const headerBg = solid ? 'bg-paper/85 backdrop-blur-md' : 'bg-transparent';
  const brandText = solid ? 'text-ink' : 'text-white';
  const brandAccent = solid ? 'text-brand-500' : 'text-white/80';
  const navLinkColor = solid
    ? 'text-ink-soft hover:text-brand-700 dark:hover:text-brand-300'
    : 'text-white/90 hover:text-white';
  const menuIconColor = solid ? 'text-ink' : 'text-white';

  const isItemActive = (itemTo: string) => {
    if (itemTo === '/') {
      return pathname === '/';
    }
    if (itemTo.startsWith('/#')) {
      return pathname === '/' && window.location.hash === itemTo.substring(1);
    }
    return pathname === itemTo || pathname.startsWith(`${itemTo}/`);
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${headerBg}`}>
      {/* Velo superior mientras el header es transparente */}
      {!solid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/70 via-black/35 to-transparent"
        />
      )}

      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className={`flex items-center gap-3 leading-none transition-colors duration-500 ${brandText} ${legible}`}
        >
          {/* Sobre el hero el isotipo hereda el blanco del texto; con el header
              sólido vuelve al degradado verde de marca. */}
          <LogoMark
            tone={solid ? 'gradient' : 'current'}
            className="h-9 w-auto shrink-0"
            gradientId="pc-logo-header"
          />
          <span className="flex flex-col">
            <span className="text-lg font-light tracking-[0.35em] uppercase">{siteConfig.name}</span>
            <span className={`mt-1 text-[0.6rem] font-medium tracking-[0.5em] uppercase ${brandAccent}`}>
              {siteConfig.shortName}
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative py-1 text-xs font-medium uppercase tracking-widest transition-colors duration-300 ${legible} ${
                  active
                    ? solid
                      ? 'text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-brand-300 font-semibold'
                    : navLinkColor
                }`}
              >
                {item.label}
                {active && (
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300 ${
                      solid ? 'bg-brand-500 dark:bg-brand-400' : 'bg-brand-300'
                    }`}
                  />
                )}
              </Link>
            );
          })}
          {showHeroToggle && <SkinToggle dark={!solid} />}
          <ThemeToggle dark={!solid} />

          {/* Atajo al panel cuando ya hay sesión: sin esto, para volver a
              administrar había que escribir /admin a mano y encontrarse con el
              login —aunque la sesión siguiera viva— porque desde el sitio
              público no había ninguna puerta de vuelta. */}
          {esAdmin && (
            <Link
              to="/admin/panel"
              className={`focus-ring inline-flex items-center gap-1.5 border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-widest transition-colors ${
                solid
                  ? 'border-brand-500/40 text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40'
                  : 'border-white/30 text-white hover:bg-white/10'
              }`}
              title="Estás con sesión de administración iniciada"
            >
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Admin
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 lg:hidden">
          {showHeroToggle && <SkinToggle dark={!solid} iconOnly />}
          <ThemeToggle dark={!solid} />
          <button
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((v) => !v)}
            // h-9 w-9 para igualar la caja de toque de los toggles vecinos: el
            // icono solo daba 24×24, por debajo del mínimo táctil recomendado
            // y visiblemente más chico que sus hermanos en la misma fila.
            className={`focus-ring flex h-9 w-9 shrink-0 items-center justify-center ${menuIconColor} ${legible}`}
          >
            {menuOpen ? <X className="h-6 w-6" strokeWidth={1.5} /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Menú mobile.
          Se renderiza SIEMPRE y se anima con grid-template-rows de 0fr a 1fr,
          en vez de montarse y desmontarse: con montaje condicional el cierre no
          se ve nunca —React saca el nodo antes de que haya nada que interpolar—
          y la apertura aparece de golpe. Es el mismo patrón que usan los
          filtros de proyectos.

          `invisible` y `pointer-events-none` cuando está cerrado: una altura de
          0 con overflow oculto igual deja los links alcanzables por tabulación,
          así que sin esto el foco se metía en un menú invisible. */}
      <nav
        id="menu-mobile"
        aria-hidden={!menuOpen}
        className={`relative grid overflow-hidden border-t bg-paper/95 backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:hidden ${
          menuOpen
            ? 'grid-rows-[1fr] border-line opacity-100'
            : 'pointer-events-none invisible grid-rows-[0fr] border-transparent opacity-0'
        }`}
      >
        <div className="min-h-0">
          <div className="flex flex-col px-4 py-4 sm:px-6">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`py-3 text-sm font-medium uppercase tracking-widest transition-colors flex items-center justify-between ${
                    active
                      ? 'text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-ink-soft hover:text-brand-700 dark:hover:text-brand-300'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                </Link>
              );
            })}

            {esAdmin && (
              <Link
                to="/admin/panel"
                onClick={() => setMenuOpen(false)}
                className="mt-2 inline-flex items-center gap-2 border-t border-hairline pt-4 text-sm font-medium uppercase tracking-widest text-brand-700 dark:text-brand-300"
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Panel de administración
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
