// Interfaces de repositorio — el ÚNICO contrato que los componentes conocen.
// Hoy: LocalStorageRepo (mock). Mañana: SupabaseRepo, sin tocar componentes
// (ver supabase/schema.sql y src/data/index.ts, donde vive el swap).
//
// Convención de visibilidad: los métodos `listPublished`/`listActive` son la
// vista PÚBLICA (solo published: true) y `list()` es la vista del PANEL (todo,
// incluidos borradores). Los componentes públicos nunca llaman `list()`.

import type {
  AdminUser,
  BlogPost,
  FaqItem,
  Investment,
  Lead,
  LeadStatus,
  NewsletterSub,
  PageConfig,
  Project,
  Service,
  TeamMember,
  Testimonial,
} from './types';


export interface ProjectRepository {
  /** Panel: todos los proyectos, incluidos borradores. */
  list(): Promise<Project[]>;
  /** Público: solo publicados. */
  listPublished(): Promise<Project[]>;
  /** Público: publicados + destacados. */
  listFeatured(): Promise<Project[]>;
  /** Público: null si no existe o es borrador. El panel usa `getBySlugAdmin`. */
  getBySlug(slug: string): Promise<Project | null>;
  /** Panel: devuelve también borradores. */
  getBySlugAdmin(slug: string): Promise<Project | null>;
  create(project: Project): Promise<Project>;
  update(slug: string, patch: Partial<Project>): Promise<Project>;
  remove(slug: string): Promise<void>;
}

export interface InvestmentRepository {
  /** Panel: todas las oportunidades, incluidas borradores. */
  list(): Promise<Investment[]>;
  /** Público: publicadas y con estado 'activa'. */
  listActive(): Promise<Investment[]>;
  /** Público: todas las publicadas (cualquier estado). */
  listPublished(): Promise<Investment[]>;
  /** Público: null si no existe o es borrador. */
  getBySlug(slug: string): Promise<Investment | null>;
  /** Panel: devuelve también borradores. */
  getBySlugAdmin(slug: string): Promise<Investment | null>;
  create(investment: Investment): Promise<Investment>;
  update(slug: string, patch: Partial<Investment>): Promise<Investment>;
  remove(slug: string): Promise<void>;
}

export interface LeadRepository {
  list(): Promise<Lead[]>;
  create(lead: Omit<Lead, 'id' | 'createdAt' | 'status'>): Promise<Lead>;
  /** Avance en el pipeline y notas internas del seguimiento. */
  update(id: string, patch: { status?: LeadStatus; notes?: string }): Promise<Lead>;
  remove(id: string): Promise<void>;
}

export interface NewsletterRepository {
  list(): Promise<NewsletterSub[]>;
  subscribe(email: string): Promise<NewsletterSub>;
  remove(id: string): Promise<void>;
}

/** Equipo y Servicios son contenido institucional editable desde el panel:
 * cambiar un integrante o reescribir un servicio no debería requerir un deploy. */
export interface TeamRepository {
  list(): Promise<TeamMember[]>;
  create(member: Omit<TeamMember, 'id'>): Promise<TeamMember>;
  update(id: string, patch: Partial<Omit<TeamMember, 'id'>>): Promise<TeamMember>;
  remove(id: string): Promise<void>;
  /** Reordena la grilla pública; recibe los ids en el orden deseado. */
  reorder(ids: string[]): Promise<TeamMember[]>;
}

export interface ServiceRepository {
  list(): Promise<Service[]>;
  create(service: Omit<Service, 'id'>): Promise<Service>;
  update(id: string, patch: Partial<Omit<Service, 'id'>>): Promise<Service>;
  remove(id: string): Promise<void>;
  reorder(ids: string[]): Promise<Service[]>;
}

export interface FaqRepository {
  /** Ordenadas por `sort_order`: en un FAQ el orden es contenido — la pregunta
   * que más tranquiliza va primero, no la que se cargó primero. */
  list(): Promise<FaqItem[]>;
  create(item: Omit<FaqItem, 'id'>): Promise<FaqItem>;
  update(id: string, patch: Partial<Omit<FaqItem, 'id'>>): Promise<FaqItem>;
  remove(id: string): Promise<void>;
  reorder(ids: string[]): Promise<FaqItem[]>;
}

export interface ConfigRepository {
  get(): Promise<PageConfig>;
  update(patch: Partial<PageConfig>): Promise<PageConfig>;
}

export interface AdminUserRepository {
  list(): Promise<AdminUser[]>;
  create(data: { email: string; fullName: string }): Promise<AdminUser>;
  delete(id: string): Promise<void>;
}

export interface BlogPostRepository {
  list(): Promise<BlogPost[]>;
  listPublished(): Promise<BlogPost[]>;
  listFeatured(): Promise<BlogPost[]>;
  getBySlug(slug: string): Promise<BlogPost | null>;
  getBySlugAdmin(slug: string): Promise<BlogPost | null>;
  create(post: Omit<BlogPost, 'id' | 'updatedAt'>): Promise<BlogPost>;
  update(idOrSlug: string, patch: Partial<BlogPost>): Promise<BlogPost>;
  remove(idOrSlug: string): Promise<void>;
}

export interface TestimonialRepository {
  list(): Promise<Testimonial[]>;
  listPublished(): Promise<Testimonial[]>;
  create(testimonial: Omit<Testimonial, 'id' | 'createdAt'>): Promise<Testimonial>;
  update(id: string, patch: Partial<Testimonial>): Promise<Testimonial>;
  remove(id: string): Promise<void>;
}


