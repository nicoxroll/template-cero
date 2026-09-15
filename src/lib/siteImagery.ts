// Fotografía DECORATIVA del sitio: fondos de sección, footer, newsletter.
//
// Vive en lib/ y no en fixtures porque no es dato de dominio: no se edita desde
// el panel ni viaja por los repositorios. Un proyecto tiene una portada que la
// empresa carga; el fondo del footer es una decisión de diseño del sitio.
//
// Son assets de DEMOSTRACIÓN servidos desde un host externo, igual que las
// fotos de los fixtures. Al reemplazarlos por fotografía propia de obra,
// cambian solo estas constantes.

// 1600w por defecto, no 3840w. Todas estas fotos son FONDO bajo un velo oscuro:
// nadie las mira de cerca, pero la variante grande pesa entre 2x y 3x. Con
// 3840w el footer solo bajaba 787 kB, y sumando servicios, newsletter y
// contacto la portada arrastraba ~2,2 MB de imagen decorativa.
const asset = (id: string, w: 1600 | 3840 = 1600) =>
  `https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/${id}_${w}w.webp`;

export const IMAGERY = {
  /** Fondo del footer revelado por scroll. */
  footer: asset('1c6b6980-54e4-4d8c-9ff6-e09b844d7b01'),
  /** Fondo de la franja de newsletter. */
  newsletter: asset('aa5ed4de-1a7e-4bb7-b0ea-1a4c511663df', 1600),
  /** Fondo del bloque de contacto. */
  contacto: asset('952269bf-60f5-48dc-afce-13953bead1eb', 1600),
  /** Foto de apoyo de la página de contacto. */
  oficinas: asset('0dccab47-16b0-4716-9e1a-b97f124e3031', 1600),
  /** Foto ancha de respaldo (hero de secciones sin dato propio). */
  wide: asset('482e7b6a-168c-4d0d-b35d-0e2ff4014577'),
} as const;
