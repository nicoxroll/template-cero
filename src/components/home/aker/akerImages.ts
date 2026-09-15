// Fotografía curada del skin Aker (modo Galería) — DESIGN-AKER.md § Imagery:
// "paisaje/cityscape mudo, ligeramente desaturado". Arquitectura moderna y
// aerial landscapes exclusivamente, sin interiores ni casas suburbanas.
// Todas verificadas 200 (curl) contra el CDN de Pexels — mismo patrón que
// src/data/fixtures.ts, pero este módulo es exclusivo del skin Aker (no pasa
// por la capa de repositorios: es tratamiento visual, no dato de negocio).
// Las fotos de proyectos reales (banda "Dónde desarrollamos") SÍ vienen de
// projectRepo — ver AkerDondeDesarrollamos.tsx.

const px = (id: number, w = 1920) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&fm=webp`;

/** Hero full-bleed: arquitectura monumental en penumbra — muted, casi
 * monocromo y OSCURA abajo: el wordmark Paper se apoya en la oscuridad
 * propia de la foto, sin overlay (DESIGN-AKER.md § Full-Bleed Hero).
 * Elegida visualmente contra el render real (antes 1546165: suburbio
 * otoñal brillante — violaba § Imagery y ahogaba el wordmark). */
export const AKER_HERO_PHOTO = px(20856160, 1600);

/** Banda fotográfica full-bleed #1 (ritmo de sección, tras el statement). */
export const AKER_PHOTO_BAND_1 = px(11861957, 1600);

/** Banda fotográfica full-bleed #2 — "brand assets": planos y documentación
 * de obra, equivalente al stationery/floorplans que usa Aker en su banda. */
export const AKER_BRAND_ASSETS_BAND = px(5584052, 1600);

/** Foto de cierre — card derecha "Abiertos a colaborar": aerial city
 * desaturada (antes 302769: skyline dorado al atardecer — demasiado cálido
 * para el tratamiento cool/desaturado de § Imagery). */
export const AKER_CLOSING_PHOTO = px(32750263, 1600);

/** Thumbnail del card oscuro del hero bento ("Arquitectura y diseño") — mismo
 * tower shot verde/vidrio usado como portada de Torre Libertador. */
export const AKER_HERO_CARD_THUMB = px(35282689, 800);

/** Foto de la card "La historia de Punto Cero" del hero bento (→ /#quienes-somos)
 * — portada del proyecto insignia terminado (Edificio Álamos). */
export const AKER_HISTORIA_PHOTO = px(13197873, 1200);

/** Thumbnails 4:3 del menú de la navigation pill (6 destinos, 2 por fila). */
export const AKER_NAV_THUMBS = {
  proyectos: px(35282689, 800),
  inversiones: px(37320179, 800),
  contacto: px(27322345, 800),
  // Retrato real del equipo (TEAM_FIXTURE) — "Quiénes somos" con una cara,
  // no otro edificio.
  quienesSomos: px(37605831, 800),
  // Equipo en mesa de trabajo (verificada 200 contra el CDN, igual que el resto).
  equipo: px(6285147, 800),
  historia: px(13197873, 800),
} as const;
