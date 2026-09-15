// Selector de ubicación en mapa para el formulario de proyectos (ADMIN-01).
// Reemplaza la carga manual de latitud/longitud: buscador de direcciones
// (Nominatim), click en el mapa y marcador arrastrable, los tres sincronizados
// con los campos lat/lng del formulario.
//
// Sobre la referencia realstack (que hace lo mismo con un <script> de Leaflet
// por CDN y `window.L`), acá se usa react-leaflet desde npm: tipado, versionado
// por el bundler y sin request extra fuera del control de Vite.
//
// El input numérico no desaparece: queda visible en modo lectura como control
// de verdad y como salida para copiar/pegar. Si el mapa o el geocoder fallan,
// se puede desbloquear y tipear a mano — el formulario nunca queda trabado por
// un servicio externo.

import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import BrandTiles from '../../ui/BrandTiles';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin, Pencil, Search } from 'lucide-react';
import { brandMarkerIconDraggable } from '../../../lib/mapIcon';
import { inputCls } from './FormField';

/** Centro por defecto cuando el proyecto todavía no tiene coordenadas: AMBA,
 * la zona de cobertura declarada de la empresa. */
const DEFAULT_CENTER: [number, number] = [-34.5731, -58.4238];
const DEFAULT_ZOOM = 12;
const PICKED_ZOOM = 16;

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

/** Click en el mapa = mover el pin. */
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

/** Recentra el mapa cuando las coordenadas cambian desde afuera (búsqueda o
 * edición manual del input), sin recrear el MapContainer. */
function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [map, lat, lng, zoom]);
  return null;
}

interface MapPickerFieldProps {
  /** Valor crudo del campo lat del formulario (string, admite coma decimal). */
  lat: string;
  lng: string;
  /** Escribe ambos campos en el formulario (setValue con validación). */
  onChange: (lat: string, lng: string) => void;
  /** Mensajes de error de los campos lat/lng, ya validados por zod. */
  latError?: string;
  lngError?: string;
  /** Se usa como consulta inicial sugerida del buscador. */
  locationHint?: string;
}

const parse = (v: string): number | null => {
  const n = Number(v.replace(',', '.'));
  return v.trim() !== '' && Number.isFinite(n) ? n : null;
};

export default function MapPickerField({
  lat,
  lng,
  onChange,
  latError,
  lngError,
  locationHint = '',
}: MapPickerFieldProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const markerRef = useRef<LeafletMarker | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const latNum = parse(lat);
  const lngNum = parse(lng);
  const hasCoords = latNum !== null && lngNum !== null;
  const center: [number, number] = hasCoords ? [latNum, lngNum] : DEFAULT_CENTER;

  // 6 decimales ≈ 11 cm: más precisión que eso es ruido para ubicar una obra,
  // y evita que el input muestre 15 dígitos después de arrastrar el pin.
  const pick = (nextLat: number, nextLng: number) => {
    onChange(nextLat.toFixed(6), nextLng.toFixed(6));
  };

  const search = async () => {
    const q = (query || locationHint).trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', q);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '5');
      // Sesgo a Argentina: el negocio es local y evita traer homónimos de otro continente.
      url.searchParams.set('countrycodes', 'ar');
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as NominatimResult[];
      setResults(data);
      if (data.length === 0) setSearchError('Sin resultados. Probá con otra dirección o marcá el punto en el mapa.');
    } catch {
      setSearchError('No se pudo buscar la dirección. Marcá el punto en el mapa o cargá las coordenadas a mano.');
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Buscador de direcciones */}
      <div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // El picker vive dentro del <form> del proyecto: sin esto,
                  // Enter en el buscador enviaría el formulario entero.
                  e.preventDefault();
                  void search();
                }
              }}
              placeholder={locationHint || 'Buscar dirección (ej: Av. del Libertador 5252)'}
              aria-label="Buscar dirección"
              className={`${inputCls(false)} pl-9`}
            />
          </div>
          <button
            type="button"
            onClick={() => void search()}
            disabled={searching}
            className="inline-flex shrink-0 items-center gap-2 border border-ink px-4 py-2 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            Buscar
          </button>
        </div>

        {searchError && (
          <p role="status" className="mt-2 text-xs font-light text-ink-soft">
            {searchError}
          </p>
        )}

        {results && results.length > 0 && (
          <ul className="mt-2 divide-y divide-line border border-line">
            {results.map((r) => (
              <li key={`${r.lat}-${r.lon}`}>
                <button
                  type="button"
                  onClick={() => {
                    pick(Number(r.lat), Number(r.lon));
                    setResults(null);
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs font-light text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden />
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mapa */}
      <div className="border border-line">
        <MapContainer
          attributionControl={false}
          center={center}
          zoom={hasCoords ? PICKED_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom={false}
          className="z-0 h-[320px] w-full"
          ref={mapRef}
        >
          <BrandTiles />
          <ClickHandler onPick={pick} />
          {hasCoords && (
            <>
              <Recenter lat={latNum} lng={lngNum} zoom={PICKED_ZOOM} />
              <Marker
                position={[latNum, lngNum]}
                icon={brandMarkerIconDraggable}
                draggable
                ref={markerRef}
                eventHandlers={{
                  dragend: () => {
                    const pos = markerRef.current?.getLatLng();
                    if (pos) pick(pos.lat, pos.lng);
                  },
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      <p className="text-xs font-light text-ink-soft/70">
        {hasCoords
          ? 'Hacé click en el mapa o arrastrá el pin para ajustar la ubicación exacta.'
          : 'Buscá la dirección o hacé click en el mapa para marcar la ubicación del proyecto.'}
      </p>

      {/* Coordenadas — lectura por defecto, editables a mano si hace falta */}
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-[11px] font-light uppercase tracking-widest text-ink-soft/70">
            Latitud
          </span>
          <input
            inputMode="decimal"
            readOnly={!manual}
            value={lat}
            onChange={(e) => onChange(e.target.value, lng)}
            placeholder="-34.5731"
            className={`${inputCls(!!latError)} ${manual ? '' : 'bg-paper-soft text-ink-soft'}`}
          />
          {latError && (
            <p role="alert" className="mt-1 text-xs font-light text-red-600 dark:text-red-400">
              {latError}
            </p>
          )}
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-light uppercase tracking-widest text-ink-soft/70">
            Longitud
          </span>
          <input
            inputMode="decimal"
            readOnly={!manual}
            value={lng}
            onChange={(e) => onChange(lat, e.target.value)}
            placeholder="-58.4238"
            className={`${inputCls(!!lngError)} ${manual ? '' : 'bg-paper-soft text-ink-soft'}`}
          />
          {lngError && (
            <p role="alert" className="mt-1 text-xs font-light text-red-600 dark:text-red-400">
              {lngError}
            </p>
          )}
        </label>
        <button
          type="button"
          onClick={() => setManual((v) => !v)}
          className="inline-flex items-center gap-1.5 pb-2.5 text-xs font-medium uppercase tracking-widest text-brand-500 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          {manual ? 'Bloquear' : 'Editar a mano'}
        </button>
      </div>
    </div>
  );
}
