// Mapa de ubicación del proyecto (PROY-04).
//
// El mapa NO se monta con la página: cierra el detalle, muy por debajo del
// pliegue, y Leaflet pesa ~45 kB gzip más la primera tanda de tiles. Bajarlo
// junto con el hero es gastar ancho de banda en algo que el visitante todavía
// no está mirando —y que muchas visitas no llegan a ver nunca—.
//
// Se difiere en dos capas que resuelven cosas distintas:
//   · `lazy` saca el código de Leaflet del bundle de la página;
//   · `useNearViewport` decide CUÁNDO pedir ese chunk, con un margen generoso
//     para que el mapa ya esté listo cuando la sección entra en pantalla.
//
// El placeholder mide exactamente lo mismo que el mapa: si midiera menos, al
// cargar se correría todo lo que tiene abajo.

import { lazy, Suspense, useEffect, useRef } from 'react';
import { gsapReveal } from '../../../lib/gsapReveal';
import { useNearViewport } from '../../../lib/useNearViewport';
import Container from '../../ui/Container';
import SectionHeading from '../../ui/SectionHeading';
import { Skeleton } from '../../ui/Skeleton';
import type { Coords } from '../../../data';

const MapaUbicacionLeaflet = lazy(() => import('./MapaUbicacionLeaflet'));

const ALTO = 'h-[420px] w-full md:h-[520px]';

interface MapaUbicacionProps {
  name: string;
  location: string;
  coords: Coords;
}

export default function MapaUbicacion({ name, location, coords }: MapaUbicacionProps) {
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const [nearRef, near] = useNearViewport<HTMLDivElement>();

  useEffect(() => {
    return gsapReveal(mapWrapRef.current);
  }, []);

  return (
    <section className="bg-paper py-20 md:py-28 lg:py-32">
      <Container>
        <SectionHeading
          kicker="Ubicación"
          title="Dónde se emplaza"
          intro={location}
          className="mb-12 md:mb-16"
        />
        <div ref={mapWrapRef} className="border border-hairline">
          <div ref={nearRef}>
            {near ? (
              <Suspense fallback={<Skeleton className={ALTO} />}>
                <MapaUbicacionLeaflet name={name} location={location} coords={coords} />
              </Suspense>
            ) : (
              <Skeleton className={ALTO} />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
