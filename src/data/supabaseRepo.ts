// Implementación de los repositorios contra Supabase.
//
// Cumple exactamente el mismo contrato que LocalStorageRepo (ver
// repositories.ts): los componentes no saben cuál de las dos está montada.
// El mapeo fila ↔ dominio vive en supabaseMappers.ts; acá solo hay queries.
//
// Dos reglas transversales:
//
//   1. **La visibilidad la impone RLS, no el cliente.** Los métodos públicos
//      igual mandan `.eq('published', true)` — no por seguridad (un cliente
//      nunca es la barrera), sino porque el panel usa la MISMA sesión que el
//      sitio: con el equipo logueado, RLS deja pasar los borradores y la home
//      empezaría a mostrarlos. El filtro explícito garantiza que la vista
//      pública sea la misma para todos.
//
//   2. **Los errores se propagan.** Devolver [] ante un fallo de red haría que
//      la UI muestre "todavía no hay proyectos" cuando en realidad se cayó la
//      conexión. Cada pantalla ya decide su fallback.

import { getSupabase } from './supabaseClient';
import type {
  AdminUser,
  FaqItem,
  Investment,
  Lead,
  LeadStatus,
  NewsletterSub,
  PageConfig,
  Project,
  Service,
  TeamMember,
} from './types';
import type {
  AdminUserRepository,
  ConfigRepository,
  FaqRepository,
  InvestmentRepository,
  LeadRepository,
  NewsletterRepository,
  ProjectRepository,
  ServiceRepository,
  TeamRepository,
} from './repositories';
import {
  fromInvestment,
  fromPageConfigPatch,
  fromProject,
  fromProjectPatch,
  toAdminUser,
  toInvestment,
  toLead,
  toNewsletterSub,
  toFaq,
  toPageConfig,
  toProject,
  toService,
  toTeamMember,
  type AdminUserRow,
  type FaqRow,
  type InvestmentRow,
  type LeadRow,
  type NewsletterRow,
  type PageConfigRow,
  type ProjectRow,
  type ServiceRow,
  type TeamRow,
} from './supabaseMappers';


/** Postgres devuelve 'PGRST116' cuando `.single()` no encontró fila: eso no es
 * un error de infraestructura, es "no existe" y se traduce a null. */
const NOT_FOUND = 'PGRST116';

function fail(op: string, error: { message: string } | null): never {
  throw new Error(`Supabase — ${op}: ${error?.message ?? 'error desconocido'}`);
}

/** Columnas de investments + el slug del proyecto vinculado (el dominio
 * referencia por slug, la DB por id). */
const INVESTMENT_SELECT = '*, projects(slug)';

// ---------------------------------------------------------------- Projects

export class SupabaseProjectRepository implements ProjectRepository {
  async list(): Promise<Project[]> {
    const { data, error } = await getSupabase()
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) fail('listar proyectos', error);
    return (data as ProjectRow[]).map(toProject);
  }

  async listPublished(): Promise<Project[]> {
    const { data, error } = await getSupabase()
      .from('projects')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (error) fail('listar proyectos publicados', error);
    return (data as ProjectRow[]).map(toProject);
  }

  async listFeatured(): Promise<Project[]> {
    const { data, error } = await getSupabase()
      .from('projects')
      .select('*')
      .eq('published', true)
      .eq('featured', true)
      .order('created_at', { ascending: false });
    if (error) fail('listar proyectos destacados', error);
    return (data as ProjectRow[]).map(toProject);
  }

  async getBySlug(slug: string): Promise<Project | null> {
    const { data, error } = await getSupabase()
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();
    if (error) {
      if (error.code === NOT_FOUND) return null;
      fail(`obtener proyecto "${slug}"`, error);
    }
    return toProject(data as ProjectRow);
  }

  async getBySlugAdmin(slug: string): Promise<Project | null> {
    const { data, error } = await getSupabase()
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) {
      if (error.code === NOT_FOUND) return null;
      fail(`obtener proyecto "${slug}"`, error);
    }
    return toProject(data as ProjectRow);
  }

  async create(project: Project): Promise<Project> {
    const { data, error } = await getSupabase()
      .from('projects')
      .insert(fromProject(project))
      .select('*')
      .single();
    // 23505 = unique_violation. El slug es la URL pública: el mensaje tiene que
    // decir qué pasó, no filtrar el detalle interno de Postgres.
    if (error) {
      if (error.code === '23505') {
        throw new Error(`Ya existe un proyecto con slug "${project.slug}"`);
      }
      fail('crear proyecto', error);
    }
    return toProject(data as ProjectRow);
  }

  async update(slug: string, patch: Partial<Project>): Promise<Project> {
    const { data, error } = await getSupabase()
      .from('projects')
      .update(fromProjectPatch(patch))
      .eq('slug', slug)
      .select('*')
      .single();
    if (error) fail(`actualizar proyecto "${slug}"`, error);
    return toProject(data as ProjectRow);
  }

  async remove(slug: string): Promise<void> {
    const { error } = await getSupabase().from('projects').delete().eq('slug', slug);
    if (error) fail(`eliminar proyecto "${slug}"`, error);
  }
}

// -------------------------------------------------------------- Investments

export class SupabaseInvestmentRepository implements InvestmentRepository {
  /** El dominio guarda `projectSlug`; la FK de la DB es `project_id`. */
  private async resolveProjectId(slug: string | null): Promise<string | null> {
    if (!slug) return null;
    const { data, error } = await getSupabase()
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .single();
    if (error) {
      if (error.code === NOT_FOUND) {
        throw new Error(`El proyecto vinculado "${slug}" no existe`);
      }
      fail('resolver proyecto vinculado', error);
    }
    return (data as { id: string }).id;
  }

  async list(): Promise<Investment[]> {
    const { data, error } = await getSupabase()
      .from('investments')
      .select(INVESTMENT_SELECT)
      .order('created_at', { ascending: false });
    if (error) fail('listar inversiones', error);
    return (data as unknown as InvestmentRow[]).map(toInvestment);
  }

  async listActive(): Promise<Investment[]> {
    const { data, error } = await getSupabase()
      .from('investments')
      .select(INVESTMENT_SELECT)
      .eq('published', true)
      .eq('status', 'activa')
      .order('created_at', { ascending: false });
    if (error) fail('listar inversiones activas', error);
    return (data as unknown as InvestmentRow[]).map(toInvestment);
  }

  async listPublished(): Promise<Investment[]> {
    const { data, error } = await getSupabase()
      .from('investments')
      .select(INVESTMENT_SELECT)
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (error) fail('listar inversiones publicadas', error);
    return (data as unknown as InvestmentRow[]).map(toInvestment);
  }

  async getBySlug(slug: string): Promise<Investment | null> {
    const { data, error } = await getSupabase()
      .from('investments')
      .select(INVESTMENT_SELECT)
      .eq('slug', slug)
      .eq('published', true)
      .single();
    if (error) {
      if (error.code === NOT_FOUND) return null;
      fail(`obtener inversión "${slug}"`, error);
    }
    return toInvestment(data as unknown as InvestmentRow);
  }

  async getBySlugAdmin(slug: string): Promise<Investment | null> {
    const { data, error } = await getSupabase()
      .from('investments')
      .select(INVESTMENT_SELECT)
      .eq('slug', slug)
      .single();
    if (error) {
      if (error.code === NOT_FOUND) return null;
      fail(`obtener inversión "${slug}"`, error);
    }
    return toInvestment(data as unknown as InvestmentRow);
  }

  async create(investment: Investment): Promise<Investment> {
    const projectId = await this.resolveProjectId(investment.projectSlug);
    const { data, error } = await getSupabase()
      .from('investments')
      .insert(fromInvestment(investment, projectId))
      .select(INVESTMENT_SELECT)
      .single();
    if (error) {
      if (error.code === '23505') {
        throw new Error(`Ya existe una inversión con slug "${investment.slug}"`);
      }
      fail('crear inversión', error);
    }
    return toInvestment(data as unknown as InvestmentRow);
  }

  async update(slug: string, patch: Partial<Investment>): Promise<Investment> {
    // El formulario manda la inversión completa; los toggles del listado mandan
    // un patch de una sola clave. Ambos casos tienen que funcionar sin pisar
    // columnas que no vinieron.
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.amount !== undefined) row.amount = patch.amount;
    if (patch.currency !== undefined) row.currency = patch.currency;
    if (patch.estReturn !== undefined) row.est_return = patch.estReturn;
    if (patch.termMonths !== undefined) row.term_months = patch.termMonths;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.coverImage !== undefined) row.cover_image = patch.coverImage;
    if (patch.docs !== undefined) row.docs = patch.docs;
    if (patch.fiduciario !== undefined) row.fiduciario = patch.fiduciario;
    if (patch.tipoEstructura !== undefined) row.tipo_estructura = patch.tipoEstructura;
    if (patch.ticketMinimo !== undefined) row.ticket_minimo = patch.ticketMinimo;
    if (patch.moneda !== undefined) row.moneda = patch.moneda;
    if (patch.integracion !== undefined) row.integracion = patch.integracion;
    if (patch.hitosDesembolso !== undefined) row.hitos_desembolso = patch.hitosDesembolso;
    if (patch.salida !== undefined) row.salida = patch.salida;
    if (patch.escribania !== undefined) row.escribania = patch.escribania;
    if (patch.published !== undefined) row.published = patch.published;
    // `projectSlug: null` es un valor legítimo (desvincular), así que se
    // distingue "no vino la clave" de "vino en null" con `in`.
    if ('projectSlug' in patch) {
      row.project_id = await this.resolveProjectId(patch.projectSlug ?? null);
    }

    const { data, error } = await getSupabase()
      .from('investments')
      .update(row)
      .eq('slug', slug)
      .select(INVESTMENT_SELECT)
      .single();
    if (error) fail(`actualizar inversión "${slug}"`, error);
    return toInvestment(data as unknown as InvestmentRow);
  }

  async remove(slug: string): Promise<void> {
    const { error } = await getSupabase().from('investments').delete().eq('slug', slug);
    if (error) fail(`eliminar inversión "${slug}"`, error);
  }
}

// -------------------------------------------------------------------- Leads

export class SupabaseLeadRepository implements LeadRepository {
  async list(): Promise<Lead[]> {
    const { data, error } = await getSupabase()
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) fail('listar consultas', error);
    return (data as LeadRow[]).map(toLead);
  }

  async create(lead: Omit<Lead, 'id' | 'createdAt' | 'status'>): Promise<Lead> {
    // El visitante anónimo tiene INSERT pero no SELECT (RLS), así que un
    // `.select()` después del insert devolvería vacío y rompería el formulario
    // público. Se construye la respuesta desde lo que se envió.
    const payload = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      source: lead.source,
      interest_slug: lead.interestSlug ?? null,
    };
    const { error } = await getSupabase().from('leads').insert(payload);
    if (error) fail('registrar la consulta', error);
    return {
      ...lead,
      id: '',
      status: 'nuevo',
      createdAt: new Date().toISOString(),
    };
  }

  async update(id: string, patch: { status?: LeadStatus; notes?: string }): Promise<Lead> {
    const row: Record<string, unknown> = {};
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.notes !== undefined) row.notes = patch.notes;
    const { data, error } = await getSupabase()
      .from('leads')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) fail('actualizar la consulta', error);
    return toLead(data as LeadRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await getSupabase().from('leads').delete().eq('id', id);
    if (error) fail('eliminar la consulta', error);
  }
}

// --------------------------------------------------------------- Newsletter

export class SupabaseNewsletterRepository implements NewsletterRepository {
  async list(): Promise<NewsletterSub[]> {
    const { data, error } = await getSupabase()
      .from('newsletter_subs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) fail('listar suscripciones', error);
    return (data as NewsletterRow[]).map(toNewsletterSub);
  }

  async subscribe(email: string): Promise<NewsletterSub> {
    // Se normaliza ANTES de insertar. El índice único es sobre lower(email),
    // pero no recorta espacios: sin este trim, "ana@x.com " y "ana@x.com" son
    // dos claves distintas y la misma persona entra dos veces en la lista.
    const normalizado = email.trim().toLowerCase();
    const { error } = await getSupabase()
      .from('newsletter_subs')
      .insert({ email: normalizado });
    // 23505 = ya estaba suscripto. Es el flujo feliz, no un error: el índice
    // único sobre lower(email) es justamente lo que evita duplicados, y el
    // anónimo no puede consultar antes de insertar (no tiene SELECT).
    if (error && error.code !== '23505') fail('registrar la suscripción', error);
    return { id: '', email: normalizado, createdAt: new Date().toISOString() };
  }

  async remove(id: string): Promise<void> {
    const { error } = await getSupabase().from('newsletter_subs').delete().eq('id', id);
    if (error) fail('eliminar la suscripción', error);
  }
}

// ------------------------------------------------- Contenido (equipo / servicios)

export class SupabaseTeamRepository implements TeamRepository {
  async list(): Promise<TeamMember[]> {
    const { data, error } = await getSupabase()
      .from('team_members')
      .select('*')
      .order('sort_order', { ascending: true })
      // Desempate estable: sin segundo criterio, dos filas con el mismo
      // sort_order salen en el orden en que las devuelve el heap, que cambia
      // con cualquier UPDATE. La grilla se reacomodaba sola sin que nadie la
      // tocara.
      .order('created_at', { ascending: true });
    if (error) fail('listar el equipo', error);
    return (data as TeamRow[]).map(toTeamMember);
  }

  async create(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
    // Nuevo integrante al final de la grilla: el orden explícito lo pone el
    // admin después, con las flechas.
    const sortOrder = await nextSortOrder('team_members');
    const { data, error } = await getSupabase()
      .from('team_members')
      .insert({ ...member, sort_order: sortOrder })
      .select('*')
      .single();
    if (error) fail('crear integrante', error);
    return toTeamMember(data as TeamRow);
  }

  async update(id: string, patch: Partial<Omit<TeamMember, 'id'>>): Promise<TeamMember> {
    const { data, error } = await getSupabase()
      .from('team_members')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) fail('actualizar integrante', error);
    return toTeamMember(data as TeamRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await getSupabase().from('team_members').delete().eq('id', id);
    if (error) fail('eliminar integrante', error);
  }

  async reorder(ids: string[]): Promise<TeamMember[]> {
    await reorderRows('team_members', ids);
    return this.list();
  }
}

export class SupabaseServiceRepository implements ServiceRepository {
  async list(): Promise<Service[]> {
    const { data, error } = await getSupabase()
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true })
      // Desempate estable: sin segundo criterio, dos filas con el mismo
      // sort_order salen en el orden en que las devuelve el heap, que cambia
      // con cualquier UPDATE. La grilla se reacomodaba sola sin que nadie la
      // tocara.
      .order('created_at', { ascending: true });
    if (error) fail('listar servicios', error);
    return (data as ServiceRow[]).map(toService);
  }

  async create(service: Omit<Service, 'id'>): Promise<Service> {
    const sortOrder = await nextSortOrder('services');
    const { data, error } = await getSupabase()
      .from('services')
      .insert({ ...service, sort_order: sortOrder })
      .select('*')
      .single();
    if (error) {
      if (error.code === '23505') {
        throw new Error(`Ya existe un servicio con slug "${service.slug}"`);
      }
      fail('crear servicio', error);
    }
    return toService(data as ServiceRow);
  }

  async update(id: string, patch: Partial<Omit<Service, 'id'>>): Promise<Service> {
    const { data, error } = await getSupabase()
      .from('services')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) fail('actualizar servicio', error);
    return toService(data as ServiceRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await getSupabase().from('services').delete().eq('id', id);
    if (error) fail('eliminar servicio', error);
  }

  async reorder(ids: string[]): Promise<Service[]> {
    await reorderRows('services', ids);
    return this.list();
  }
}

export class SupabaseFaqRepository implements FaqRepository {
  async list(): Promise<FaqItem[]> {
    const { data, error } = await getSupabase()
      .from('faq_items')
      .select('*')
      .order('sort_order', { ascending: true })
      // Desempate estable: sin segundo criterio, dos filas con el mismo
      // sort_order salen en el orden en que las devuelve el heap, que cambia
      // con cualquier UPDATE. La grilla se reacomodaba sola sin que nadie la
      // tocara.
      .order('created_at', { ascending: true });
    if (error) fail('listar preguntas frecuentes', error);
    return (data as FaqRow[]).map(toFaq);
  }

  async create(item: Omit<FaqItem, 'id'>): Promise<FaqItem> {
    // La nueva va al final. Sin slug no hay unicidad que violar, así que —a
    // diferencia de crear un servicio— acá no hay un 23505 que traducir.
    const sortOrder = await nextSortOrder('faq_items');
    const { data, error } = await getSupabase()
      .from('faq_items')
      .insert({ ...item, sort_order: sortOrder })
      .select('*')
      .single();
    if (error) fail('crear pregunta frecuente', error);
    return toFaq(data as FaqRow);
  }

  async update(id: string, patch: Partial<Omit<FaqItem, 'id'>>): Promise<FaqItem> {
    const { data, error } = await getSupabase()
      .from('faq_items')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) fail('actualizar pregunta frecuente', error);
    return toFaq(data as FaqRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await getSupabase().from('faq_items').delete().eq('id', id);
    if (error) fail('eliminar pregunta frecuente', error);
  }

  async reorder(ids: string[]): Promise<FaqItem[]> {
    await reorderRows('faq_items', ids);
    return this.list();
  }
}

/** Próximo `sort_order` de una tabla ordenable: max + 1, NO count().
 *
 * Con count() el número colisiona apenas hay un hueco. Repro exacto con el seed:
 * borrar al integrante de sort_order 1 deja {0, 2, 3} con count = 3, así que el
 * alta siguiente nace en 3 — empatada con el último. Y con huecos más grandes,
 * {0, 5, 9}, el nuevo entra en 3: en el MEDIO de la grilla pública, justo lo
 * contrario de lo que promete "va al final".
 *
 * max + 1 no reutiliza huecos, que es exactamente lo que se quiere: el orden lo
 * decide el equipo con las flechas del panel, no el azar de qué se borró. */
async function nextSortOrder(
  table: 'team_members' | 'services' | 'faq_items',
): Promise<number> {
  const { data } = await getSupabase()
    .from(table)
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data as { sort_order: number } | null)?.sort_order ?? -1) + 1;
}

/** Reordena escribiendo `sort_order` = posición. Se hace con updates en
 * paralelo y no con un upsert masivo porque un upsert exigiría mandar la fila
 * completa de cada registro (y pisaría cualquier edición concurrente). */
async function reorderRows(
  table: 'team_members' | 'services' | 'faq_items',
  ids: string[],
): Promise<void> {
  const supabase = getSupabase();
  const results = await Promise.all(
    ids.map((id, index) => supabase.from(table).update({ sort_order: index }).eq('id', id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) fail('reordenar', failed.error);
}

// ------------------------------------------------------------------- Config

export class SupabaseConfigRepository implements ConfigRepository {
  async get(): Promise<PageConfig> {
    const { data, error } = await getSupabase()
      .from('page_config')
      .select('*')
      .eq('id', 1)
      .single();
    if (error) fail('leer la configuración del sitio', error);
    return toPageConfig(data as PageConfigRow);
  }

  async update(patch: Partial<PageConfig>): Promise<PageConfig> {
    const { data, error } = await getSupabase()
      .from('page_config')
      .update(fromPageConfigPatch(patch))
      .eq('id', 1)
      .select('*')
      .single();
    if (error) fail('guardar la configuración del sitio', error);
    return toPageConfig(data as PageConfigRow);
  }
}

// --------------------------------------------------------------- Admin Users

export class SupabaseAdminUserRepository implements AdminUserRepository {
  async list(): Promise<AdminUser[]> {
    const { data, error } = await getSupabase()
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) fail('listar administradores', error);
    return (data as AdminUserRow[]).map(toAdminUser);
  }

  async create(data: { email: string; fullName: string }): Promise<AdminUser> {
    const emailNorm = data.email.trim().toLowerCase();
    const fullName = data.fullName.trim() || emailNorm.split('@')[0];

    const { data: existing } = await getSupabase()
      .from('admin_users')
      .select('email')
      .eq('email', emailNorm)
      .maybeSingle();

    if (existing) {
      throw new Error(`El usuario ${emailNorm} ya está autorizado como administrador.`);
    }

    const { data: inserted, error } = await getSupabase()
      .from('admin_users')
      .insert({
        email: emailNorm,
        full_name: fullName,
      })
      .select('*')
      .single();

    if (error) fail('autorizar nuevo administrador', error);
    return toAdminUser(inserted as AdminUserRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('admin_users')
      .delete()
      .or(`user_id.eq.${id},email.eq.${id}`);
    if (error) fail('eliminar administrador', error);
  }
}

