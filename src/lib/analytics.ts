// Tracking GA4 (SEO-02). initAnalytics() inyecta gtag.js cuando VITE_GA4_ID
// está definido; trackEvent() rutea los eventos por gtag('event', …).
// Sin VITE_GA4_ID (dev/preview) los eventos quedan en dataLayer, inspeccionables.

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA4_ID: string | undefined = import.meta.env.VITE_GA4_ID || undefined;

const GTAG_SCRIPT_ID = 'ga4-gtag';

/**
 * Conecta GA4: define window.gtag, envía config inicial e inyecta gtag.js.
 * Llamar una vez al arrancar la app (main.tsx). No-op sin GA4_ID o si ya corrió.
 */
export function initAnalytics(): void {
  if (!GA4_ID || document.getElementById(GTAG_SCRIPT_ID)) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // gtag.js exige el objeto `arguments` (no un array) en dataLayer.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID);

  const script = document.createElement('script');
  script.id = GTAG_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
  document.head.appendChild(script);
}

/**
 * Eventos estándar del sitio:
 * - 'whatsapp_click'   { location: 'header' | 'floating' | 'contacto' | ... }
 * - 'form_submit'      { form: 'contacto' | 'newsletter' | 'inversion' }
 * - 'project_view'     { slug }
 * - 'investment_view'  { slug }
 */
export function trackEvent(name: string, params: EventParams = {}): void {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  } else {
    // Sin GA4 configurado: dataLayer inerte, útil para debug/GTM futuro.
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event: name, ...params });
  }
  if (import.meta.env.DEV) {
    console.debug('[analytics]', name, params);
  }
}
