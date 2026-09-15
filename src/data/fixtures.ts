// Fixtures mock — SOLO los repositorios importan este archivo.
// Los componentes NUNCA acceden a fixtures directamente (ver README.md).

import type {
  FaqItem,
  Investment,
  PageConfig,
  Project,
  Service,
  TeamMember,
} from './types';

const px = (id: number, w = 1600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&fm=webp`;

// Fotografía de los servicios. Igual que el resto de los fixtures, es contenido
// de DEMOSTRACIÓN servido desde un host externo: al cargar las fotos reales de
// obra desde el panel, estas URLs se reemplazan y el host deja de importar.
// Siempre 1600w. La variante 3840w existe pero pesa entre 2x y 3x —hasta 749 kB
// una sola foto— y ninguna de estas imágenes se muestra a más de ~700 px de
// ancho real: son fondos de tarjeta bajo un velo oscuro. La tarjeta de
// "desarrollo" pedía la de 3840 y era, ella sola, el archivo más pesado de la
// portada.
const asset = (id: string, w: 1600 | 3840 = 1600) =>
  `https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/${id}_${w}w.webp`;

const ASSET = {
  desarrollo: asset('482e7b6a-168c-4d0d-b35d-0e2ff4014577'),
  arquitectura: asset('0dccab47-16b0-4716-9e1a-b97f124e3031'),
  construccion: asset('952269bf-60f5-48dc-afce-13953bead1eb'),
  inversiones: asset('aa5ed4de-1a7e-4bb7-b0ea-1a4c511663df'),
} as const;

export const PROJECTS_FIXTURE: Project[] = [
  {
    slug: 'torre-libertador',
    name: 'Torre Libertador',
    description:
      'Torre residencial de 22 pisos sobre Av. del Libertador, con unidades de 2 a 4 ambientes, amenities completos y vistas abiertas al río. Estructura de hormigón visto y carpinterías de doble vidriado hermético.',
    location: 'Vicente López, Buenos Aires',
    type: 'residencial',
    status: 'en-obra',
    timeline: [
      { stage: 'planificacion', current: false, startedAt: '2023-03-01', completedAt: '2023-09-15' },
      { stage: 'diseno', current: false, startedAt: '2023-09-15', completedAt: '2024-04-30' },
      { stage: 'construccion', current: true, startedAt: '2024-05-02', notes: 'Avance de obra 62% — hormigón completo hasta piso 18' },
      { stage: 'entrega', current: false },
    ],
    coverImage: px(35282689, 1600),
    gallery: [px(35282689, 1200), px(30832160, 1200), px(11968124, 1200), px(38525110, 1200)],
    specs: [
      { label: 'Superficie total', value: '18.400 m²' },
      { label: 'Unidades', value: '96' },
      { label: 'Pisos', value: '22' },
      { label: 'Cocheras', value: '110' },
      { label: 'Amenities', value: 'Piscina, gym, SUM, coworking' },
    ],
    docs: [
      { name: 'Brochure comercial (PDF)', url: '/docs/torre-libertador-brochure.pdf', sizeLabel: '2,4 MB', kind: 'brochure' },
      { name: 'Planos de tipologías (PDF)', url: '/docs/torre-libertador-planos.pdf', sizeLabel: '3,1 MB', kind: 'planos' },
    ],
    coords: { lat: -34.5265, lng: -58.4765 },
    featured: true,
    isRender: false,
    published: true,
    createdAt: '2024-05-02T12:00:00.000Z',
  },
  {
    slug: 'edificio-alamos',
    name: 'Edificio Álamos',
    description:
      'Edificio boutique de 8 niveles en el corazón de Palermo Botánico. Unidades premium con balcones aterrazados, parrilla propia y planta baja comercial. Fachada de líneas puras con parasoles de aluminio anodizado.',
    location: 'Palermo, CABA',
    type: 'residencial',
    status: 'terminado',
    timeline: [
      { stage: 'planificacion', current: false, startedAt: '2020-02-01', completedAt: '2020-08-01' },
      { stage: 'diseno', current: false, startedAt: '2020-08-01', completedAt: '2021-03-01' },
      { stage: 'construccion', current: false, startedAt: '2021-03-15', completedAt: '2023-06-30' },
      { stage: 'entrega', current: true, startedAt: '2023-07-01', completedAt: '2023-11-30', notes: 'Entregado — posesión completa' },
    ],
    coverImage: px(13197873, 1600),
    gallery: [px(13197873, 1200), px(2674418, 1200), px(21418646, 1200), px(6436782, 1200)],
    specs: [
      { label: 'Superficie total', value: '4.850 m²' },
      { label: 'Unidades', value: '28' },
      { label: 'Pisos', value: '8' },
      { label: 'Locales comerciales', value: '2' },
    ],
    docs: [{ name: 'Brochure comercial (PDF)', url: '/docs/edificio-alamos-brochure.pdf', sizeLabel: '1,8 MB', kind: 'brochure' }],
    coords: { lat: -34.5828, lng: -58.4177 },
    featured: true,
    isRender: false,
    published: true,
    createdAt: '2023-11-30T12:00:00.000Z',
  },
  {
    slug: 'costa-tigre',
    name: 'Complejo Costa Tigre',
    description:
      'Masterplan de usos mixtos frente al río Luján: tres torres residenciales, paseo comercial a cielo abierto y marina privada. Concepto en desarrollo — imágenes correspondientes a renders del anteproyecto.',
    location: 'Tigre, Buenos Aires',
    type: 'mixto',
    status: 'en-pozo',
    timeline: [
      { stage: 'planificacion', current: false, startedAt: '2025-04-01', completedAt: '2025-12-15' },
      { stage: 'diseno', current: true, startedAt: '2026-01-10', notes: 'Anteproyecto aprobado — desarrollo de documentación ejecutiva' },
      { stage: 'construccion', current: false },
      { stage: 'entrega', current: false },
    ],
    coverImage: px(29791458, 1600),
    gallery: [px(29791458, 1200), px(28494626, 1200), px(38289824, 1200), px(34360423, 1200)],
    specs: [
      { label: 'Superficie del predio', value: '4,2 ha' },
      { label: 'Superficie construible', value: '52.000 m²' },
      { label: 'Torres', value: '3 (18 pisos c/u)' },
      { label: 'Amarras', value: '40' },
    ],
    docs: [{ name: 'Masterplan conceptual (PDF)', url: '/docs/costa-tigre-planos.pdf', sizeLabel: '4,6 MB', kind: 'planos' }],
    coords: { lat: -34.4241, lng: -58.5796 },
    featured: true,
    isRender: true,
    published: true,
    createdAt: '2026-01-10T12:00:00.000Z',
  },
  {
    slug: 'oficinas-distrito-norte',
    name: 'Oficinas Distrito Norte',
    description:
      'Edificio corporativo AAA de plantas libres de 850 m², certificación LEED Silver, doble altura en acceso y 4 subsuelos de cocheras. Fachada vidriada de alta eficiencia energética.',
    location: 'Olivos, Buenos Aires',
    type: 'comercial',
    status: 'terminado',
    timeline: [
      { stage: 'planificacion', current: false, startedAt: '2019-05-01', completedAt: '2019-11-01' },
      { stage: 'diseno', current: false, startedAt: '2019-11-01', completedAt: '2020-06-01' },
      { stage: 'construccion', current: false, startedAt: '2020-07-01', completedAt: '2022-09-30' },
      { stage: 'entrega', current: true, startedAt: '2022-10-01', completedAt: '2022-12-20', notes: 'Entregado — 100% alquilado' },
    ],
    coverImage: px(37320179, 1600),
    gallery: [px(37320179, 1200), px(5230087, 1200), px(946310, 1200), px(27322345, 1200)],
    specs: [
      { label: 'Superficie total', value: '12.600 m²' },
      { label: 'Plantas', value: '10 libres de 850 m²' },
      { label: 'Certificación', value: 'LEED Silver' },
      { label: 'Cocheras', value: '180' },
    ],
    docs: [{ name: 'Ficha técnica (PDF)', url: '/docs/oficinas-distrito-norte-otro.pdf', sizeLabel: '1,1 MB', kind: 'otro' }],
    coords: { lat: -34.5089, lng: -58.4863 },
    featured: true,
    isRender: false,
    published: true,
    createdAt: '2022-12-20T12:00:00.000Z',
  },
  {
    slug: 'barrio-los-nogales',
    name: 'Barrio Los Nogales',
    description:
      'Urbanización privada de 120 lotes con club house, canchas y 3 ha de espacios verdes parquizados. Infraestructura subterránea completa. Imágenes correspondientes a renders del proyecto.',
    location: 'Pilar, Buenos Aires',
    type: 'residencial',
    status: 'en-pozo',
    timeline: [
      { stage: 'planificacion', current: true, startedAt: '2026-02-01', notes: 'Factibilidades municipales en trámite' },
      { stage: 'diseno', current: false },
      { stage: 'construccion', current: false },
      { stage: 'entrega', current: false },
    ],
    coverImage: px(31640055, 1600),
    gallery: [px(31640055, 1200), px(31640048, 1200), px(32220111, 1200), px(33515015, 1200)],
    specs: [
      { label: 'Superficie del predio', value: '18 ha' },
      { label: 'Lotes', value: '120 (600–900 m²)' },
      { label: 'Espacios verdes', value: '3 ha' },
      { label: 'Club house', value: '1.200 m²' },
    ],
    docs: [{ name: 'Masterplan (PDF)', url: '/docs/barrio-los-nogales-planos.pdf', sizeLabel: '3,8 MB', kind: 'planos' }],
    coords: { lat: -34.4587, lng: -58.9142 },
    featured: false,
    isRender: true,
    published: true,
    createdAt: '2026-02-01T12:00:00.000Z',
  },
  {
    slug: 'centro-logistico-ruta-8',
    name: 'Centro Logístico Ruta 8',
    description:
      'Parque logístico de 3 naves AAA con altura libre de 12 m, pisos superplanos, 40 docks y playa de maniobras de hormigón. Obra de infraestructura vial de acceso incluida en el desarrollo.',
    location: 'Pilar, Buenos Aires',
    type: 'infraestructura',
    status: 'en-obra',
    timeline: [
      { stage: 'planificacion', current: false, startedAt: '2024-08-01', completedAt: '2025-01-31' },
      { stage: 'diseno', current: false, startedAt: '2025-02-01', completedAt: '2025-07-15' },
      { stage: 'construccion', current: true, startedAt: '2025-08-01', notes: 'Nave 1 completa, nave 2 en montaje de estructura' },
      { stage: 'entrega', current: false },
    ],
    coverImage: px(2804929, 1600),
    gallery: [px(2804929, 1200), px(35501715, 1200), px(18078304, 1200), px(33804931, 1200)],
    specs: [
      { label: 'Superficie cubierta', value: '36.000 m²' },
      { label: 'Naves', value: '3' },
      { label: 'Altura libre', value: '12 m' },
      { label: 'Docks', value: '40' },
    ],
    docs: [{ name: 'Ficha técnica (PDF)', url: '/docs/centro-logistico-ruta-8-otro.pdf', sizeLabel: '1,4 MB', kind: 'otro' }],
    coords: { lat: -34.4374, lng: -58.9718 },
    featured: false,
    isRender: false,
    published: true,
    createdAt: '2025-08-01T12:00:00.000Z',
  },
];

export const INVESTMENTS_FIXTURE: Investment[] = [
  {
    slug: 'fideicomiso-torre-libertador',
    title: 'Fideicomiso Torre Libertador',
    description:
      'Participación en fideicomiso al costo sobre unidades de 2 y 3 ambientes en Torre Libertador. Obra en ejecución con avance verificable mensualmente. Salida por venta de unidad terminada o cesión de posición.',
    amount: 120000,
    currency: 'USD',
    estReturn: '14–18% anual estimado en USD',
    termMonths: 30,
    status: 'activa',
    projectSlug: 'torre-libertador',
    coverImage: px(35282689, 1600),
    docs: [
      { name: 'Term sheet (PDF)', url: '/docs/fideicomiso-torre-libertador-term-sheet.pdf', sizeLabel: '620 KB', kind: 'term-sheet' },
      { name: 'Contrato marco de fideicomiso (PDF)', url: '/docs/fideicomiso-torre-libertador-contrato.pdf', sizeLabel: '1,3 MB', kind: 'contrato' },
    ],
    published: true,
    createdAt: '2025-11-15T12:00:00.000Z',
    fiduciario: { nombre: 'Fiduciaria Andes S.A.', tipo: 'Fiduciario financiero registrado en CNV' },
    tipoEstructura: 'Fideicomiso al costo',
    ticketMinimo: 120000,
    moneda: 'USD',
    integracion: [
      { etapa: 'Adhesión', porcentaje: 30, momento: 'A la firma del boleto de fideicomiso' },
      { etapa: 'Aportes durante obra', porcentaje: 50, momento: '6 cuotas mensuales iguales, atadas al certificado de avance' },
      { etapa: 'Saldo final', porcentaje: 20, momento: 'Contra escritura traslativa de dominio' },
    ],
    hitosDesembolso: [
      { hito: 'Estructura hasta piso 10', avanceObra: '45%', fecha: '2025-03-01' },
      { hito: 'Estructura completa (piso 22)', avanceObra: '70%', fecha: '2025-11-01' },
      { hito: 'Terminaciones y entrega', avanceObra: '100%', fecha: '2026-10-01' },
    ],
    salida:
      'Venta de la unidad asignada al inversor una vez escriturada, o cesión de la posición fiduciaria a un tercero con conformidad del fiduciario, en cualquier momento posterior a la adhesión.',
    escribania: 'Escribanía Roca & Asociados',
  },
  {
    slug: 'costa-tigre-etapa-1',
    title: 'Costa Tigre — Etapa 1',
    description:
      'Inversión temprana en la primera torre del masterplan Costa Tigre, con ticket de ingreso en etapa de diseño y curva de valorización proyectada hasta la entrega. Estructura de fideicomiso al costo con auditoría externa.',
    amount: 80000,
    currency: 'USD',
    estReturn: '20–25% total estimado a término, en USD',
    termMonths: 48,
    status: 'activa',
    projectSlug: 'costa-tigre',
    coverImage: px(29791458, 1600),
    docs: [{ name: 'Memorando de inversión (PDF)', url: '/docs/costa-tigre-etapa-1-memorando.pdf', sizeLabel: '1,9 MB', kind: 'memorando' }],
    published: true,
    createdAt: '2026-02-20T12:00:00.000Z',
    fiduciario: { nombre: 'BAP Fiduciaria S.A.', tipo: 'Fiduciario financiero registrado en CNV' },
    tipoEstructura: 'Fideicomiso al costo',
    ticketMinimo: 80000,
    moneda: 'USD',
    integracion: [
      { etapa: 'Reserva', porcentaje: 15, momento: 'A la firma de la carta de reserva' },
      { etapa: 'Adhesión al fideicomiso', porcentaje: 25, momento: 'A los 30 días de la reserva, contra firma del boleto' },
      { etapa: 'Aportes durante obra', porcentaje: 45, momento: '12 cuotas trimestrales, atadas al certificado de avance' },
      { etapa: 'Saldo final', porcentaje: 15, momento: 'Contra escritura traslativa de dominio de la Torre 1' },
    ],
    hitosDesembolso: [
      { hito: 'Documentación ejecutiva y permisos', avanceObra: '0%', fecha: '2026-09-01' },
      { hito: 'Inicio de fundaciones Torre 1', avanceObra: '10%', fecha: '2027-02-01' },
      { hito: 'Estructura completa Torre 1', avanceObra: '55%', fecha: '2028-06-01' },
      { hito: 'Terminaciones y entrega Torre 1', avanceObra: '100%', fecha: '2029-08-01' },
    ],
    salida:
      'Reventa de la posición fiduciaria en el mercado secundario habilitado por el fiduciario, o liquidación conjunta con la entrega de la Torre 1, estimada para agosto de 2029.',
    escribania: 'Escribanía Roca & Asociados',
  },
  {
    slug: 'nave-3-centro-logistico',
    title: 'Nave 3 — Centro Logístico Ruta 8',
    description:
      'Renta logística: participación sobre la nave 3 con contrato de alquiler corporativo pre-acordado a 5 años, ajuste semestral y salida por venta del activo estabilizado.',
    amount: 150000,
    currency: 'USD',
    estReturn: '9–11% anual estimado en USD (renta) + upside de venta',
    termMonths: 60,
    status: 'proximamente',
    projectSlug: 'centro-logistico-ruta-8',
    coverImage: px(2804929, 1600),
    docs: [{ name: 'Teaser (PDF)', url: '/docs/nave-3-centro-logistico-otro.pdf', sizeLabel: '540 KB', kind: 'otro' }],
    published: true,
    createdAt: '2026-05-05T12:00:00.000Z',
    fiduciario: { nombre: 'Global Trust Fiduciaria S.A.', tipo: 'Fiduciario financiero registrado en CNV' },
    tipoEstructura: 'Fideicomiso a valor fijo',
    ticketMinimo: 150000,
    moneda: 'USD',
    integracion: [
      { etapa: 'Adhesión', porcentaje: 40, momento: 'A la apertura del fideicomiso, prevista para el inicio de obra de nave 3' },
      { etapa: 'Aportes durante obra', porcentaje: 40, momento: '4 cuotas trimestrales, atadas al certificado de avance de nave 3' },
      { etapa: 'Saldo final', porcentaje: 20, momento: 'Contra habilitación municipal y firma del contrato de alquiler' },
    ],
    hitosDesembolso: [
      { hito: 'Apertura del fideicomiso e inicio de obra nave 3', avanceObra: '0%', fecha: '2026-11-01' },
      { hito: 'Estructura y piso industrial de nave 3', avanceObra: '60%', fecha: '2027-06-01' },
      { hito: 'Habilitación y puesta en renta', avanceObra: '100%', fecha: '2027-11-01' },
    ],
    salida:
      'Distribución de renta semestral durante el plazo del contrato de alquiler y venta del activo estabilizado al término de los 60 meses, con reparto proporcional a la posición fiduciaria.',
    escribania: 'Escribanía Núñez & Fresco',
  },
  {
    slug: 'edificio-alamos-cierre',
    title: 'Edificio Álamos — Ciclo completo',
    description:
      'Fideicomiso cerrado y liquidado. Caso testigo del ciclo completo de inversión Punto Cero: ingreso en pozo, obra en 27 meses y liquidación total dentro del plazo proyectado.',
    amount: 60000,
    currency: 'USD',
    estReturn: '16,4% anual efectivo en USD (resultado final del ciclo)',
    termMonths: 36,
    status: 'cerrada',
    projectSlug: 'edificio-alamos',
    coverImage: px(13197873, 1600),
    docs: [{ name: 'Informe de cierre (PDF)', url: '/docs/edificio-alamos-cierre-otro.pdf', sizeLabel: '980 KB', kind: 'otro' }],
    published: true,
    createdAt: '2023-12-15T12:00:00.000Z',
    fiduciario: { nombre: 'Fiduciaria Andes S.A.', tipo: 'Fiduciario financiero registrado en CNV' },
    tipoEstructura: 'Fideicomiso al costo',
    ticketMinimo: 60000,
    moneda: 'USD',
    integracion: [
      { etapa: 'Adhesión', porcentaje: 30, momento: 'A la firma del boleto de fideicomiso (febrero 2020)' },
      { etapa: 'Aportes durante obra', porcentaje: 50, momento: '8 cuotas trimestrales, integradas entre 2021 y 2023' },
      { etapa: 'Saldo final', porcentaje: 20, momento: 'Contra escritura traslativa de dominio (noviembre 2023)' },
    ],
    hitosDesembolso: [
      { hito: 'Inicio de obra', avanceObra: '0%', fecha: '2021-03-15' },
      { hito: 'Estructura completa', avanceObra: '55%', fecha: '2022-05-01' },
      { hito: 'Terminaciones y entrega', avanceObra: '100%', fecha: '2023-11-30' },
      { hito: 'Liquidación del fideicomiso', avanceObra: '100%', fecha: '2024-01-31' },
    ],
    salida:
      'Liquidado — el fiduciario distribuyó el resultado final del ciclo a los inversores en enero de 2024, tras la venta de la totalidad de las unidades asignadas al fideicomiso.',
    escribania: 'Escribanía Roca & Asociados',
  },
];

// SERV-01 — los 4 servicios (eran 8; se consolidaron en cuatro frentes)
export const SERVICES_FIXTURE: Service[] = [
  {
    id: 'srv-1',
    slug: 'desarrollo-inmobiliario',
    title: 'Desarrollo inmobiliario',
    description:
      'Originamos y lideramos proyectos de principio a fin: detección de oportunidades, estructuración del negocio, gestión integral y comercialización.',
    image: ASSET.desarrollo,
  },
  {
    id: 'srv-2',
    slug: 'arquitectura-y-diseno',
    title: 'Arquitectura y diseño',
    description:
      'Proyectos con identidad: anteproyecto, documentación ejecutiva y dirección de diseño con foco en el valor de largo plazo.',
    image: ASSET.arquitectura,
  },
  {
    id: 'srv-3',
    slug: 'construccion-y-obra',
    title: 'Construcción y dirección de obra',
    description:
      'Ejecución con equipos propios y contratistas calificados, dirección técnica, control de avance e infraestructura completa.',
    image: ASSET.construccion,
  },
  {
    id: 'srv-4',
    slug: 'financiamiento-e-inversiones',
    title: 'Financiamiento e inversiones',
    description:
      'Estructuración financiera y oportunidades de inversión: fideicomisos al costo, esquemas de aportes y seguimiento de cada etapa.',
    image: ASSET.inversiones,
  },
];

export const TEAM_FIXTURE: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Arq. Mariano Recalde',
    role: 'Socio fundador — Dirección de proyectos',
    photo: px(37605831, 800),
    bio: 'Arquitecto UBA con más de 20 años liderando desarrollos residenciales y corporativos en Buenos Aires.',
  },
  {
    id: 'tm-2',
    name: 'Ing. Carolina Bruzzone',
    role: 'Socia — Dirección de obra',
    photo: px(7937658, 800),
    bio: 'Ingeniera civil UTN, especialista en gestión de obra y estructuras de hormigón. Dirigió más de 150.000 m² construidos.',
  },
  {
    id: 'tm-3',
    name: 'Lic. Federico Anzorena',
    role: 'Director de inversiones',
    photo: px(7580766, 800),
    bio: 'Licenciado en finanzas, estructuró fideicomisos inmobiliarios por más de USD 40 millones en los últimos 10 años.',
  },
  {
    id: 'tm-4',
    name: 'Arq. Julieta Sansone',
    role: 'Directora de diseño',
    photo: px(36646353, 800),
    bio: 'Arquitecta UTDT. Lidera el estudio de diseño de Punto Cero con foco en arquitectura de líneas puras y eficiencia.',
  },
];

export const CONFIG_FIXTURE: PageConfig = {
  heroScrubEnabled: false,
  contactEmail: 'contacto@puntocerodesarrollos.com.ar',
  contactPhone: '+54 11 5555-0123',
  whatsappNumber: '5491155550123',
  address: 'Av. del Libertador 5252, Piso 3, Vicente López, Buenos Aires',
  officeCoords: { lat: -34.5271, lng: -58.4795 },
  metrics: {
    years: 18,
    m2: 185000,
    projects: 24,
  },
  legalName: 'Punto Cero Desarrollos S.A.',
  cuit: '30-71845632-1',
  matricula: 'Mat. CUCICBA 6042 / CMCPSI 4318',
  domicilioLegal: 'Av. del Libertador 5252, Piso 3, Vicente López, Buenos Aires, Argentina',
  disclaimers: {
    ofertaPublica:
      'Las oportunidades de inversión presentadas en este sitio no constituyen oferta pública de valores negociables en los términos de la Ley N.º 26.831 y no se encuentran registradas ante la Comisión Nacional de Valores (CNV). Están dirigidas exclusivamente a inversores que las reciban por contacto directo con Punto Cero Desarrollos.',
    datosPersonales:
      'Los datos personales ingresados en este sitio son tratados conforme a la Ley N.º 25.326 de Protección de los Datos Personales. El titular puede ejercer sus derechos de acceso, rectificación y supresión dirigiéndose a contacto@puntocerodesarrollos.com.ar.',
  },
  horarioAtencion: 'Lunes a viernes de 9 a 18 h',
  zonasCobertura: ['CABA', 'GBA Norte', 'Pilar', 'Tigre'],
};

// Preguntas frecuentes de inversores (INV-04). Vivían escritas a mano dentro de
// InvestorFaq.tsx; el copy es el mismo, palabra por palabra. Son la semilla:
// desde acá el equipo las edita, reordena y amplía desde el panel.
export const FAQ_FIXTURE: FaqItem[] = [
  {
    id: 'faq-1',
    question:
      '¿Qué es un fideicomiso al costo?',
    answer:
      'Es una estructura jurídica en la que los inversores aportan capital para desarrollar un proyecto y asumen el costo real de la obra, sin margen de desarrollador incorporado al precio. El fiduciario administra los fondos con un fin exclusivo: ejecutar el proyecto. El patrimonio del fideicomiso queda separado del de la desarrolladora y del de los propios inversores, lo que otorga una protección jurídica relevante.',
  },
  {
    id: 'faq-2',
    question:
      '¿Qué riesgos tiene invertir en un desarrollo inmobiliario?',
    answer:
      'Como toda inversión, implica riesgos: variaciones en el costo de construcción, plazos de obra, condiciones del mercado inmobiliario y del contexto macroeconómico. Ninguna cifra de retorno constituye una garantía. Trabajamos para mitigarlos con presupuestos auditados, contratos de obra cerrados, seguimiento técnico permanente e información periódica al inversor, pero el riesgo nunca es cero y así lo comunicamos.',
  },
  {
    id: 'faq-3',
    question:
      '¿Cómo se calculan los retornos estimados?',
    answer:
      'Surgen de la diferencia proyectada entre el costo total del desarrollo y el valor de venta estimado de las unidades, neta de gastos, honorarios e impuestos, distribuida en proporción a la participación de cada inversor. Son proyecciones basadas en valores de mercado al momento de la publicación: se actualizan durante la vida del proyecto y pueden variar.',
  },
  {
    id: 'faq-4',
    question:
      '¿Cómo y cuándo se realizan los retornos?',
    answer:
      'Depende de la estructura de cada oportunidad. En general, el retorno se materializa con la venta de las unidades al finalizar la obra, o mediante la adjudicación de unidades al inversor, quien puede venderlas o rentarlas. Algunos proyectos de renta distribuyen ingresos periódicos. El detalle de cada esquema figura en la documentación de la oportunidad.',
  },
  {
    id: 'faq-5',
    question:
      '¿Cuál es el proceso para invertir?',
    answer:
      'Primero coordinamos una reunión para entender su perfil y objetivos. Luego compartimos la documentación completa del proyecto: memoria técnica, flujo de fondos, contrato de fideicomiso y cronograma. Con la revisión hecha —recomendamos hacerlo con asesoramiento legal y contable propio— se firma la adhesión ante escribano y se integra el aporte según el plan acordado.',
  },
  {
    id: 'faq-6',
    question:
      '¿Cuál es el monto mínimo y en qué moneda se invierte?',
    answer:
      'Cada oportunidad define su monto mínimo de participación, que publicamos en la ficha correspondiente. Los proyectos suelen estar nominados en dólares estadounidenses, con esquemas de integración en cuotas ajustadas al avance de obra según el caso.',
  },
  {
    id: 'faq-7',
    question:
      '¿Qué información recibo durante la vida del proyecto?',
    answer:
      'Reportes periódicos de avance de obra con registro fotográfico, estado de aplicación de fondos y novedades relevantes del proyecto. Además, el inversor puede coordinar visitas a obra y consultas directas con nuestro equipo en cualquier etapa.',
  },
  {
    id: 'faq-8',
    question:
      '¿Puedo salir de la inversión antes de la finalización?',
    answer:
      'Los proyectos inmobiliarios son inversiones de mediano plazo y la permanencia hasta el término es el escenario previsto. No obstante, los contratos suelen contemplar la cesión de la posición fiduciaria a un tercero, sujeta a las condiciones establecidas en cada fideicomiso. Lo analizamos caso por caso.',
  },
];
