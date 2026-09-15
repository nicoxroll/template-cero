// La parte del mapa de ubicación que arrastra Leaflet (PROY-04).
//
// Vive en su propio archivo para que sea un chunk aparte: así el import de
// `leaflet` y su CSS no entran en el bundle de la página de detalle, que se
// abre siempre, mientras que el mapa está al final y muchas visitas no llegan.
// Lo monta MapaUbicacion.tsx recién cuando la sección se acerca a pantalla.

import { MapContainer, Marker, Popup } from 'react-leaflet';
import BrandTiles from '../../ui/BrandTiles';
import 'leaflet/dist/leaflet.css';
import { brandMarkerIcon } from '../../../lib/mapIcon';
import type { Coords } from '../../../data';

interface Props {
  name: string;
  location: string;
  coords: Coords;
}

export default function MapaUbicacionLeaflet({ name, location, coords }: Props) {
  return (
    <MapContainer
      attributionControl={false}
      center={[coords.lat, coords.lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="z-0 h-[420px] w-full md:h-[520px]"
    >
      <BrandTiles />
      <Marker position={[coords.lat, coords.lng]} icon={brandMarkerIcon}>
        <Popup>
          <span className="font-medium">{name}</span>
          <br />
          {location}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
