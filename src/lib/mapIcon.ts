// Marcador propio de marca para todos los mapas Leaflet del sitio (ubicación de
// proyecto, oficinas, picker del admin). Evita los assets PNG default de
// Leaflet — que además se rompen al pasar por el bundler — y mantiene un único
// pin verde Punto Cero en vez de tres definiciones divergentes.

import { divIcon } from 'leaflet';

export const brandMarkerIcon = divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:var(--brand-accent,#3e7a5a);border:3px solid #fff;box-shadow:0 0 0 2px var(--brand-700,#1f4a35), 0 2px 8px rgba(0,0,0,.4)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Variante arrastrable del picker del admin: mismo pin, con sombra más marcada. */
export const brandMarkerIconDraggable = divIcon({
  className: 'cursor-grab active:cursor-grabbing',
  html: `<div style="width:22px;height:22px;border-radius:9999px;background:var(--brand-accent,#3e7a5a);border:3px solid #fff;box-shadow:0 0 0 2px var(--brand-700,#1f4a35), 0 4px 14px rgba(0,0,0,.55)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/** Marcador del proyecto seleccionado en el mapa del listado: más grande y con
 * halo, para que se distinga de un vistazo entre el resto de los pines. */
export const brandMarkerIconActive = divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:9999px;background:var(--brand-accent,#3e7a5a);border:4px solid #fff;box-shadow:0 0 0 3px var(--brand-700,#1f4a35), 0 0 0 9px color-mix(in srgb, var(--brand-accent,#3e7a5a) 30%, transparent), 0 4px 16px rgba(0,0,0,.5)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});
