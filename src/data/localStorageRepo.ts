// Implementación mock sobre localStorage, seedeada desde fixtures.
// Latencia simulada (400–700 ms) para que los skeletons sean visibles y reales (UX-01).
//
// Migración de forma: los campos `published` (proyectos/inversiones) y
// `status` (leads) se agregaron después de que hubiera datos guardados. Cada
// lectura los normaliza en vez de pedir que el usuario limpie el storage —
// mismo criterio que tendrá el swap a Supabase, donde la columna llega con
// DEFAULT y un backfill.

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
  CONFIG_FIXTURE,
  FAQ_FIXTURE,
  INVESTMENTS_FIXTURE,
  PROJECTS_FIXTURE,
  SERVICES_FIXTURE,
  TEAM_FIXTURE,
} from './fixtures';

const NS = 'templatecero:v1:';

const delay = () =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, 400 + Math.random() * 300),
  );

function load<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch {
    // JSON corrupto → re-seed
  }
  try {
    localStorage.setItem(NS + key, JSON.stringify(seed));
  } catch {
    // Storage lleno o restringido (modo privado): servir el seed igual,
    // sin persistencia — la UI nunca debe quedar colgada por esto.
  }
  return structuredClone(seed);
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(NS + key, JSON.stringify(value));
}

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const now = () => new Date().toISOString();

/** Registros guardados antes de que existiera `published` se leen como publicados:
 * ya estaban visibles en el sitio y despublicarlos en silencio sería una sorpresa. */
const withPublished = <T extends { published?: boolean }>(rows: T[]): T[] =>
  rows.map((r) => (typeof r.published === 'boolean' ? r : { ...r, published: true }));

// ---------------------------------------------------------------- Projects

export class LocalStorageProjectRepository implements ProjectRepository {
  private key = 'projects';

  private all(): Project[] {
    return withPublished(load(this.key, PROJECTS_FIXTURE));
  }

  async list(): Promise<Project[]> {
    await delay();
    return this.all();
  }

  async listPublished(): Promise<Project[]> {
    await delay();
    return this.all().filter((p) => p.published);
  }

  async listFeatured(): Promise<Project[]> {
    await delay();
    return this.all().filter((p) => p.published && p.featured);
  }

  async getBySlug(slug: string): Promise<Project | null> {
    await delay();
    return this.all().find((p) => p.slug === slug && p.published) ?? null;
  }

  async getBySlugAdmin(slug: string): Promise<Project | null> {
    await delay();
    return this.all().find((p) => p.slug === slug) ?? null;
  }

  async create(project: Project): Promise<Project> {
    await delay();
    const all = this.all();
    if (all.some((p) => p.slug === project.slug)) {
      throw new Error(`Ya existe un proyecto con slug "${project.slug}"`);
    }
    const full: Project = { ...project, updatedAt: now() };
    all.unshift(full);
    save(this.key, all);
    return full;
  }

  async update(slug: string, patch: Partial<Project>): Promise<Project> {
    await delay();
    const all = this.all();
    const idx = all.findIndex((p) => p.slug === slug);
    if (idx === -1) throw new Error(`Proyecto "${slug}" no encontrado`);
    all[idx] = { ...all[idx], ...patch, updatedAt: now() };
    save(this.key, all);
    return all[idx];
  }

  async remove(slug: string): Promise<void> {
    await delay();
    save(this.key, this.all().filter((p) => p.slug !== slug));
  }
}

// -------------------------------------------------------------- Investments

export class LocalStorageInvestmentRepository implements InvestmentRepository {
  private key = 'investments';

  private all(): Investment[] {
    return withPublished(load(this.key, INVESTMENTS_FIXTURE));
  }

  async list(): Promise<Investment[]> {
    await delay();
    return this.all();
  }

  async listActive(): Promise<Investment[]> {
    await delay();
    return this.all().filter((i) => i.published && i.status === 'activa');
  }

  async listPublished(): Promise<Investment[]> {
    await delay();
    return this.all().filter((i) => i.published);
  }

  async getBySlug(slug: string): Promise<Investment | null> {
    await delay();
    return this.all().find((i) => i.slug === slug && i.published) ?? null;
  }

  async getBySlugAdmin(slug: string): Promise<Investment | null> {
    await delay();
    return this.all().find((i) => i.slug === slug) ?? null;
  }

  async create(investment: Investment): Promise<Investment> {
    await delay();
    const all = this.all();
    if (all.some((i) => i.slug === investment.slug)) {
      throw new Error(`Ya existe una inversión con slug "${investment.slug}"`);
    }
    const full: Investment = { ...investment, updatedAt: now() };
    all.unshift(full);
    save(this.key, all);
    return full;
  }

  async update(slug: string, patch: Partial<Investment>): Promise<Investment> {
    await delay();
    const all = this.all();
    const idx = all.findIndex((i) => i.slug === slug);
    if (idx === -1) throw new Error(`Inversión "${slug}" no encontrada`);
    all[idx] = { ...all[idx], ...patch, updatedAt: now() };
    save(this.key, all);
    return all[idx];
  }

  async remove(slug: string): Promise<void> {
    await delay();
    save(this.key, this.all().filter((i) => i.slug !== slug));
  }
}

// -------------------------------------------------------------------- Leads

export class LocalStorageLeadRepository implements LeadRepository {
  private key = 'leads';

  private all(): Lead[] {
    return load<Lead[]>(this.key, []).map((l) =>
      l.status ? l : { ...l, status: 'nuevo' as LeadStatus },
    );
  }

  async list(): Promise<Lead[]> {
    await delay();
    return this.all();
  }

  async create(lead: Omit<Lead, 'id' | 'createdAt' | 'status'>): Promise<Lead> {
    await delay();
    const all = this.all();
    const full: Lead = { ...lead, id: newId(), status: 'nuevo', createdAt: now() };
    all.unshift(full);
    save(this.key, all);
    return full;
  }

  async update(id: string, patch: { status?: LeadStatus; notes?: string }): Promise<Lead> {
    await delay();
    const all = this.all();
    const idx = all.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Lead no encontrado');
    all[idx] = { ...all[idx], ...patch, updatedAt: now() };
    save(this.key, all);
    return all[idx];
  }

  async remove(id: string): Promise<void> {
    await delay();
    save(this.key, this.all().filter((l) => l.id !== id));
  }
}

// --------------------------------------------------------------- Newsletter

export class LocalStorageNewsletterRepository implements NewsletterRepository {
  private key = 'newsletter';

  async list(): Promise<NewsletterSub[]> {
    await delay();
    return load<NewsletterSub[]>(this.key, []);
  }

  async subscribe(email: string): Promise<NewsletterSub> {
    await delay();
    const all = load<NewsletterSub[]>(this.key, []);
    const existing = all.find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;
    const sub: NewsletterSub = { id: newId(), email, createdAt: now() };
    all.unshift(sub);
    save(this.key, all);
    return sub;
  }

  async remove(id: string): Promise<void> {
    await delay();
    save(this.key, load<NewsletterSub[]>(this.key, []).filter((s) => s.id !== id));
  }
}

// ------------------------------------------------- Contenido editable (equipo / servicios)

/** CRUD + reorder sobre una colección de contenido con `id` — equipo y
 * servicios comparten exactamente la misma mecánica, así que comparten código. */
class LocalStorageContentRepository<T extends { id: string }> {
  constructor(
    private key: string,
    private seed: T[],
  ) {}

  protected read(): T[] {
    return load(this.key, this.seed);
  }

  async list(): Promise<T[]> {
    await delay();
    return this.read();
  }

  async create(item: Omit<T, 'id'>): Promise<T> {
    await delay();
    const all = this.read();
    const full = { ...item, id: newId() } as T;
    all.push(full);
    save(this.key, all);
    return full;
  }

  async update(id: string, patch: Partial<Omit<T, 'id'>>): Promise<T> {
    await delay();
    const all = this.read();
    const idx = all.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Elemento no encontrado');
    all[idx] = { ...all[idx], ...patch };
    save(this.key, all);
    return all[idx];
  }

  async remove(id: string): Promise<void> {
    await delay();
    save(this.key, this.read().filter((x) => x.id !== id));
  }

  async reorder(ids: string[]): Promise<T[]> {
    await delay();
    const all = this.read();
    const byId = new Map(all.map((x) => [x.id, x]));
    // Los ids que no vengan en la lista quedan al final, en su orden actual:
    // así un reorder con datos desactualizados no borra elementos.
    const ordered = [
      ...ids.map((id) => byId.get(id)).filter((x): x is T => Boolean(x)),
      ...all.filter((x) => !ids.includes(x.id)),
    ];
    save(this.key, ordered);
    return ordered;
  }
}

export class LocalStorageTeamRepository
  extends LocalStorageContentRepository<TeamMember>
  implements TeamRepository
{
  constructor() {
    super('team', TEAM_FIXTURE);
  }
}

export class LocalStorageServiceRepository
  extends LocalStorageContentRepository<Service>
  implements ServiceRepository
{
  constructor() {
    super('services', SERVICES_FIXTURE);
  }
}


// ---------------------------------------------------------------------- FAQ

export class LocalStorageFaqRepository
  extends LocalStorageContentRepository<FaqItem>
  implements FaqRepository
{
  constructor() {
    super('faq', FAQ_FIXTURE);
  }
}

// ------------------------------------------------------------------- Config

export class LocalStorageConfigRepository implements ConfigRepository {
  private key = 'config';

  async get(): Promise<PageConfig> {
    await delay();
    // Merge con el fixture: si el modelo suma un campo nuevo (p. ej.
    // officeCoords) un config guardado viejo no debe llegar incompleto a la UI.
    return { ...CONFIG_FIXTURE, ...load(this.key, CONFIG_FIXTURE) };
  }

  async update(patch: Partial<PageConfig>): Promise<PageConfig> {
    await delay();
    const next = { ...CONFIG_FIXTURE, ...load(this.key, CONFIG_FIXTURE), ...patch };
    save(this.key, next);
    return next;
  }
}

// --------------------------------------------------------------- Admin Users

const ADMIN_USERS_FIXTURE: AdminUser[] = [
  {
    id: 'usr-admin-1',
    email: 'equipo@puntocero.com',
    fullName: 'Equipo Punto Cero',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

export class LocalStorageAdminUserRepository implements AdminUserRepository {
  private key = 'admin_users';

  async list(): Promise<AdminUser[]> {
    await delay();
    return load(this.key, ADMIN_USERS_FIXTURE);
  }

  async create(data: { email: string; fullName: string }): Promise<AdminUser> {
    await delay();
    const items = load<AdminUser[]>(this.key, ADMIN_USERS_FIXTURE);
    const existing = items.find((u) => u.email.toLowerCase() === data.email.trim().toLowerCase());
    if (existing) {
      throw new Error(`El usuario ${data.email} ya está registrado como administrador.`);
    }
    const newUser: AdminUser = {
      id: `usr-${crypto.randomUUID()}`,
      email: data.email.trim().toLowerCase(),
      fullName: data.fullName.trim() || data.email.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    items.unshift(newUser);
    save(this.key, items);
    return newUser;
  }

  async delete(id: string): Promise<void> {
    await delay();
    const items = load<AdminUser[]>(this.key, ADMIN_USERS_FIXTURE);
    const filtered = items.filter((u) => u.id !== id && u.email !== id);
    save(this.key, filtered);
  }
}

