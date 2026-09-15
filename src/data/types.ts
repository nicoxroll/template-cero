// Tipos de dominio — contrato único para toda la app (público + admin).
// DATA-02: estado/ubicación/tipo presentes desde el día 1.

export type ProjectStageName = 'planificacion' | 'diseno' | 'construccion' | 'entrega';

export const PROJECT_STAGE_LABELS: Record<ProjectStageName, string> = {
  planificacion: 'Planificación',
  diseno: 'Diseño',
  construccion: 'Construcción',
  entrega: 'Entrega',
};

export interface ProjectStage {
  stage: ProjectStageName;
  /** Exactamente una etapa por proyecto debe tener current: true */
  current: boolean;
  /** ISO date de inicio real/estimado de la etapa (opcional) */
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export type ProjectStatus = 'en-pozo' | 'en-obra' | 'terminado';
export type ProjectType = 'residencial' | 'comercial' | 'mixto' | 'infraestructura';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  'en-pozo': 'En pozo',
  'en-obra': 'En obra',
  terminado: 'Terminado',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  mixto: 'Mixto',
  infraestructura: 'Infraestructura',
};

export interface ProjectSpec {
  label: string;
  value: string;
}

export type DocumentKind =
  | 'brochure'
  | 'planos'
  | 'term-sheet'
  | 'contrato'
  | 'memorando'
  | 'otro';

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  brochure: 'Brochure comercial',
  planos: 'Planos y documentación técnica',
  'term-sheet': 'Term sheet',
  contrato: 'Contrato',
  memorando: 'Memorando de inversión',
  otro: 'Documento informativo',
};

export interface DocumentRef {
  name: string;
  url: string;
  /** Tamaño legible, ej: "1,2 MB" */
  sizeLabel: string;
  kind: DocumentKind;
}

export interface Coords {
  lat: number;
  lng: number;
}

export interface Project {
  slug: string;
  name: string;
  description: string;
  location: string;
  type: ProjectType;
  status: ProjectStatus;
  /** Timeline real del proyecto; exactamente una etapa con current: true */
  timeline: ProjectStage[];
  coverImage: string;
  gallery: string[];
  specs: ProjectSpec[];
  docs: DocumentRef[];
  coords: Coords;
  featured: boolean;
  /** true = imágenes son renders/concepto; false = obra real fotografiada */
  isRender: boolean;
  /** Tipologías de unidades (1 amb, 2 amb, etc.) con planos arquitectónicos */
  tipologias?: ProjectTypology[];
  /** false = borrador: editable en el panel, invisible en el sitio público.
   * Permite preparar un lanzamiento sin publicarlo, y despublicar sin borrar. */
  published: boolean;
  createdAt: string;
  /** ISO date de la última edición desde el panel (trazabilidad ADMIN-06) */
  updatedAt?: string;
}

export interface ProjectTypology {
  id: string;
  nombre: string;
  ambientes: number;
  superficieCubierta: number; // m²
  superficieDescubierta: number; // m²
  superficieTotal: number; // m²
  orientacion?: string;
  cocheraOpcional?: boolean;
  disponibilidad: 'disponible' | 'ultimas_unidades' | 'reservada';
  planoUrl?: string;
  descripcion?: string;
  caracteristicas?: string[];
}

export type InvestmentStatus = 'activa' | 'proximamente' | 'cerrada';

export const INVESTMENT_STATUS_LABELS: Record<InvestmentStatus, string> = {
  activa: 'Activa',
  proximamente: 'Próximamente',
  cerrada: 'Cerrada',
};

export type TipoEstructuraFideicomiso = 'Fideicomiso al costo' | 'Fideicomiso a valor fijo';

export interface Fiduciario {
  nombre: string;
  /** Rol/registro del fiduciario, ej: "Fiduciario financiero registrado en CNV" */
  tipo: string;
}

export interface AporteEtapa {
  etapa: string;
  /** % del total del ticket que se integra en esta etapa */
  porcentaje: number;
  /** Cuándo se realiza el aporte, en texto, ej: "A la firma del boleto de fideicomiso" */
  momento: string;
}

export interface HitoDesembolso {
  hito: string;
  /** Avance de obra asociado, ej: "45%" */
  avanceObra: string;
  /** ISO date real o estimada */
  fecha: string;
}

export interface Investment {
  slug: string;
  title: string;
  description: string;
  /** Monto mínimo de inversión */
  amount: number;
  currency: 'USD' | 'ARS';
  /** Retorno estimado, texto listo para mostrar (ej: "12–15% anual en USD") — SIEMPRE con disclaimer (INV-03) */
  estReturn: string;
  termMonths: number;
  status: InvestmentStatus;
  /** Slug del proyecto vinculado, o null si es standalone */
  projectSlug: string | null;
  coverImage: string;
  docs: DocumentRef[];
  createdAt: string;
  fiduciario: Fiduciario;
  tipoEstructura: TipoEstructuraFideicomiso;
  /** Ticket mínimo de ingreso, en `moneda` */
  ticketMinimo: number;
  moneda: 'USD' | 'ARS';
  /** Cronograma de integración de aportes; la suma de porcentajes debe dar 100 */
  integracion: AporteEtapa[];
  /** Hitos de desembolso ligados a avance de obra */
  hitosDesembolso: HitoDesembolso[];
  /** Cómo y cuándo se realiza el retorno de la inversión */
  salida: string;
  /** Escribanía a cargo de la instrumentación */
  escribania: string;
  /** false = borrador: no aparece en el sitio público (ver Project.published) */
  published: boolean;
  /** ISO date de la última edición desde el panel (trazabilidad ADMIN-06) */
  updatedAt?: string;
}

export type LeadSource = 'contacto' | 'inversion';

/** Pipeline de gestión de un lead — lo que el equipo comercial necesita para
 * no perder una consulta entre el email y el WhatsApp. */
export type LeadStatus = 'nuevo' | 'contactado' | 'calificado' | 'cerrado' | 'descartado';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  calificado: 'Calificado',
  cerrado: 'Cerrado',
  descartado: 'Descartado',
};

/** Orden del pipeline, para columnas/contadores en el panel. */
export const LEAD_STATUS_ORDER: readonly LeadStatus[] = [
  'nuevo',
  'contactado',
  'calificado',
  'cerrado',
  'descartado',
];

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: LeadSource;
  /** Slug de inversión/proyecto de interés, si aplica */
  interestSlug?: string;
  /** Estado en el pipeline comercial; los leads viejos sin estado se leen como 'nuevo' */
  status: LeadStatus;
  /** Notas internas del seguimiento (no se muestran nunca en el sitio público) */
  notes?: string;
  createdAt: string;
  /** ISO date del último cambio de estado o nota */
  updatedAt?: string;
}

export interface NewsletterSub {
  id: string;
  email: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** URL de la foto del servicio. Antes acá vivía el nombre de un icono de
   * lucide: la grilla de iconos de línea se leía genérica —"de plantilla"— al
   * lado de la fotografía real del resto del sitio. */
  image: string;
}

/** Pregunta frecuente de la sección de inversores, editable desde el panel.
 *
 * Antes eran ocho objetos escritos a mano dentro de InvestorFaq.tsx. El
 * problema no era el hardcodeo en sí: es que las preguntas de un inversor
 * cambian con cada proyecto y con cada cambio normativo, y cada ajuste de una
 * coma exigía un deploy. Ahora vive en la base como cualquier otro contenido. */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export type CustomSectionMediaType = 'none' | 'image' | 'video';
export type CustomSectionLayout = 'split-balanced' | 'split-media-large' | 'full-width' | 'compact';
export type CustomSectionAspectRatio = '16/9' | '21/9' | '4/3' | '1/1' | 'auto';
export type CustomSectionHeight = 'compact' | 'medium' | 'immersive';

export interface CustomSectionVideoConfig {
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
  aspectRatio?: CustomSectionAspectRatio;
  height?: CustomSectionHeight;
}

export interface CustomSection {
  id: string;
  kicker?: string;
  title: string;
  content: string;
  mediaType: CustomSectionMediaType;
  mediaUrl?: string;
  mediaAlt?: string;
  videoConfig?: CustomSectionVideoConfig;
  layout?: CustomSectionLayout;
  ctaText?: string;
  ctaLink?: string;
  ctaUrl?: string;
  theme: 'paper' | 'paper-soft' | 'ink' | 'light' | 'dark';
  published: boolean;
  visible?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyMetrics {
  years: number;
  m2: number;
  projects: number;
}

export interface Disclaimers {
  /** Ley 26.831 — las oportunidades no constituyen oferta pública de valores */
  ofertaPublica: string;
  /** Ley 25.326 — tratamiento de datos personales */
  datosPersonales: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface PageConfig {
  /** HERO-05: activa/desactiva el modo scroll-scrub de la home */
  heroScrubEnabled: boolean;
  contactEmail: string;
  contactPhone: string;
  /** Solo dígitos con código de país, ej: "5491155550123" (para wa.me) */
  whatsappNumber: string;
  address: string;
  /** Coordenadas de la oficina, para el mapa de la sección Contacto (CONT-03) */
  officeCoords: Coords;
  metrics: CompanyMetrics;
  /** Razón social completa, ej: "Punto Cero Desarrollos S.A." */
  legalName: string;
  /** CUIT con formato XX-XXXXXXXX-X */
  cuit: string;
  /** Matrícula de corredor inmobiliario, ej: "Mat. CUCICBA 6042 / CMCPSI 4318" */
  matricula: string;
  domicilioLegal: string;
  disclaimers: Disclaimers;
  /** ej: "Lunes a viernes de 9 a 18 h" */
  horarioAtencion: string;
  zonasCobertura: string[];
  /** URL de Webhook para alertas en tiempo real de nuevos leads comerciales */
  leadNotificationWebhook?: string;
  /** Email adicional para avisos comerciales */
  leadNotificationEmail?: string;
}

