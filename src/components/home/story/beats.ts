// Beats narrativos del relato de la home (HERO-02).
// Una sola fuente de copy: los consumen tanto los overlays del modo scrub
// (ScrubStage) como el hero de imagen fija (StaticHero, que usa solo el
// primer beat) — HERO-05.

export interface StoryCta {
  label: string;
  to: string;
}

export interface StoryBeat {
  id: 'inicio' | 'quienes-somos' | 'servicios';
  kicker: string;
  /** Título display; '\n' marca salto de línea */
  title: string;
  line: string;
  /** Par de CTAs de conversión — solo el beat 'inicio' (HERO-01 blocker). */
  ctas?: { primary: StoryCta; secondary: StoryCta };
  /** Link contextual discreto — beats 'quienes-somos' y 'servicios'. */
  contextualLink?: StoryCta;
}

export const STORY_BEATS: StoryBeat[] = [
  {
    id: 'inicio',
    // El hero abre con la MARCA, no con una frase: es lo primero que ve una
    // visita nueva y el nombre tiene que quedar, no un eslogan. El kicker dice
    // solo "Desarrollos" para no repetir lo que el título ya grita.
    kicker: 'Desarrollos',
    title: 'Punto Cero',
    line: 'Arquitectura, construcción, financiamiento e inversiones: soluciones integrales para transformar ideas en proyectos de valor.',
    ctas: {
      primary: { label: 'Ver proyectos', to: '/proyectos' },
      secondary: { label: 'Contactanos', to: '/contacto' },
    },
  },
  {
    id: 'quienes-somos',
    kicker: 'Quiénes somos',
    title: 'Un equipo,\ntodas las etapas',
    line: 'Planificación, diseño, construcción y financiamiento bajo una misma dirección profesional.',
    contextualLink: { label: 'Conocé al equipo →', to: '/#quienes-somos' },
  },
  {
    id: 'servicios',
    kicker: 'Servicios',
    title: 'Del terreno\na la entrega',
    line: 'Ocho servicios que cubren el ciclo completo del desarrollo inmobiliario.',
    contextualLink: { label: 'Ver servicios →', to: '/#servicios' },
  },
];
