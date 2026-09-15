// Repositorio de contenidos en vivo del sitio (Live CMS).
// Permite sobreescribir cualquier texto o imagen de las secciones públicas
// en tiempo real cuando el administrador está logueado.
//
// Almacena en localStorage ('puntocero:v1:site-content') con notificación
// reactiva inmediata mediante CustomEvent para que toda la interfaz se actualice.

const STORAGE_KEY = 'templatecero:v1:site-content';
export const SITE_CONTENT_UPDATED_EVENT = 'templatecero:site-content-updated';

const DEFAULT_SITE_CONTENT: Record<string, string> = {
  'quienes.teamVisible': 'false',
  'servicios.visible': 'true',
  'inversiones.faq.visible': 'true',
  'featured.visible': 'true',
  'inversiones.visible': 'true',
  'newsletter.visible': 'true',
  'inversiones.calculadora.visible': 'true',
  'home.alianzas.visible': 'true',
  'proyectos.tipologias.visible': 'true',
};

function loadContent(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SITE_CONTENT };
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null
      ? { ...DEFAULT_SITE_CONTENT, ...parsed }
      : { ...DEFAULT_SITE_CONTENT };
  } catch {
    return { ...DEFAULT_SITE_CONTENT };
  }
}

function saveContent(data: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error al guardar site content en localStorage', err);
  }
}

export interface SiteContentRepository {
  getAll(): Promise<Record<string, string>>;
  getSync(): Record<string, string>;
  updateMany(entries: Record<string, string>): Promise<Record<string, string>>;
  reset(key?: string): Promise<Record<string, string>>;
}

class LocalStorageSiteContentRepository implements SiteContentRepository {
  async getAll(): Promise<Record<string, string>> {
    return loadContent();
  }

  getSync(): Record<string, string> {
    return loadContent();
  }

  async updateMany(entries: Record<string, string>): Promise<Record<string, string>> {
    const current = loadContent();
    const updated = { ...current, ...entries };
    saveContent(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(SITE_CONTENT_UPDATED_EVENT, { detail: updated }),
      );
    }
    return updated;
  }

  async reset(key?: string): Promise<Record<string, string>> {
    const current = loadContent();
    let updated: Record<string, string>;
    if (key) {
      updated = { ...current };
      delete updated[key];
    } else {
      updated = {};
    }
    saveContent(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(SITE_CONTENT_UPDATED_EVENT, { detail: updated }),
      );
    }
    return updated;
  }
}

export const siteContentRepo: SiteContentRepository = new LocalStorageSiteContentRepository();
