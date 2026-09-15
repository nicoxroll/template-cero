// Mapa de la oficina (CONT-03) — la referencia realstack acompaña los datos de
// contacto con un mapa embebido; acá se resuelve con el mismo react-leaflet ya
// integrado para la ubicación de proyectos, sin iframe de Google ni CDN.

import { MapContainer, Marker, Popup } from 'react-leaflet';
import BrandTiles from '../ui/BrandTiles';
import 'leaflet/dist/leaflet.css';
import { brandMarkerIcon } from '../../lib/mapIcon';
import type { Coords } from '../../data';

interface OficinaMapaProps {
  coords: Coords;
  address: string;
  legalName: string;
  /** Alto del mapa; la home usa uno más bajo que la página de Contacto. */
  className?: string;
}

export default function OficinaMapa({
  coords,
  address,
  legalName,
  className = 'h-[320px]',
}: OficinaMapaProps) {
  return (
    <div className="border border-hairline">
      <MapContainer
        attributionControl={false}
        center={[coords.lat, coords.lng]}
        zoom={15}
        scrollWheelZoom={false}
        className={`z-0 w-full ${className}`}
      >
        <BrandTiles />
        <Marker position={[coords.lat, coords.lng]} icon={brandMarkerIcon}>
          <Popup>
            <span className="font-medium">{legalName}</span>
            <br />
            {address}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
