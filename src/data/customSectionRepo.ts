// Repositorio de Secciones Personalizadas / Dinámicas del sitio.
// Permite que el administrador agregue, edite, reordene y oculte secciones
// con textos, botones, imágenes o videos directamente desde el panel.

import type { CustomSection } from './types';

const STORAGE_KEY = 'templatecero:v1:custom-sections';
export const CUSTOM_SECTIONS_UPDATED_EVENT = 'templatecero:custom-sections-updated';

const SAMPLE_SECTIONS: CustomSection[] = [
  {
    id: 'sec-innovacion',
    kicker: 'Innovación & Tecnología',
    title: 'Construcción inteligente y arquitectura sustentable',
    content:
      'Incorporamos domótica de vanguardia, eficiencia energética y materiales de bajo impacto ambiental en cada uno de nuestros desarrollos para garantizar confort y plusvalía en el tiempo.',
    mediaType: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    ctaText: 'Conocer más',
    ctaLink: '/contacto',
    theme: 'paper-soft',
    published: true,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  },
];

function loadSections(): CustomSection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...SAMPLE_SECTIONS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...SAMPLE_SECTIONS];
  } catch {
    return [...SAMPLE_SECTIONS];
  }
}

function saveSections(data: CustomSection[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error al guardar secciones personalizadas', err);
  }
}

export interface CustomSectionRepository {
  list(): Promise<CustomSection[]>;
  listPublished(): Promise<CustomSection[]>;
  create(section: Omit<CustomSection, 'id' | 'createdAt'>): Promise<CustomSection>;
  update(id: string, patch: Partial<Omit<CustomSection, 'id'>>): Promise<CustomSection>;
  remove(id: string): Promise<void>;
  reorder(ids: string[]): Promise<CustomSection[]>;
}

class LocalStorageCustomSectionRepository implements CustomSectionRepository {
  private notify(data: CustomSection[]) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CUSTOM_SECTIONS_UPDATED_EVENT, { detail: data }));
    }
  }

  async list(): Promise<CustomSection[]> {
    return loadSections().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async listPublished(): Promise<CustomSection[]> {
    const all = await this.list();
    return all.filter((s) => s.published);
  }

  async create(section: Omit<CustomSection, 'id' | 'createdAt'>): Promise<CustomSection> {
    const all = loadSections();
    const newSection: CustomSection = {
      ...section,
      id: crypto.randomUUID(),
      sortOrder: all.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.push(newSection);
    saveSections(all);
    this.notify(all);
    return newSection;
  }

  async update(id: string, patch: Partial<Omit<CustomSection, 'id'>>): Promise<CustomSection> {
    const all = loadSections();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Sección no encontrada');
    all[idx] = {
      ...all[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    saveSections(all);
    this.notify(all);
    return all[idx];
  }

  async remove(id: string): Promise<void> {
    const all = loadSections().filter((s) => s.id !== id);
    saveSections(all);
    this.notify(all);
  }

  async reorder(ids: string[]): Promise<CustomSection[]> {
    const all = loadSections();
    const byId = new Map(all.map((s) => [s.id, s]));
    const reordered: CustomSection[] = [];
    ids.forEach((id, idx) => {
      const item = byId.get(id);
      if (item) {
        reordered.push({ ...item, sortOrder: idx });
        byId.delete(id);
      }
    });
    byId.forEach((item) => {
      reordered.push({ ...item, sortOrder: reordered.length });
    });
    saveSections(reordered);
    this.notify(reordered);
    return reordered;
  }
}

export const customSectionRepo: CustomSectionRepository = new LocalStorageCustomSectionRepository();
