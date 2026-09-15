// Mapeo fila-de-Postgres ↔ tipo de dominio.
//
// La DB usa snake_case y separa lat/lng en dos columnas (para poder indexarlas
// y ponerles CHECK); el dominio usa camelCase y un objeto `coords`. Esa
// traducción vive acá y en ningún otro lado: los componentes nunca ven una
// fila cruda, y si mañana cambia un nombre de columna se toca un solo archivo.
//
// Estas funciones son puras y no dependen del cliente de Supabase, así que
// pueden testearse y typecheckearse aunque la conexión todavía no exista.

import type {
  AdminUser,
  AporteEtapa,
  DocumentRef,
  FaqItem,
  Fiduciario,
  HitoDesembolso,
  Investment,
  Lead,
  NewsletterSub,
  PageConfig,
  Project,
  ProjectSpec,
  ProjectStage,
  Service,
  TeamMember,
  TipoEstructuraFideicomiso,
} from './types';

/* ------------------------------------------------------------------- Filas */

export interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  type: Project['type'];
  status: Project['status'];
  cover_image: string;
  gallery: string[];
  specs: ProjectSpec[];
  docs: DocumentRef[];
  timeline: ProjectStage[];
  lat: number;
  lng: number;
  featured: boolean;
  is_render: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestmentRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  amount: number;
  currency: Investment['currency'];
  est_return: string;
  term_months: number;
  status: Investment['status'];
  project_id: string | null;
  cover_image: string;
  docs: DocumentRef[];
  fiduciario: Fiduciario;
  tipo_estructura: TipoEstructuraFideicomiso;
  ticket_minimo: number;
  moneda: Investment['moneda'];
  integracion: AporteEtapa[];
  hitos_desembolso: HitoDesembolso[];
  salida: string;
  escribania: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  /** Viene del join `projects(slug)` cuando se pide; null si es standalone. */
  projects?: { slug: string } | null;
}

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: Lead['source'];
  interest_slug: string | null;
  status: Lead['status'];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterRow {
  id: string;
  email: string;
  created_at: string;
}

export interface TeamRow {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
  sort_order: number;
}

export interface ServiceRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  sort_order: number;
}

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface AdminUserRow {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface PageConfigRow {
  id: number;
  hero_scrub_enabled: boolean;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  address: string;
  office_lat: number;
  office_lng: number;
  horario_atencion: string;
  zonas_cobertura: string[];
  metrics_years: number;
  metrics_m2: number;
  metrics_projects: number;
  legal_name: string;
  cuit: string;
  matricula: string;
  domicilio_legal: string;
  disclaimer_oferta_publica: string;
  disclaimer_datos_personales: string;
  lead_notification_webhook?: string | null;
  lead_notification_email?: string | null;
}

/* ----------------------------------------------------------- Fila → dominio */

export function toAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.user_id,
    email: row.email,
    fullName: row.full_name ?? row.email.split('@')[0],
    createdAt: row.created_at,
  };
}


export function toProject(row: ProjectRow): Project {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    location: row.location,
    type: row.type,
    status: row.status,
    timeline: row.timeline ?? [],
    coverImage: row.cover_image,
    gallery: row.gallery ?? [],
    specs: row.specs ?? [],
    docs: row.docs ?? [],
    coords: { lat: row.lat, lng: row.lng },
    featured: row.featured,
    isRender: row.is_render,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toInvestment(row: InvestmentRow): Investment {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency,
    estReturn: row.est_return,
    termMonths: row.term_months,
    status: row.status,
    // El dominio referencia proyectos por slug; la DB por id. Cuando la query
    // trae el join se usa ese slug, si no queda null (standalone).
    projectSlug: row.projects?.slug ?? null,
    coverImage: row.cover_image,
    docs: row.docs ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fiduciario: row.fiduciario,
    tipoEstructura: row.tipo_estructura,
    ticketMinimo: Number(row.ticket_minimo),
    moneda: row.moneda,
    integracion: row.integracion ?? [],
    hitosDesembolso: row.hitos_desembolso ?? [],
    salida: row.salida,
    escribania: row.escribania,
    published: row.published,
  };
}

export function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    source: row.source,
    ...(row.interest_slug ? { interestSlug: row.interest_slug } : {}),
    status: row.status,
    ...(row.notes ? { notes: row.notes } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toNewsletterSub(row: NewsletterRow): NewsletterSub {
  return { id: row.id, email: row.email, createdAt: row.created_at };
}

export function toTeamMember(row: TeamRow): TeamMember {
  return { id: row.id, name: row.name, role: row.role, photo: row.photo, bio: row.bio };
}

export function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    image: row.image,
  };
}

/** `sort_order` no viaja al modelo: el orden ya viene aplicado en el ORDER BY
 * de la consulta, y exponerlo invitaría a que un componente ordene de nuevo
 * por su cuenta y se desincronice del panel. Igual que en toService. */
export function toFaq(row: FaqRow): FaqItem {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
  };
}

export function toPageConfig(row: PageConfigRow): PageConfig {
  return {
    heroScrubEnabled: row.hero_scrub_enabled,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    whatsappNumber: row.whatsapp_number,
    address: row.address,
    officeCoords: { lat: row.office_lat, lng: row.office_lng },
    metrics: {
      years: row.metrics_years,
      m2: row.metrics_m2,
      projects: row.metrics_projects,
    },
    legalName: row.legal_name,
    cuit: row.cuit,
    matricula: row.matricula,
    domicilioLegal: row.domicilio_legal,
    disclaimers: {
      ofertaPublica: row.disclaimer_oferta_publica,
      datosPersonales: row.disclaimer_datos_personales,
    },
    horarioAtencion: row.horario_atencion,
    zonasCobertura: row.zonas_cobertura ?? [],
    leadNotificationWebhook: row.lead_notification_webhook ?? undefined,
    leadNotificationEmail: row.lead_notification_email ?? undefined,
  };
}

/* ----------------------------------------------------------- Dominio → fila */


/** Payload de insert/update de proyecto. Omite id/created_at/updated_at: los
 * pone la DB (default + trigger). */
export function fromProject(p: Project): Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    slug: p.slug,
    name: p.name,
    description: p.description,
    location: p.location,
    type: p.type,
    status: p.status,
    cover_image: p.coverImage,
    gallery: p.gallery,
    specs: p.specs,
    docs: p.docs,
    timeline: p.timeline,
    lat: p.coords.lat,
    lng: p.coords.lng,
    featured: p.featured,
    is_render: p.isRender,
    published: p.published,
  };
}

/** Patch parcial: solo las claves presentes viajan, para no pisar columnas
 * que el formulario no tocó. */
export function fromProjectPatch(patch: Partial<Project>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.coverImage !== undefined) row.cover_image = patch.coverImage;
  if (patch.gallery !== undefined) row.gallery = patch.gallery;
  if (patch.specs !== undefined) row.specs = patch.specs;
  if (patch.docs !== undefined) row.docs = patch.docs;
  if (patch.timeline !== undefined) row.timeline = patch.timeline;
  if (patch.coords !== undefined) {
    row.lat = patch.coords.lat;
    row.lng = patch.coords.lng;
  }
  if (patch.featured !== undefined) row.featured = patch.featured;
  if (patch.isRender !== undefined) row.is_render = patch.isRender;
  if (patch.published !== undefined) row.published = patch.published;
  return row;
}

/** El caller resuelve projectSlug → projectId antes de llamar: el mapper es
 * puro y no puede consultar la DB. */
export function fromInvestment(
  i: Investment,
  projectId: string | null,
): Omit<InvestmentRow, 'id' | 'created_at' | 'updated_at' | 'projects'> {
  return {
    slug: i.slug,
    title: i.title,
    description: i.description,
    amount: i.amount,
    currency: i.currency,
    est_return: i.estReturn,
    term_months: i.termMonths,
    status: i.status,
    project_id: projectId,
    cover_image: i.coverImage,
    docs: i.docs,
    fiduciario: i.fiduciario,
    tipo_estructura: i.tipoEstructura,
    ticket_minimo: i.ticketMinimo,
    moneda: i.moneda,
    integracion: i.integracion,
    hitos_desembolso: i.hitosDesembolso,
    salida: i.salida,
    escribania: i.escribania,
    published: i.published,
  };
}

export function fromPageConfigPatch(patch: Partial<PageConfig>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.heroScrubEnabled !== undefined) row.hero_scrub_enabled = patch.heroScrubEnabled;
  if (patch.contactEmail !== undefined) row.contact_email = patch.contactEmail;
  if (patch.contactPhone !== undefined) row.contact_phone = patch.contactPhone;
  if (patch.whatsappNumber !== undefined) row.whatsapp_number = patch.whatsappNumber;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.officeCoords !== undefined) {
    row.office_lat = patch.officeCoords.lat;
    row.office_lng = patch.officeCoords.lng;
  }
  if (patch.horarioAtencion !== undefined) row.horario_atencion = patch.horarioAtencion;
  if (patch.zonasCobertura !== undefined) row.zonas_cobertura = patch.zonasCobertura;
  if (patch.metrics !== undefined) {
    row.metrics_years = patch.metrics.years;
    row.metrics_m2 = patch.metrics.m2;
    row.metrics_projects = patch.metrics.projects;
  }
  if (patch.legalName !== undefined) row.legal_name = patch.legalName;
  if (patch.cuit !== undefined) row.cuit = patch.cuit;
  if (patch.matricula !== undefined) row.matricula = patch.matricula;
  if (patch.domicilioLegal !== undefined) row.domicilio_legal = patch.domicilioLegal;
  if (patch.disclaimers !== undefined) {
    row.disclaimer_oferta_publica = patch.disclaimers.ofertaPublica;
    row.disclaimer_datos_personales = patch.disclaimers.datosPersonales;
  }
  if (patch.leadNotificationWebhook !== undefined) {
    row.lead_notification_webhook = patch.leadNotificationWebhook;
  }
  if (patch.leadNotificationEmail !== undefined) {
    row.lead_notification_email = patch.leadNotificationEmail;
  }
  return row;
}

