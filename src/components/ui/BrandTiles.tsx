// Capa de tiles + atribución, compartida por los mapas del sitio
// (proyectos, oficina, detalle de proyecto y el picker del panel).
//
// El mapa sigue el tema del sitio (dark mode reactivo con useSyncExternalStore).
// Sin API key: ESRI Canvas (World_Light_Gray_Base y World_Dark_Gray_Base), que no
// requieren clave, no muestran marcas de agua ("API KEY REQUIRED") y se tiñen
// con el filtro de marca de index.css.
// Con VITE_CARTO_API_KEY en .env: CARTO voyager y dark_all con ?key=...

import { useSyncExternalStore } from 'react';
import { AttributionControl, TileLayer } from 'react-leaflet';
import { subscribeToTheme, getThemeSnapshot } from '../../lib/theme';

const ESRI_LIGHT =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const ESRI_DARK =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

const ESRI_ATTRIBUTION =
  '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';

export default function BrandTiles() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => 'light');
  const cartoKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_CARTO_API_KEY;

  let tileUrl: string;
  let attribution: string;

  if (cartoKey) {
    tileUrl =
      theme === 'dark'
        ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`
        : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`;
    attribution = CARTO_ATTRIBUTION;
  } else {
    tileUrl = theme === 'dark' ? ESRI_DARK : ESRI_LIGHT;
    attribution = ESRI_ATTRIBUTION;
  }

  return (
    <>
      <TileLayer key={`${theme}-${cartoKey ? 'carto' : 'esri'}`} attribution={attribution} url={tileUrl} maxZoom={16} />
      <AttributionControl position="bottomright" prefix={false} />
    </>
  );
}

