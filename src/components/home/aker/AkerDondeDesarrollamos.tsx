// "Dónde desarrollamos" — mapeado de "Where we invest" de Aker: banda
// full-bleed casi negra (Char, ver DESIGN-AKER.md § Surfaces — se mantiene
// oscura, NO verde: el color de marca vive en las cards, no en el fondo).
// Izquierda: card fotográfica + card verde "Activos" + card acento con
// iniciales de zona. Derecha: mapa AMBA esquemático apagado. Zonas derivadas
// de projectRepo.list() (DESIGN.md § Datos) — sin fixtures directo.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { projectRepo, type Project } from '../../../data';
import { Skeleton, useMinVisible } from '../../ui/Skeleton';
import { gsapReveal } from '../../../lib/gsapReveal';
import { AkerContainer, AkerOverline } from './AkerPrimitives';

type ZoneStatus = 'activos' | 'evaluacion';
interface Zone {
  name: string;
  status: ZoneStatus;
  x: number;
  y: number;
}

// Alias geográfico: Palermo es CABA; Olivos se agrupa en el corredor Vicente
// López — mismos 6 puntos que nombra el brief de reconstrucción.
const ZONE_ALIAS: Record<string, string> = {
  Palermo: 'CABA',
  Olivos: 'Vicente López',
};

// Posiciones esquemáticas (no cartográficas) sobre un viewBox 400x420 —
// AMBA/Río de la Plata en abstracto, "el outline es suficiente" per brief.
const ZONE_POSITIONS: Record<string, { x: number; y: number }> = {
  CABA: { x: 262, y: 246 },
  'Vicente López': { x: 276, y: 196 },
  Tigre: { x: 264, y: 108 },
  Nordelta: { x: 292, y: 122 },
  Pilar: { x: 150, y: 150 },
  'La Plata': { x: 320, y: 356 },
};

const MOCK_ZONES = ['Nordelta', 'La Plata'];

/** Iniciales grandes para las accent cards de zona (card "big-initials"). */
const zoneInitials = (name: string) => {
  const words = name.split(/\s+/);
  if (words.length > 1) return words.map((w) => w[0]).join('').toUpperCase();
  return name.length <= 4 ? name.toUpperCase() : name.slice(0, 2).toUpperCase();
};

/** Superficies rotativas de las accent cards — solo tonos de marca + darks
 * del sistema (sin terracota, ver mapeo DESIGN-AKER.md). */
const ACCENT_SURFACES = [
  'bg-brand-300 text-brand-900',
  'bg-aker-iron text-aker-paper',
  'bg-brand-700 text-aker-paper',
  'bg-aker-slate text-aker-paper',
  'bg-aker-midnight text-aker-paper',
];

function deriveZones(projects: Project[]): Zone[] {
  // Una zona es "activos" si tiene al menos un proyecto en obra o terminado;
  // si todos sus proyectos están en pozo, queda "en evaluación".
  const byName = new Map<string, boolean>();

  for (const p of projects) {
    const raw = p.location.split(',')[0]?.trim() ?? p.location;
    const name = ZONE_ALIAS[raw] ?? raw;
    const isActive = p.status === 'en-obra' || p.status === 'terminado';
    byName.set(name, (byName.get(name) ?? false) || isActive);
  }

  for (const name of MOCK_ZONES) {
    if (!byName.has(name)) byName.set(name, false);
  }

  return Array.from(byName.entries())
    .filter(([name]) => ZONE_POSITIONS[name])
    .map(([name, isActive]) => ({
      name,
      status: (isActive ? 'activos' : 'evaluacion') as ZoneStatus,
      ...ZONE_POSITIONS[name],
    }));
}

function DondeSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="aspect-square rounded-aker-card bg-white/5" />
        <Skeleton className="aspect-square rounded-aker-card bg-white/5" />
        <Skeleton className="aspect-square rounded-aker-card bg-white/5" />
      </div>
      <Skeleton className="aspect-[4/3] rounded-aker-card bg-white/5" />
    </div>
  );
}

export default function AkerDondeDesarrollamos() {
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [featured, setFeatured] = useState<Project | null>(null);
  const loading = zones === null;
  const showSkeleton = useMinVisible(loading);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    projectRepo
      .listPublished()
      .then((items) => {
        if (!alive) return;
        setZones(deriveZones(items));
        setFeatured(items.find((p) => p.slug === 'torre-libertador') ?? items[0] ?? null);
      })
      .catch(() => {
        if (alive) setZones([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loading || !ref.current) return;
    return gsapReveal(Array.from(ref.current.children), { stagger: 0.1, y: 20 });
  }, [loading]);

  return (
    <section className="bg-aker-char py-20">
      <AkerContainer>
        <div className="mb-8 flex items-center gap-5 md:mb-10">
          <span className="flex items-center gap-2 text-[12px] tracking-[0.12px] text-aker-paper/60">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Activos
          </span>
          <span className="flex items-center gap-2 text-[12px] tracking-[0.12px] text-aker-paper/60">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-aker-smoke" />
            En evaluación
          </span>
        </div>

        <h2 className="mb-12 text-[clamp(36px,4.5vw,62px)] leading-[1.1] font-light tracking-[-0.025em] text-aker-paper md:mb-16">
          Dónde desarrollamos
        </h2>

        {showSkeleton ? (
          <DondeSkeleton />
        ) : loading ? null : (
          <div ref={ref} className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
            {/* Banda de zone cards: foto + info verde + accent cards de
                iniciales grandes — carousel horizontal en overflow. */}
            <div className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
              <Link
                to={featured ? `/proyectos/${featured.slug}` : '/proyectos'}
                className="group relative aspect-square w-[200px] shrink-0 snap-start overflow-hidden rounded-aker-card sm:w-[220px]"
              >
                <img
                  src={featured?.coverImage}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="aker-photo absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-[15px] font-normal text-aker-paper">
                  Vicente López
                </span>
              </Link>

              <div className="flex aspect-square w-[200px] shrink-0 snap-start flex-col justify-between rounded-aker-card bg-brand-900 p-4 sm:w-[220px]">
                <AkerOverline dark className="text-brand-300">
                  Activos
                </AkerOverline>
                <p className="text-aker-body text-aker-paper">Punto Cero desarrolla acá.</p>
              </div>

              {/* Vicente López ya está representado por la card fotográfica. */}
              {zones?.filter((z) => z.name !== 'Vicente López').map((zone, i) => (
                <div
                  key={zone.name}
                  className={`flex aspect-square w-[200px] shrink-0 snap-start flex-col justify-between rounded-aker-card p-4 sm:w-[220px] ${
                    ACCENT_SURFACES[i % ACCENT_SURFACES.length]
                  }`}
                >
                  <span className="text-[12px] font-medium tracking-[0.12px] uppercase opacity-70">
                    {zone.status === 'evaluacion' ? 'En evaluación' : 'Activos'}
                  </span>
                  <div>
                    <span className="block text-[clamp(36px,3vw,48px)] leading-none font-light tracking-[-0.025em]">
                      {zoneInitials(zone.name)}
                    </span>
                    <span className="mt-2 block text-[12px] opacity-70">{zone.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mapa AMBA esquemático */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-aker-card border border-white/10 bg-black/40">
              <svg viewBox="0 0 400 420" className="h-full w-full" aria-hidden>
                {/* Costa del Río de la Plata + AMBA, abstracto */}
                <path
                  d="M60 40 C 180 20, 340 60, 330 220 C 322 330, 360 380, 300 410 L 40 410 C 10 320, 20 120, 60 40 Z"
                  fill="none"
                  stroke="#8d8d8d"
                  strokeOpacity="0.35"
                  strokeWidth="1.25"
                />
                <path
                  d="M330 220 C 360 260, 400 300, 400 420 L 300 420 C 320 380, 330 300, 300 260 Z"
                  fill="#38464a"
                  fillOpacity="0.25"
                />
                {zones?.map((z) => (
                  <g key={z.name}>
                    <circle
                      cx={z.x}
                      cy={z.y}
                      r="4.5"
                      fill={z.status === 'activos' ? '#3e7a5a' : '#8d8d8d'}
                    />
                    <circle
                      cx={z.x}
                      cy={z.y}
                      r="9"
                      fill="none"
                      stroke={z.status === 'activos' ? '#3e7a5a' : '#8d8d8d'}
                      strokeOpacity="0.4"
                    />
                    <text
                      x={z.x + 12}
                      y={z.y + 4}
                      fontSize="11"
                      fill="#e5e4e4"
                      fontFamily="Montserrat, sans-serif"
                      fontWeight="400"
                    >
                      {z.name}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}
      </AkerContainer>
    </section>
  );
}
