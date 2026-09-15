import { useEffect } from 'react';

const SITE_NAME = 'Punto Cero Desarrollos';
const DEFAULT_DESCRIPTION =
  'Transformamos ideas en proyectos de valor. Soluciones integrales en desarrollo inmobiliario, arquitectura, construcción, infraestructura, financiamiento e inversiones.';

interface PageMeta {
  title: string;
  description?: string;
  ogImage?: string;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Título + meta description + OG por página. Llamar en el top-level de cada page component.
 * `title` va sin sufijo: el hook agrega " | Punto Cero Desarrollos".
 */
export function usePageMeta({ title, description, ogImage }: PageMeta) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    const desc = description ?? DEFAULT_DESCRIPTION;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    if (ogImage) setMeta('property', 'og:image', ogImage);
    // Twitter lee sus propias etiquetas: sin esto, al navegar dentro del SPA
    // quedaban las de la home.
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    if (ogImage) setMeta('name', 'twitter:image', ogImage);

    // Canonical y og:url siguen a la navegación del SPA. El crawler ve el HTML
    // prerenderizado (que ya los trae bien), pero un visitante que comparte la
    // URL desde la barra después de navegar dejaba la canonical de la página
    // anterior.
    const url = window.location.origin + window.location.pathname;
    setMeta('property', 'og:url', url);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [title, description, ogImage]);
}
