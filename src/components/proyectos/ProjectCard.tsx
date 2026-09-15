// PROY-02: card de proyecto — foto con zoom al hover, nombre, ubicación,
// badge de estado y etiqueta Render/Concepto vs Obra (isRender). Linkea al detalle.
// Soporta acceso rápido de edición para administradores en vivo.

import { Link } from 'react-router';
import { MapPin, Pencil } from 'lucide-react';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  type Project,
} from '../../data';
import Card from '../ui/Card';
import { Photo } from '../ui/Skeleton';
import { useLiveCMS } from '../../lib/LiveCMSContext';

const STATUS_BADGE: Record<Project['status'], string> = {
  'en-pozo': 'bg-brand-100 text-brand-900',
  'en-obra': 'bg-brand-900 text-white',
  terminado: 'bg-brand-900 text-white',
};

export default function ProjectCard({ project }: { project: Project }) {
  const { isEditMode } = useLiveCMS();

  return (
    <div className="relative h-full">
      <Link
        to={`/proyectos/${project.slug}`}
        aria-label={`Ver proyecto ${project.name}`}
        className="block h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:focus-visible:outline-brand-300"
      >
        <Card interactive className="h-full">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Photo
              src={project.coverImage}
              alt={project.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span
              className={`absolute left-4 top-4 px-3 py-1 text-xs font-medium uppercase tracking-widest ${STATUS_BADGE[project.status]}`}
            >
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
            <span className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white backdrop-blur-sm">
              {project.isRender ? 'Render / Concepto' : 'Obra'}
            </span>
          </div>
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-widest text-brand-500">
              {PROJECT_TYPE_LABELS[project.type]}
            </p>
            <h3 className="mt-2 text-xl font-light tracking-wide text-ink md:text-2xl">
              {project.name}
            </h3>
            <p className="mt-3 flex items-center gap-1.5 text-sm font-light text-ink-soft">
              <MapPin aria-hidden className="h-4 w-4 text-brand-500" strokeWidth={1.5} />
              {project.location}
            </p>
          </div>
        </Card>
      </Link>

      {isEditMode && (
        <Link
          to={`/admin/proyectos`}
          className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 shadow-md rounded transition-colors"
          title="Editar proyecto en Panel"
        >
          <Pencil className="w-3 h-3" />
          <span>Editar</span>
        </Link>
      )}
    </div>
  );
}
