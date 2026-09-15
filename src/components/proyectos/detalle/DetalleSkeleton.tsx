// Skeleton shape-matched del detalle de proyecto (UX-01): replica hero
// fullscreen, franja de specs, descripción y grilla de galería — cero CLS.

import Container from '../../ui/Container';
import { Skeleton, SkeletonText } from '../../ui/Skeleton';

export default function DetalleSkeleton() {
  return (
    <div aria-hidden>
      {/* Hero fullscreen — oscuro FIJO, como el hero real que va a reemplazarlo
          (DetalleHero usa bg-ink-fixed sobre la foto del proyecto). Con
          bg-paper-soft esto era una pantalla blanca a sangre que daba paso a
          un hero casi negro: un fogonazo en cada apertura de proyecto. */}
      <div className="relative flex h-screen items-center justify-center bg-ink-fixed">
        <div className="flex w-full max-w-2xl flex-col items-center px-4">
          <div className="h-4 w-48 rounded-sm bg-white/10" />
          <div className="mt-6 h-14 w-4/5 rounded-sm bg-white/10 md:h-16" />
          <div className="mt-6 h-4 w-56 rounded-sm bg-white/10" />
        </div>
      </div>

      {/* Specs strip */}
      <div className="border-b border-hairline">
        <Container>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-3 md:py-16 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-7 w-32" />
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Descripción */}
      <Container>
        <div className="max-w-3xl py-20 md:py-28 lg:py-32">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-10 w-3/4" />
          <SkeletonText lines={4} className="mt-12" />
        </div>
      </Container>

      {/* Galería */}
      <Container>
        <div className="grid grid-cols-2 gap-6 pb-20 md:grid-cols-4 md:gap-8 md:pb-28">
          <Skeleton className="col-span-2 row-span-2 aspect-[4/3] h-full w-full" />
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="aspect-[4/3]" />
        </div>
      </Container>
    </div>
  );
}
