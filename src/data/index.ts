// Punto de entrada de la capa de datos.
// Los componentes importan SOLO desde 'src/data' (tipos + singletons de repos)
// y no saben cuál de las dos implementaciones está montada.
//
// El swap es automático y vive acá, en un solo lugar:
//   · con VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY → Supabase
//   · sin ellas                                      → localStorage (mock)
//
// Automático y no un flag manual a propósito: el repo se puede clonar y correr
// con `npm run dev` sin backend ni configuración (así se desarrolló toda la
// fase v1), y el mismo build apunta a la base real apenas existe el .env.

import {
  LocalStorageAdminUserRepository,
  LocalStorageConfigRepository,
  LocalStorageFaqRepository,
  LocalStorageInvestmentRepository,
  LocalStorageLeadRepository,
  LocalStorageNewsletterRepository,
  LocalStorageProjectRepository,
  LocalStorageServiceRepository,
  LocalStorageTeamRepository,
} from './localStorageRepo';
import {
  SupabaseAdminUserRepository,
  SupabaseConfigRepository,
  SupabaseFaqRepository,
  SupabaseInvestmentRepository,
  SupabaseLeadRepository,
  SupabaseNewsletterRepository,
  SupabaseProjectRepository,
  SupabaseServiceRepository,
  SupabaseTeamRepository,
} from './supabaseRepo';
import { SUPABASE_READY } from './supabaseClient';
import { withLocalFallback } from './resilientRepo';
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

export * from './types';
export type * from './repositories';

/** true = los datos vienen de Supabase; false = mock local sin persistencia
 * en servidor. Lo lee el banner del panel para no mentir sobre qué está viendo
 * el usuario. */
export const USING_REAL_BACKEND = SUPABASE_READY;

/** true si alguna lectura ya tuvo que caer a los datos locales: hay backend
 * configurado pero no está contestando. */
export { isBackendDegraded, subscribeBackendStatus } from './resilientRepo';

/** Monta el repositorio remoto con el local de red: sin credenciales el local
 * ES el repositorio; con credenciales, el remoto manda y el local sólo entra si
 * una LECTURA falla. Ver src/data/resilientRepo.ts para los límites de esa
 * caída (por qué las escrituras no caen, y por qué una respuesta vacía tampoco). */
function mount<T extends object>(remote: () => T, local: () => T, label: string): T {
  if (!SUPABASE_READY) return local();
  return withLocalFallback(remote(), local(), label);
}

export const projectRepo: ProjectRepository = mount<ProjectRepository>(
  () => new SupabaseProjectRepository(),
  () => new LocalStorageProjectRepository(),
  'projectRepo',
);

export const investmentRepo: InvestmentRepository = mount<InvestmentRepository>(
  () => new SupabaseInvestmentRepository(),
  () => new LocalStorageInvestmentRepository(),
  'investmentRepo',
);

// leadRepo y newsletterRepo también se envuelven, pero su método útil —crear un
// contacto— es una ESCRITURA, así que en la práctica nunca cae: si la base no
// responde, el formulario tiene que mostrar el error. Guardarle el lead en el
// localStorage de su propia máquina sería perderlo con una sonrisa.
export const leadRepo: LeadRepository = mount<LeadRepository>(
  () => new SupabaseLeadRepository(),
  () => new LocalStorageLeadRepository(),
  'leadRepo',
);

export const newsletterRepo: NewsletterRepository = mount<NewsletterRepository>(
  () => new SupabaseNewsletterRepository(),
  () => new LocalStorageNewsletterRepository(),
  'newsletterRepo',
);

export const teamRepo: TeamRepository = mount<TeamRepository>(
  () => new SupabaseTeamRepository(),
  () => new LocalStorageTeamRepository(),
  'teamRepo',
);

export const serviceRepo: ServiceRepository = mount<ServiceRepository>(
  () => new SupabaseServiceRepository(),
  () => new LocalStorageServiceRepository(),
  'serviceRepo',
);

export const configRepo: ConfigRepository = mount<ConfigRepository>(
  () => new SupabaseConfigRepository(),
  () => new LocalStorageConfigRepository(),
  'configRepo',
);

export const faqRepo: FaqRepository = mount<FaqRepository>(
  () => new SupabaseFaqRepository(),
  () => new LocalStorageFaqRepository(),
  'faqRepo',
);

export const adminUserRepo: AdminUserRepository = mount<AdminUserRepository>(
  () => new SupabaseAdminUserRepository(),
  () => new LocalStorageAdminUserRepository(),
  'adminUserRepo',
);

export { siteContentRepo, SITE_CONTENT_UPDATED_EVENT } from './siteContentRepo';
export type { SiteContentRepository } from './siteContentRepo';
export { customSectionRepo, CUSTOM_SECTIONS_UPDATED_EVENT } from './customSectionRepo';
export type { CustomSectionRepository } from './customSectionRepo';


