// UX-01: skeleton shape-matched del listado — barra de filtros + fila de vista
// + grilla de cards. Replica la geometría exacta de ProjectFilters, la toolbar
// de Proyectos.tsx y ProjectGrid (cero CLS).

import { Skeleton, SkeletonCard } from '../ui/Skeleton';

export default function ProjectListSkeleton() {
  return (
    <div aria-hidden>
      {/* Barra de filtros. El contenedor real NO tiene padding propio: el aire
          lo ponen la fila-cabecera (py-5) y el panel (pb-8). Reservar solo el
          panel dejaba el listado saltando ~150 px al llegar los datos. */}
      <div className="border-y border-hairline">
        {/* Fila-cabecera: botón "Filtros" + "Limpiar filtros" */}
        <div className="flex items-center justify-between py-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        {/* Panel abierto: 3 grupos de label + pills */}
        <div className="grid gap-8 pb-8 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-3 h-4 w-20" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-[34px] w-20" />
                <Skeleton className="h-[34px] w-24" />
                <Skeleton className="h-[34px] w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fila de conteo + conmutador Grilla/Mapa */}
      <div className="mt-8 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-[38px] w-48" />
      </div>

      {/* Grilla de cards 4:3 */}
      <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
