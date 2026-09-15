// Genera los PDFs de muestra referenciados por docs[].url en los fixtures
// (BLOCKER 2 — hoy los links "Descargar" no apuntan a nada). Sin deps npm:
// arma el PDF a mano (header, objetos, xref, trailer) con sintaxis PDF 1.4
// cruda + fuentes estándar Helvetica/Helvetica-Bold/Helvetica-Oblique (no
// requieren embeber ningún archivo de fuente).
//
// Node >= 23.6 (type stripping) importa fixtures.ts directamente, así la
// lista de documentos generados nunca puede divergir de las rutas reales
// que usan los componentes.
//
// Uso: node scripts/gen-docs.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INVESTMENTS_FIXTURE, PROJECTS_FIXTURE } from '../src/data/fixtures.ts';

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/docs');
mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------------------
// Texto → WinAnsiEncoding (necesario para tildes/eñes/rayas con fuentes base
// no embebidas). Los caracteres 0x00–0xFF salvo 0x80–0x9F coinciden con
// Latin-1, así que Buffer.from(str, 'latin1') produce los bytes correctos.
// ---------------------------------------------------------------------------
const WIN_ANSI_EXTRA = {
  '–': 0x96, // en dash
  '—': 0x97, // em dash
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '…': 0x85, // …
  '•': 0x95, // bullet
};

function toWinAnsi(str) {
  let out = '';
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code <= 0xff && !(code >= 0x80 && code <= 0x9f)) {
      out += ch;
      continue;
    }
    const mapped = WIN_ANSI_EXTRA[ch];
    out += mapped !== undefined ? String.fromCharCode(mapped) : '?';
  }
  return out;
}

function pdfEscape(str) {
  return toWinAnsi(str).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_L = 72;
const CONTENT_W = PAGE_W - MARGIN_L * 2; // 451

const COLOR = {
  brand900: '0.063 0.157 0.114',
  white: '1 1 1',
  ink: '0.063 0.082 0.071',
  inkSoft: '0.290 0.329 0.306',
  brand500: '0.243 0.478 0.353',
  brand100: '0.886 0.933 0.906',
};

const FONT_FACTOR = { F1: 0.5, F2: 0.56, F3: 0.5 }; // ancho medio aprox / fontSize (Helvetica/-Bold/-Oblique)

function textWidth(str, font, size) {
  return str.length * size * FONT_FACTOR[font];
}

function wrapText(str, maxWidth, font, size) {
  const words = str.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(candidate, font, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function textOp(x, y, text, { font = 'F1', size = 11, color = COLOR.ink } = {}) {
  return `${color} rg\nBT\n/${font} ${size} Tf\n${x} ${y} Td\n(${pdfEscape(text)}) Tj\nET\n`;
}

function rectOp(x, y, w, h, color) {
  return `${color} rg\n${x} ${y} ${w} ${h} re f\n`;
}

const LINE_H = 16;
const BODY_SIZE = 10.5;
const BULLET_INDENT = 14;

// Convierte párrafos + secciones de bullets en una lista plana de "líneas"
// con su tipo, para poder paginar de forma genérica.
function flattenBlocks(paragraphs, bulletSections) {
  const lines = [];
  paragraphs.forEach((p, i) => {
    if (i > 0) lines.push({ type: 'blank' });
    for (const l of wrapText(p, CONTENT_W, 'F1', BODY_SIZE)) lines.push({ type: 'para', text: l });
  });
  for (const section of bulletSections ?? []) {
    lines.push({ type: 'blank' });
    lines.push({ type: 'heading', text: section.heading });
    for (const item of section.items) {
      const wrapped = wrapText(item, CONTENT_W - BULLET_INDENT, 'F1', BODY_SIZE);
      wrapped.forEach((l, i) => {
        lines.push({ type: i === 0 ? 'bullet-first' : 'bullet-cont', text: l });
      });
    }
  }
  return lines;
}

const PAGE2_TOP = 762;
const BODY_BOTTOM = 152;
const PAGE2_CAPACITY = Math.floor((PAGE2_TOP - BODY_BOTTOM) / LINE_H);

// El bloque de encabezado (título + alcance + meta) es de alto variable: la
// línea de meta (tipo/estado/código/emisión) puede envolver a 2 líneas según
// el proyecto. Se mide antes de paginar para que el body nunca se dibuje
// encima del encabezado ni se corra fuera de la página.
function measureHeaderBlock(doc) {
  const items = [];
  let y = 780;
  items.push({ y, size: 17, font: 'F2', color: COLOR.ink, text: doc.title });
  y -= 22;
  for (const l of wrapText(doc.scopeLine, CONTENT_W, 'F1', 11)) {
    items.push({ y, size: 11, font: 'F1', color: COLOR.ink, text: l });
    y -= 15;
  }
  y -= 3;
  for (const l of wrapText(doc.metaLine, CONTENT_W, 'F1', 9)) {
    items.push({ y, size: 9, font: 'F1', color: COLOR.inkSoft, text: l });
    y -= 12;
  }
  const ruleY = y - 6;
  const bodyTop = ruleY - 24;
  return { items, ruleY, bodyTop };
}

function paginate(lines, page1Capacity) {
  const page1 = lines.slice(0, page1Capacity);
  const rest = lines.slice(page1Capacity);
  const page2 = rest.slice(0, PAGE2_CAPACITY);
  // Si algo no entra ni en 2 páginas (no debería pasar con nuestro copy),
  // se recorta en vez de romper el layout.
  return page2.length ? [page1, page2] : [page1];
}

function renderBodyLines(lines, top) {
  let y = top;
  let out = '';
  for (const line of lines) {
    if (line.type === 'blank') {
      y -= LINE_H;
      continue;
    }
    if (line.type === 'heading') {
      out += textOp(MARGIN_L, y, line.text, { font: 'F2', size: BODY_SIZE, color: COLOR.ink });
    } else if (line.type === 'bullet-first') {
      out += textOp(MARGIN_L, y, `•  ${line.text}`, { font: 'F1', size: BODY_SIZE, color: COLOR.inkSoft });
    } else if (line.type === 'bullet-cont') {
      out += textOp(MARGIN_L + BULLET_INDENT, y, line.text, { font: 'F1', size: BODY_SIZE, color: COLOR.inkSoft });
    } else {
      out += textOp(MARGIN_L, y, line.text, { font: 'F1', size: BODY_SIZE, color: COLOR.ink });
    }
    y -= LINE_H;
  }
  return out;
}

function headerBar(title) {
  let out = rectOp(0, 816, PAGE_W, 26, COLOR.brand900);
  out += textOp(MARGIN_L, 825, title, { font: 'F2', size: 10.5, color: COLOR.white });
  out += textOp(PAGE_W - MARGIN_L - textWidth('DOCUMENTO DE MUESTRA', 'F1', 8), 825, 'DOCUMENTO DE MUESTRA', {
    font: 'F1',
    size: 8,
    color: COLOR.white,
  });
  return out;
}

function footer(pageNum, totalPages) {
  let out = rectOp(MARGIN_L, 118, CONTENT_W, 1, COLOR.brand100);
  const wrapped = wrapText(
    'Documento de muestra generado por Punto Cero Desarrollos S.A. con fines demostrativos. No constituye documentación contractual, técnica ni oferta de inversión.',
    CONTENT_W,
    'F3',
    8.5,
  );
  let y = 102;
  for (const l of wrapped) {
    out += textOp(MARGIN_L, y, l, { font: 'F3', size: 8.5, color: COLOR.inkSoft });
    y -= 11;
  }
  const pageLabel = `Página ${pageNum} de ${totalPages}`;
  out += textOp(PAGE_W - MARGIN_L - textWidth(pageLabel, 'F1', 8), y - 4, pageLabel, {
    font: 'F1',
    size: 8,
    color: COLOR.inkSoft,
  });
  out += textOp(
    MARGIN_L,
    40,
    'Punto Cero Desarrollos S.A.  ·  CUIT 30-71845632-1  ·  Av. del Libertador 5252, Piso 3, Vicente López, Buenos Aires',
    { font: 'F1', size: 7.5, color: COLOR.brand500 },
  );
  return out;
}

function buildPageContent({ pageIndex, totalPages, doc, bodyLines, header }) {
  let out = headerBar('PUNTO CERO DESARROLLOS');
  if (pageIndex === 0) {
    for (const item of header.items) {
      out += textOp(MARGIN_L, item.y, item.text, { font: item.font, size: item.size, color: item.color });
    }
    out += rectOp(MARGIN_L, header.ruleY, CONTENT_W, 1, COLOR.brand100);
    out += renderBodyLines(bodyLines, header.bodyTop);
  } else {
    out += textOp(MARGIN_L, 780, `${doc.title} (continuación)`, { font: 'F2', size: 13, color: COLOR.ink });
    out += rectOp(MARGIN_L, 768, CONTENT_W, 1, COLOR.brand100);
    out += renderBodyLines(bodyLines, PAGE2_TOP);
  }
  out += footer(pageIndex + 1, totalPages);
  return out;
}

// ---------------------------------------------------------------------------
// Ensamblado del archivo PDF (objetos + xref + trailer, sin librerías)
// ---------------------------------------------------------------------------
function assemblePdf(pagesContent) {
  const n = pagesContent.length;
  // Numeración de objetos: 1=Catalog 2=Pages 3=F1 4=F2 5=F3, luego pares (Page,Content).
  const pageObjNums = pagesContent.map((_, i) => 6 + i * 2);
  const contentObjNums = pagesContent.map((_, i) => 7 + i * 2);
  const kids = pageObjNums.map((num) => `${num} 0 R`).join(' ');

  const parts = [`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`, `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${n} >>\nendobj\n`];
  parts.push(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`);
  parts.push(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`);
  parts.push(`5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj\n`);
  pagesContent.forEach((content, i) => {
    const pageNum = pageObjNums[i];
    const contentNum = contentObjNums[i];
    parts.push(
      `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentNum} 0 R >>\nendobj\n`,
    );
    parts.push(`${contentNum} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  });

  const totalObjs = 5 + pagesContent.length * 2;
  const header = '%PDF-1.4\n%âãÏÓ\n';
  let body = header;
  const offsets = [0];
  for (const part of parts) {
    offsets.push(body.length);
    body += part;
  }
  const xrefStart = body.length;
  let xref = `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= totalObjs; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return body + xref + trailer;
}

function buildPdf(doc) {
  const header = measureHeaderBlock(doc);
  const page1Capacity = Math.floor((header.bodyTop - BODY_BOTTOM) / LINE_H);
  const lines = flattenBlocks(doc.paragraphs, doc.bulletSections);
  const pages = paginate(lines, page1Capacity);
  const pagesContent = pages.map((bodyLines, i) =>
    buildPageContent({ pageIndex: i, totalPages: pages.length, doc, bodyLines, header }),
  );
  return assemblePdf(pagesContent);
}

// ---------------------------------------------------------------------------
// Contenido institucional por documento (es-AR, sobrio)
// ---------------------------------------------------------------------------
const PROJECT_STATUS_LABELS = { 'en-pozo': 'En pozo', 'en-obra': 'En obra', terminado: 'Terminado' };
const INVESTMENT_STATUS_LABELS = { activa: 'Activa', proximamente: 'Próximamente', cerrada: 'Cerrada' };
const KIND_LABELS = {
  brochure: 'Brochure comercial',
  planos: 'Planos y documentación técnica',
  'term-sheet': 'Term sheet de inversión',
  contrato: 'Contrato marco de fideicomiso',
  memorando: 'Memorando de inversión',
  otro: 'Documento informativo',
};

const money = (n, currency) => `${currency} ${n.toLocaleString('es-AR')}`;
const fecha = (iso) => {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
};
const filename = (url) => url.replace(/^\/docs\//, '');
const codigo = (url) => filename(url).replace(/\.pdf$/, '').toUpperCase();

// Genera { paragraphs, bulletSections } específico por archivo. Cubre los
// 12 documentos referenciados hoy por fixtures.ts; si se agrega un doc nuevo
// cae en el fallback genérico por tipo (no rompe el build).
function contentForProjectDoc(doc, p) {
  const specs = p.specs.map((s) => `${s.label}: ${s.value}`);
  switch (filename(doc.url)) {
    case 'torre-libertador-brochure.pdf':
      return {
        paragraphs: [
          `${p.name} es un desarrollo residencial de Punto Cero Desarrollos ubicado en ${p.location}. ${p.description}`,
          'Este brochure resume las características comerciales del proyecto — tipologías, superficies y amenities — para uso de clientes e inversores. La información surge de la documentación de obra vigente y se actualiza a medida que el proyecto avanza.',
        ],
        bulletSections: [{ heading: 'Ficha del proyecto', items: specs }],
      };
    case 'torre-libertador-planos.pdf':
      return {
        paragraphs: [
          `Planos de tipologías de ${p.name}: plantas de las unidades de 2 a 4 ambientes disponibles, con referencias de superficie cubierta y semicubierta por unidad y cortes generales del edificio.`,
          'La documentación corresponde al proyecto ejecutivo aprobado. Puede sufrir ajustes menores durante la obra por razones constructivas, sin alterar la superficie total comprometida con cada comprador.',
        ],
        bulletSections: [{ heading: 'Datos generales', items: specs }],
      };
    case 'edificio-alamos-brochure.pdf':
      return {
        paragraphs: [
          `${p.name} es un edificio boutique de Punto Cero Desarrollos en ${p.location}. ${p.description}`,
          `El proyecto se encuentra ${PROJECT_STATUS_LABELS[p.status].toLowerCase()}, con posesión entregada a la totalidad de los compradores. Este brochure se conserva como referencia comercial del desarrollo.`,
        ],
        bulletSections: [{ heading: 'Ficha del proyecto', items: specs }],
      };
    case 'costa-tigre-planos.pdf':
      return {
        paragraphs: [
          `Masterplan conceptual de ${p.name}, en ${p.location}. ${p.description}`,
          'Las imágenes y planos incluidos corresponden a renders del anteproyecto. La documentación ejecutiva definitiva se emitirá al cierre de la etapa de diseño, sin modificar los lineamientos generales del masterplan.',
        ],
        bulletSections: [{ heading: 'Datos generales', items: specs }],
      };
    case 'oficinas-distrito-norte-otro.pdf':
      return {
        paragraphs: [
          `Ficha técnica de ${p.name}, edificio corporativo de Punto Cero Desarrollos en ${p.location}. ${p.description}`,
          `Proyecto ${PROJECT_STATUS_LABELS[p.status].toLowerCase()}, entregado y actualmente ocupado en su totalidad. Este documento reúne los datos técnicos principales para consulta de terceros interesados.`,
        ],
        bulletSections: [{ heading: 'Ficha técnica', items: specs }],
      };
    case 'barrio-los-nogales-planos.pdf':
      return {
        paragraphs: [
          `Masterplan de ${p.name}, urbanización privada de Punto Cero Desarrollos en ${p.location}. ${p.description}`,
          'Las imágenes corresponden a renders del proyecto. El loteo definitivo y la infraestructura de servicios quedan sujetos a la aprobación de las factibilidades municipales en trámite.',
        ],
        bulletSections: [{ heading: 'Datos generales', items: specs }],
      };
    case 'centro-logistico-ruta-8-otro.pdf':
      return {
        paragraphs: [
          `Ficha técnica de ${p.name}, parque logístico de Punto Cero Desarrollos en ${p.location}. ${p.description}`,
          'La obra de infraestructura vial de acceso forma parte del alcance del desarrollo y se ejecuta en paralelo a las naves. Este documento se actualiza con cada hito relevante de avance.',
        ],
        bulletSections: [{ heading: 'Ficha técnica', items: specs }],
      };
    default:
      return {
        paragraphs: [
          `${p.name} — ${p.location}. ${p.description}`,
          'Documento informativo del proyecto, publicado por Punto Cero Desarrollos para consulta de clientes e inversores.',
        ],
        bulletSections: [{ heading: 'Ficha del proyecto', items: specs }],
      };
  }
}

function contentForInvestmentDoc(doc, inv, project) {
  const resumen = [
    `Monto de participación: ${money(inv.amount, inv.currency)}`,
    `Retorno estimado: ${inv.estReturn}`,
    `Plazo: ${inv.termMonths} meses`,
    `Estructura: ${inv.tipoEstructura}`,
    `Fiduciario: ${inv.fiduciario.nombre} — ${inv.fiduciario.tipo}`,
    `Ticket mínimo: ${money(inv.ticketMinimo, inv.moneda)}`,
  ];
  const integracion = inv.integracion.map((a) => `${a.etapa}: ${a.porcentaje}% — ${a.momento}`);
  const hitos = inv.hitosDesembolso.map((h) => `${h.hito} (avance de obra ${h.avanceObra}) — ${fecha(h.fecha)}`);

  switch (filename(doc.url)) {
    case 'fideicomiso-torre-libertador-term-sheet.pdf':
      return {
        paragraphs: [
          `Term sheet de ${inv.title}, oportunidad de inversión de Punto Cero Desarrollos sobre el proyecto ${project?.name ?? ''}. ${inv.description}`,
          'Los términos resumidos a continuación son de carácter informativo y se encuentran sujetos a lo establecido en el contrato marco de fideicomiso. No constituyen oferta pública de valores negociables en los términos de la Ley N.º 26.831 y no se encuentran registrados ante la Comisión Nacional de Valores (CNV).',
        ],
        bulletSections: [
          { heading: 'Términos principales', items: resumen },
          { heading: 'Cronograma de integración de aportes', items: integracion },
        ],
      };
    case 'fideicomiso-torre-libertador-contrato.pdf':
      return {
        paragraphs: [
          `Contrato marco del fideicomiso "${inv.title}", constituido para el desarrollo del proyecto ${project?.name ?? ''}. Objeto: la administración fiduciaria de los aportes de los fiduciantes-beneficiarios para la construcción y comercialización de las unidades comprendidas en el proyecto.`,
          `Partes: ${inv.fiduciario.nombre}, en carácter de fiduciario (${inv.fiduciario.tipo}), y los fiduciantes-beneficiarios que adhieran al fideicomiso mediante la firma del boleto correspondiente. La escritura traslativa de dominio se instrumenta ante ${inv.escribania}.`,
          'Obligaciones del fiduciario: administrar los fondos recibidos exclusivamente para los fines del fideicomiso, rendir cuentas periódicas del avance de obra y de la aplicación de fondos, y contratar la dirección técnica y de obra correspondiente.',
          `Salida del inversor: ${inv.salida}`,
        ],
        bulletSections: [
          { heading: 'Cronograma de integración de aportes', items: integracion },
          { heading: 'Hitos de desembolso ligados a avance de obra', items: hitos },
        ],
      };
    case 'costa-tigre-etapa-1-memorando.pdf':
      return {
        paragraphs: [
          `Memorando de inversión de ${inv.title}. ${inv.description}`,
          `Salida estimada: ${inv.salida}`,
        ],
        bulletSections: [
          { heading: 'Términos principales', items: resumen },
          { heading: 'Cronograma de integración de aportes', items: integracion },
          { heading: 'Hitos de desembolso ligados a avance de obra', items: hitos },
        ],
      };
    case 'nave-3-centro-logistico-otro.pdf':
      return {
        paragraphs: [
          `Teaser de ${inv.title}. ${inv.description}`,
          'Documento preliminar, sujeto a la apertura formal del fideicomiso. Los términos definitivos se establecen en el term sheet y el contrato marco al momento del lanzamiento.',
        ],
        bulletSections: [{ heading: 'Términos principales', items: resumen }],
      };
    case 'edificio-alamos-cierre-otro.pdf':
      return {
        paragraphs: [
          `Informe de cierre de ${inv.title}. ${inv.description}`,
          `Resultado final del ciclo: ${inv.estReturn}. ${inv.salida}`,
        ],
        bulletSections: [{ heading: 'Hitos del ciclo', items: hitos }],
      };
    default:
      return {
        paragraphs: [`${inv.title}. ${inv.description}`],
        bulletSections: [{ heading: 'Términos principales', items: resumen }],
      };
  }
}

// ---------------------------------------------------------------------------
// Generación
// ---------------------------------------------------------------------------
let count = 0;

for (const p of PROJECTS_FIXTURE) {
  for (const doc of p.docs) {
    const { paragraphs, bulletSections } = contentForProjectDoc(doc, p);
    const pdf = buildPdf({
      title: doc.name,
      scopeLine: `Proyecto: ${p.name} — ${p.location}`,
      metaLine: `Tipo de documento: ${KIND_LABELS[doc.kind]}   ·   Estado: ${PROJECT_STATUS_LABELS[p.status]}   ·   Código: ${codigo(doc.url)}   ·   Emisión: ${fecha(p.createdAt)}`,
      paragraphs,
      bulletSections,
    });
    writeFileSync(path.join(outDir, filename(doc.url)), pdf, 'latin1');
    count++;
  }
}

for (const inv of INVESTMENTS_FIXTURE) {
  const project = PROJECTS_FIXTURE.find((p) => p.slug === inv.projectSlug) ?? null;
  for (const doc of inv.docs) {
    const { paragraphs, bulletSections } = contentForInvestmentDoc(doc, inv, project);
    const pdf = buildPdf({
      title: doc.name,
      scopeLine: `Inversión: ${inv.title}`,
      metaLine: `Tipo de documento: ${KIND_LABELS[doc.kind]}   ·   Estado: ${INVESTMENT_STATUS_LABELS[inv.status]}   ·   Código: ${codigo(doc.url)}   ·   Emisión: ${fecha(inv.createdAt)}`,
      paragraphs,
      bulletSections,
    });
    writeFileSync(path.join(outDir, filename(doc.url)), pdf, 'latin1');
    count++;
  }
}

console.log(`gen-docs: ${count} PDFs generados en ${outDir}`);
