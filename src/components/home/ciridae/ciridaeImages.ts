// Fotografía atmosférica curada del skin Ciridae (modo NORMAL) —
// DESIGN-CIRIDAE.md § Imagery: "hormigón, vidrio, planos, texturas de obra y
// vistas urbanas nocturnas — desenfocadas y oscuras". Mismo patrón que
// src/components/home/aker/akerImages.ts: tratamiento visual, no dato de
// negocio, por eso vive fuera de la capa de repositorios. IDs reutilizados de
// src/data/fixtures.ts y akerImages.ts — ya verificados 200 contra el CDN de
// Pexels, sin introducir assets externos nuevos sin verificar.

const px = (id: number, w = 1920) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&fm=webp`;

/** Hero full-viewport: hormigón/obra en penumbra (portada real de Torre
 * Libertador — "Estructura de hormigón visto"), muy desenfocada por CSS. */
export const CIR_HERO_PHOTO = px(35282689, 1920);

/** Set de 8 fotos atmosféricas, una por card de la grilla de servicios —
 * cada card se pareja con una escena distinta como identificador visual
 * abstracto (obra, infraestructura, planos, fachadas, skyline). */
export const CIR_SERVICE_PHOTOS: readonly string[] = [
  px(35282689, 1200), // hormigón / obra en altura
  px(2804929, 1200), // nave industrial / infraestructura
  px(5584052, 1200), // planos y documentación de obra
  px(11861957, 1200), // arquitectura, líneas puras
  px(32750263, 1200), // aerial city desaturada
  px(37320179, 1200), // torre vidriada
  px(20856160, 1200), // arquitectura monumental en penumbra
  px(13197873, 1200), // fachada terminada
];
