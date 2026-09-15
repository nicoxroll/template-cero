// Capa de tiles + atribución, compartida por los cuatro mapas del sitio
// (proyectos, oficina, detalle de proyecto y el picker del panel).
//
// El mapa sigue el tema del sitio (dark mode reactivo con useSyncExternalStore).
// CARTO dark_all en oscuro y CARTO voyager en claro.

import { useSyncExternalStore } from 'react';
import { AttributionControl, TileLayer } from 'react-leaflet';
import { subscribeToTheme, getThemeSnapshot } from '../../lib/theme';

const VOYAGER_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export default function BrandTiles() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => 'light');
  const tileUrl = theme === 'dark' ? DARK_TILES : VOYAGER_TILES;

  return (
    <>
      <TileLayer key={theme} attribution={ATRIBUCION} url={tileUrl} />
      <AttributionControl position="bottomright" prefix={false} />
    </>
  );
}
