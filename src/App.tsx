import { Suspense, lazy, useEffect, useRef } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router';
import Header from './components/layout/Header';
import RevealFooter from './components/layout/RevealFooter';
import ChatWidget from './components/chat/ChatWidget';
import { Skeleton, SkeletonCard } from './components/ui/Skeleton';
import { gsap } from './lib/gsapReveal';
import { prefersReducedMotion } from './lib/useReducedMotion';
import { SkinProvider } from './lib/SkinContext';
import { LiveCMSProvider } from './lib/LiveCMSContext';
import LiveCMSEditor from './components/LiveCMSEditor';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PrivacyCookieBanner from './components/ui/PrivacyCookieBanner';
import { scrollToElement, scrollToTopImmediate } from './lib/smoothScroll';
import { siteConfig } from './config/site';

// Rutas públicas (lazy — code-splitting por página)
const Home = lazy(() => import('./pages/Home'));
const Proyectos = lazy(() => import('./pages/Proyectos'));
const ProyectoDetalle = lazy(() => import('./pages/ProyectoDetalle'));
const Inversiones = lazy(() => import('./pages/Inversiones'));
const InversionDetalle = lazy(() => import('./pages/InversionDetalle'));
const Contacto = lazy(() => import('./pages/Contacto'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Rutas admin
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
const AdminProyectos = lazy(() => import('./pages/admin/AdminProyectos'));
const AdminInversiones = lazy(() => import('./pages/admin/AdminInversiones'));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'));
const AdminContenido = lazy(() => import('./pages/admin/AdminContenido'));
const AdminConfiguracion = lazy(() => import('./pages/admin/AdminConfiguracion'));

/** Scroll al top en cada navegación; respeta anchors (/#quienes-somos). */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // La página destino puede ser lazy: reintentar hasta que la sección
      // exista en el DOM (~2 s máx.) en lugar de un único rAF.
      let attempts = 0;
      let rafId = 0;
      const tryScroll = () => {
        const target = document.querySelector(hash);
        if (target) {
          if (!scrollToElement(target, -80)) {
            target.scrollIntoView({ block: 'start' });
          }
          return;
        }
        if (attempts++ < 120) rafId = requestAnimationFrame(tryScroll);
      };
      rafId = requestAnimationFrame(tryScroll);
      return () => cancelAnimationFrame(rafId);
    }
    if (!scrollToTopImmediate()) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

/** Fallback de Suspense mientras baja el chunk de la página.
 *
 * Tiene la FORMA de una página del sitio —hero a pantalla casi completa, título
 * de sección, grilla de cards— y no la barrita centrada que había antes. La
 * diferencia importa en conexiones lentas: una barra suelta en el medio de una
 * pantalla vacía se lee como "algo se rompió"; una silueta se lee como "está
 * cargando" y encima evita el salto de layout cuando el contenido real entra en
 * ese mismo molde. */
function PageFallback() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="min-h-screen bg-paper">
      {/* Hero */}
      <Skeleton className="h-[70vh] w-full" />

      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Encabezado de sección: volanta + título + bajada */}
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-5 h-10 w-3/4 max-w-xl" />
        <Skeleton className="mt-4 h-4 w-full max-w-2xl" />

        {/* Grilla de cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PublicLayout() {
  const { pathname } = useLocation();
  const pageRef = useRef<HTMLDivElement>(null);

  // UX-02 — transición de página: fade GSAP del contenido en cada cambio de ruta.
  // Solo opacity (sin transform) para no romper el pin del hero (ancestros con
  // transform crean containing block para elementos fijados/pinneados).
  useEffect(() => {
    const el = pageRef.current;
    if (!el || prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: 0.45, ease: 'power2.out', clearProps: 'opacity' },
    );
    return () => {
      tween.kill();
    };
  }, [pathname]);

  return (
    <>
      {/* Enlace accesible para saltar directo al contenido principal (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-900 focus:text-white focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-400 font-medium text-xs uppercase tracking-wider"
      >
        Saltar al contenido principal
      </a>

      <Header />
      {/* RevealFooter envuelve TODAS las páginas: el footer es único y vive
          acá, fijo detrás del contenido, para poder descubrirse al llegar al
          final. Antes la home montaba su propio <Footer/>, lo que hacía
          imposible tenerlo detrás de su propio contenido. */}
      <RevealFooter>
        <div ref={pageRef} id="main-content">
          <Outlet />
        </div>
      </RevealFooter>
      {siteConfig.features.enableChatWidget && <ChatWidget />}
      {siteConfig.features.enableLiveCMS && <LiveCMSEditor />}
      <PrivacyCookieBanner />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LiveCMSProvider>
        <SkinProvider>
          <ScrollManager />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="proyectos" element={<Proyectos />} />
                <Route path="proyectos/:slug" element={<ProyectoDetalle />} />
                <Route path="inversiones" element={<Inversiones />} />
                <Route path="inversiones/:slug" element={<InversionDetalle />} />
                <Route path="contacto" element={<Contacto />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Admin — sin chrome público; la fase admin agrega AdminLayout + guard */}
              <Route path="admin" element={<AdminLogin />} />
              <Route path="admin/panel" element={<AdminPanel />} />
              <Route path="admin/proyectos" element={<AdminProyectos />} />
              <Route path="admin/inversiones" element={<AdminInversiones />} />
              <Route path="admin/leads" element={<AdminLeads />} />
              <Route path="admin/contenido" element={<AdminContenido />} />
              <Route path="admin/configuracion" element={<AdminConfiguracion />} />
            </Routes>
          </Suspense>
        </SkinProvider>
      </LiveCMSProvider>
    </ErrorBoundary>
  );
}
