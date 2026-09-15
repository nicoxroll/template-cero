// Mapa de todos los proyectos (idioma realstack, implementación propia).
//
// Diferencias con la referencia, que hace lo mismo inyectando un <script> de
// Leaflet desde un CDN y hablándole a `window.L`:
//   · react-leaflet desde npm — tipado, versionado por el bundler y sin un
//     request extra fuera del control de Vite;
//   · el encuadre se calcula con fitBounds sobre TODOS los marcadores, en vez
//     del promedio de coordenadas con zoom fijo (que deja proyectos fuera de
//     cuadro cuando están dispersos);
//   · la ficha del proyecto vive en un panel al costado, no dentro del popup:
//     un popup es una caja chica flotando sobre el mapa, tapa marcadores
//     vecinos y se cierra sola: mala vitrina para la foto, las specs y el CTA.
//     El popup queda como confirmación mínima de qué marcador se tocó.
//
// Se recibe la lista YA FILTRADA: mover un filtro reencuadra el mapa, que es
// el comportamiento que hace útil tener las dos vistas juntas.

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import BrandTiles from '../ui/BrandTiles';
import { latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, MapPin, MousePointerClick } from 'lucide-react';
import { brandMarkerIcon, brandMarkerIconActive } from '../../lib/mapIcon';
import { prefersReducedMotion } from '../../lib/useReducedMotion';
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, type Project } from '../../data';
import Button from '../ui/Button';
import { Photo } from '../ui/Skeleton';

const STATUS_BADGE: Record<Project['status'], string> = {
  'en-pozo': 'border-brand-100 bg-brand-50 text-brand-700',
  'en-obra': 'border-brand-100 bg-brand-100 text-brand-900',
  terminado: 'border-brand-900 bg-brand-900 text-white',
};

/** Reencuadra para que entren todos los marcadores actuales. */
function FitToProjects({ points, fitKey }: { points: [number, number][]; fitKey: number }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
    // fitKey en las dependencias: es lo que deja al boton "Ver todos"
    // reencuadrar aunque los puntos no hayan cambiado.
  }, [map, points, fitKey]);

  return null;
}

/** Centra el mapa en el proyecto elegido desde el panel o el marcador. */
function FlyToSelected({ target }: { target: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    const zoom = Math.max(map.getZoom(), 15);
    // La animación de vuelo es exactamente el tipo de movimiento que
    // prefers-reduced-motion pide evitar: ahí se salta al destino.
    if (prefersReducedMotion()) map.setView(target, zoom);
    else map.flyTo(target, zoom, { duration: 0.8 });
  }, [map, target]);

  return null;
}

/** Ficha del proyecto seleccionado: lo que en la referencia entra apretado en
 * el popup, acá con lugar para la foto, las specs y el CTA. */
function FichaProyecto({ project }: { project: Project }) {
  return (
    <article className="border border-hairline bg-paper">
      <Photo
        src={project.coverImage}
        alt={project.name}
        loading="lazy"
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="p-6">
        <span
          className={`inline-block border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest ${STATUS_BADGE[project.status]}`}
        >
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
        <h3 className="mt-4 text-xl font-light tracking-wide text-ink">{project.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-light text-ink-soft">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" strokeWidth={1.5} aria-hidden />
          {project.location}
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-widest text-ink-soft">
          {PROJECT_TYPE_LABELS[project.type]}
        </p>

        {project.specs.length > 0 && (
          <dl className="mt-5 space-y-2 border-t border-hairline pt-5">
            {project.specs.slice(0, 3).map((spec) => (
              <div key={spec.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-xs font-medium uppercase tracking-widest text-ink-soft">
                  {spec.label}
                </dt>
                <dd className="text-right text-sm font-light text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <Button to={`/proyectos/${project.slug}`} variant="outline" className="mt-6 w-full">
          Ver proyecto
        </Button>
      </div>
    </article>
  );
}

interface ProyectosMapaProps {
  projects: Project[];
}

export default function ProyectosMapa({ projects }: ProyectosMapaProps) {
  // Coordenadas en 0,0 son el "sin dato" clásico de un formulario a medio
  // cargar: en el Golfo de Guinea, a 6.000 km de cualquier obra.
  const conCoords = useMemo(
    () => projects.filter((p) => p.coords && (p.coords.lat !== 0 || p.coords.lng !== 0)),
    [projects],
  );

  const points = useMemo<[number, number][]>(
    () => conCoords.map((p) => [p.coords.lat, p.coords.lng]),
    [conCoords],
  );

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  // Contador que fuerza el reencuadre: el botón "Ver todos" tiene que poder
  // alejar el mapa aunque la lista de puntos sea la misma de antes.
  const [fitKey, setFitKey] = useState(0);
  // Se resuelve contra la lista filtrada, no se guarda el objeto: si un filtro
  // saca al proyecto elegido, la selección se vacía sola en vez de mostrar una
  // ficha de algo que ya no está en el mapa.
  const selected = conCoords.find((p) => p.slug === selectedSlug) ?? null;
  const target = selected ? ([selected.coords.lat, selected.coords.lng] as [number, number]) : null;

  if (conCoords.length === 0) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center border border-hairline bg-paper-soft text-center">
        <MapPin className="mb-4 h-10 w-10 text-brand-300" strokeWidth={1.5} aria-hidden />
        <p className="text-sm font-light text-ink-soft">
          Ningún proyecto de esta selección tiene ubicación cargada.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8 xl:grid-cols-[1fr_22rem]">
      {/* self-start: sin esto la celda del grid estira el recuadro hasta la
          altura del panel lateral y queda un bloque vacío bordeado debajo del
          mapa. */}
      <div className="relative self-start border border-hairline">
        {/* z-[500]: los controles de Leaflet viven en z-400, así que un botón
            sin z propio queda debajo del +/− y del atribución. */}
        <button
          type="button"
          onClick={() => {
            setSelectedSlug(null);
            setFitKey((k) => k + 1);
          }}
          className="focus-ring absolute right-3 top-3 z-[500] inline-flex items-center gap-2 border border-hairline bg-paper/95 px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-ink shadow-sm backdrop-blur-sm transition-colors hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-300"
        >
          <Maximize2 className="h-3.5 w-3.5 text-brand-500" strokeWidth={1.5} aria-hidden />
          Ver todos
        </button>

        <MapContainer
          attributionControl={false}
          center={points[0]}
          zoom={12}
          scrollWheelZoom={false}
          className="z-0 h-[340px] w-full sm:h-[420px] lg:h-[560px]"
        >
          <BrandTiles />
          <FitToProjects points={points} fitKey={fitKey} />
          <FlyToSelected target={target} />
          {conCoords.map((p) => (
            <Marker
              key={p.slug}
              position={[p.coords.lat, p.coords.lng]}
              icon={p.slug === selectedSlug ? brandMarkerIconActive : brandMarkerIcon}
              eventHandlers={{ click: () => setSelectedSlug(p.slug) }}
            >
              {/* Popup mínimo: confirma qué marcador se tocó. El detalle está
                  en la ficha del panel, que no tapa el mapa ni se cierra sola. */}
              <Popup closeButton={false}>
                <span className="block text-sm font-medium text-ink">{p.name}</span>
                <span className="block text-xs text-ink-soft">{p.location}</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Panel lateral: ficha del seleccionado + lista para elegir sin tener
          que cazar marcadores. Sticky en desktop para que acompañe el scroll. */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {selected ? (
          <FichaProyecto project={selected} />
        ) : (
          <div className="flex flex-col items-center border border-dashed border-hairline bg-paper-soft px-6 py-10 text-center">
            <MousePointerClick className="h-8 w-8 text-brand-300" strokeWidth={1.5} aria-hidden />
            <p className="mt-4 text-sm font-light leading-relaxed text-ink-soft">
              Elegí un proyecto en el mapa o en la lista para ver su ficha.
            </p>
          </div>
        )}

        <ul className="mt-4 divide-y divide-hairline border border-hairline bg-paper">
          {conCoords.map((p) => {
            const active = p.slug === selectedSlug;
            return (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(p.slug)}
                  aria-pressed={active}
                  className={`focus-ring flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-300 ${
                    active
                      ? 'bg-brand-50 dark:bg-brand-900/40'
                      : 'hover:bg-brand-50/60 dark:hover:bg-brand-900/30'
                  }`}
                >
                  <MapPin
                    className={`h-4 w-4 shrink-0 ${active ? 'text-brand-500' : 'text-ink-soft/50'}`}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-light text-ink">{p.name}</span>
                    <span className="block truncate text-xs font-light text-ink-soft">
                      {p.location}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
