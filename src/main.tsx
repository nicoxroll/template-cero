import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { initAnalytics } from './lib/analytics';
import { initAuth } from './components/admin/shell/adminAuth';
import { initSmoothScroll, pauseSmoothScroll, resumeSmoothScroll } from './lib/smoothScroll';
import { initPageIntro } from './lib/pageIntro';
import { ScrollTrigger } from './lib/gsapReveal';
import './index.css';

initAnalytics();
initSmoothScroll();
// Después de initSmoothScroll: necesita la instancia de Lenis ya creada para
// poder frenarla mientras el telón está puesto.
initPageIntro(pauseSmoothScroll, () => {
  resumeSmoothScroll();
  // Las secciones montan y calculan sus ScrollTriggers MIENTRAS el <html> está
  // en overflow: hidden, o sea con scroll máximo 0. Sin recalcular al soltar la
  // traba, el mazo de servicios, los parallax y el revelado del footer quedan
  // con las posiciones de una página que no se podía scrollear.
  ScrollTrigger.refresh();
});

const root = createRoot(document.getElementById('root')!);

function render() {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

// La sesión del panel se resuelve ANTES del primer render: el guard de
// AdminShell es síncrono, así que sin esto una recarga de /admin/* con sesión
// válida rebotaría al login. En modo mock initAuth() resuelve al instante, y
// si falla igual se renderiza (el guard simplemente manda al login).
//
// El race NO es paranoia: es la pantalla en blanco real. `.catch().finally()`
// cubre que initAuth() RECHACE, pero no que se CUELGUE — y contra un Supabase
// que no contesta (proyecto pausado, key inválida, DNS que no resuelve) la
// petición de sesión puede no volver nunca. Ahí `finally` no corre, `render()`
// no se llama y el sitio entero queda en un <div id="root"> vacío: ni siquiera
// el fallback a datos locales puede salvarlo, porque React nunca montó.
//
// Peor caso al vencer el plazo: el guard manda al login y el usuario vuelve a
// entrar. Sale barato contra no renderizar nada.
const AUTH_TIMEOUT_MS = 3000;

Promise.race([
  initAuth(),
  new Promise((resolve) => setTimeout(resolve, AUTH_TIMEOUT_MS)),
])
  .catch(() => undefined)
  .finally(render);
