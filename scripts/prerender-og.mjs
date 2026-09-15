// Prerender de OG tags por ruta (SEO-01). Corre después de `vite build`:
// emite dist/<ruta>/index.html por cada página estática y por cada slug de
// proyecto/inversión (desde fixtures — los scrapers de OG no ejecutan JS).
// Node >= 23.6 (type stripping) importa fixtures.ts directamente.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INVESTMENTS_FIXTURE, PROJECTS_FIXTURE } from '../src/data/fixtures.ts';

const SITE_URL = 'https://template-cero.vercel.app';
const SITE_NAME = 'Template Cero';

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const template = readFileSync(path.join(distDir, 'index.html'), 'utf8');

const esc = (s) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const truncate = (s, max = 200) =>
  s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;

function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`Meta ${attr}="${key}" no encontrada en index.html`);
  return html.replace(re, `$1${esc(value)}$2`);
}

function renderPage({ title, description, image, urlPath }) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${urlPath}`;
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(fullTitle)}</title>`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', fullTitle);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:url', url);
  if (image) html = setMeta(html, 'property', 'og:image', image);
  // Twitter no lee og:*: tiene su propio juego de etiquetas. Sin esto todas
  // las páginas compartían el preview de la home en X.
  html = setMeta(html, 'name', 'twitter:title', fullTitle);
  html = setMeta(html, 'name', 'twitter:description', description);
  if (image) html = setMeta(html, 'name', 'twitter:image', image);
  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1${esc(url)}$2`,
  );
  return html;
}

function emit(page) {
  const outDir = path.join(distDir, ...page.urlPath.split('/').filter(Boolean));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'index.html'), renderPage(page), 'utf8');
}

// Páginas estáticas (mismo copy que sus usePageMeta)
const staticPages = [
  {
    urlPath: '/proyectos',
    title: 'Proyectos',
    description:
      'Nuestros desarrollos inmobiliarios: obras entregadas, proyectos en ejecución y conceptos en diseño. Filtre por estado, ubicación y tipo.',
  },
  {
    urlPath: '/inversiones',
    title: 'Inversiones',
    description:
      'Oportunidades de inversión inmobiliaria con estructura jurídica sólida, información transparente y retornos estimados en cada etapa.',
  },
  {
    urlPath: '/contacto',
    title: 'Contacto',
    description:
      'Póngase en contacto con nuestro equipo: formulario, WhatsApp, teléfono y oficinas.',
  },
];

for (const page of staticPages) emit(page);

for (const p of PROJECTS_FIXTURE) {
  emit({
    urlPath: `/proyectos/${p.slug}`,
    title: p.name,
    description: truncate(p.description),
    image: p.coverImage,
  });
}

for (const inv of INVESTMENTS_FIXTURE) {
  emit({
    urlPath: `/inversiones/${inv.slug}`,
    title: inv.title,
    description: truncate(inv.description),
    image: inv.coverImage,
  });
}

const total = staticPages.length + PROJECTS_FIXTURE.length + INVESTMENTS_FIXTURE.length;
console.log(`[prerender-og] ${total} rutas prerenderizadas con OG propio en dist/`);

/* ------------------------------------------------------------------ sitemap
 *
 * Se genera de las MISMAS fuentes que las páginas prerenderizadas. Antes vivía
 * a mano en public/sitemap.xml: cada proyecto o inversión nuevo quedaba fuera
 * hasta que alguien se acordara de editarlo, y una URL que no está en el
 * sitemap tarda mucho más en indexarse. Ahora es imposible que se desincronice.
 *
 * /admin queda afuera a propósito (además de estar en robots.txt): es panel
 * privado, no contenido.
 */
const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  ...staticPages.map((p) => ({ loc: p.urlPath, priority: '0.9', changefreq: 'weekly' })),
  ...PROJECTS_FIXTURE.map((p) => ({
    loc: `/proyectos/${p.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  })),
  ...INVESTMENTS_FIXTURE.map((inv) => ({
    loc: `/inversiones/${inv.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, priority, changefreq }) => `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');
console.log(`[prerender-og] sitemap.xml con ${urls.length} URLs`);
