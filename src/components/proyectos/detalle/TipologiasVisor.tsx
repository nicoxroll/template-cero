// Visor de Tipologías y Planos Arquitectónicos de Proyectos.
// Permite a los compradores e inversores explorar las unidades disponibles (1, 2, 3 amb),
// planos de planta, metros cuadrados (cubiertos/descubiertos), orientación y características.
// Incluye control de visibilidad en vivo y consulta directa hacia WhatsApp / contacto.

import { useState, useMemo } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  MessageCircle,
  Eye,
  EyeOff,
  Car,
  Home,
  Layers,
} from 'lucide-react';
import type { Project, ProjectTypology } from '../../../data';
import Container from '../../ui/Container';
import { useLiveSection } from '../../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../../ui/InlineEditOverlay';

export interface TipologiasVisorProps {
  project: Project;
  id?: string;
  className?: string;
}

// Tipologías por defecto si el proyecto no tiene definidas tipologías específicas
const DEFAULT_TIPOLOGIAS: ProjectTypology[] = [
  {
    id: '1-amb',
    nombre: '1 Ambiente / Studio Profesional',
    ambientes: 1,
    superficieCubierta: 38,
    superficieDescubierta: 6,
    superficieTotal: 44,
    orientacion: 'Norte / Contrafrente abierto',
    cocheraOpcional: true,
    disponibilidad: 'disponible',
    descripcion:
      'Ideal para renta temporaria o primer vivienda. Espacio versátil y luminoso con cocina integrada, ventanales DVH de piso a techo y balcón aterrazado.',
    caracteristicas: [
      'Cocina integrada con mesada de Silestone',
      'Carpinterías de aluminio con doble vidriado hermético (DVH)',
      'Preinstalación para aire acondicionado frío/calor',
      'Baño completo con artefactos y griferías de primera línea',
      'Pisos de porcelanato rectificado símil madera',
    ],
  },
  {
    id: '2-amb',
    nombre: '2 Ambientes con Balcón Terraza',
    ambientes: 2,
    superficieCubierta: 54,
    superficieDescubierta: 12,
    superficieTotal: 66,
    orientacion: 'Noreste / Frente con vista panorámica',
    cocheraOpcional: true,
    disponibilidad: 'ultimas_unidades',
    descripcion:
      'Unidad residencial de jerarquía con dormitorio en suite, vestidor, toilette de recepción y balcón terraza con parrilla individual.',
    caracteristicas: [
      'Dormitorio principal con vestidor y baño en suite',
      'Toilette de recepción para visitas',
      'Balcón terraza con parrilla propia integrada',
      'Calefacción por losa radiante individual',
      'Mobiliario de cocina de diseño con bajo mesada y alacena',
    ],
  },
  {
    id: '3-amb',
    nombre: '3 Ambientes / Semipiso Familiar',
    ambientes: 3,
    superficieCubierta: 88,
    superficieDescubierta: 18,
    superficieTotal: 106,
    orientacion: 'Este / Doble orientación cruzada',
    cocheraOpcional: true,
    disponibilidad: 'disponible',
    descripcion:
      'Semipiso de gran escala con palier semiprivado, master suite, segundo dormitorio, living apaisado y amplia expansión exterior.',
    caracteristicas: [
      'Master suite con vestidor y baño compartimentado',
      'Segundo dormitorio con placard de piso a techo',
      'Living-comedor apaisado con salida directa a terraza',
      'Cocina independiente con lavadero sectorizado',
      'Cochera fija cubierta y baulera asignada',
    ],
  },
  {
    id: 'cocheras',
    nombre: 'Cocheras & Bauleras Privadas',
    ambientes: 0,
    superficieCubierta: 14,
    superficieDescubierta: 0,
    superficieTotal: 14,
    orientacion: 'Subsuelo / Acceso por rampa fija',
    cocheraOpcional: false,
    disponibilidad: 'disponible',
    descripcion:
      'Espacios vehiculares fijos y cubiertos con portón automático de alta velocidad, iluminación LED con sensores y bauleras metálicas.',
    caracteristicas: [
      'Acceso vehicular automatizado con control remoto',
      'Espacio apto para camionetas SUV y vehículos grandes',
      'Circuito cerrado de cámaras de seguridad (CCTV 24 hs)',
      'Bauleras individuales metálicas con cerradura propia',
    ],
  },
];

export default function TipologiasVisor({
  project,
  id = 'tipologias-planos',
  className = '',
}: TipologiasVisorProps) {
  const [selectedId, setSelectedId] = useState<string>('2-amb');

  // Control de visibilidad vía Live CMS
  const {
    data: sectionData,
    update: updateSection,
    save: saveSectionCMS,
  } = useLiveSection({
    kicker: { key: 'proyectos.tipologias.kicker', default: 'Distribución y Espacios' },
    title: { key: 'proyectos.tipologias.title', default: 'Tipologías y Planos de Planta' },
    intro: {
      key: 'proyectos.tipologias.intro',
      default:
        'Explore las configuraciones de planta disponibles para este desarrollo, con especificaciones métricas, orientación y detalles constructivos.',
    },
    sectionVisible: { key: 'proyectos.tipologias.visible', default: 'true' },
  });

  const isVisible = sectionData.sectionVisible !== 'false';

  const tipologias = useMemo(() => {
    return project.tipologias && project.tipologias.length > 0
      ? project.tipologias
      : DEFAULT_TIPOLOGIAS;
  }, [project]);

  const activeTipologia = useMemo(() => {
    return tipologias.find((t) => t.id === selectedId) || tipologias[0];
  }, [tipologias, selectedId]);

  // Mensaje WhatsApp con tipología preseleccionada
  const whatsappUrl = useMemo(() => {
    const text = `Hola Punto Cero Desarrollos, estoy viendo el proyecto "${project.name}" y quisiera consultar la disponibilidad y precios de la tipología "${activeTipologia.nombre}" (${activeTipologia.superficieTotal} m² totales).`;
    return `https://wa.me/5491112345678?text=${encodeURIComponent(text)}`;
  }, [project.name, activeTipologia]);

  return (
    <EditableSectionWrapper
      sectionId="proyectos-tipologias-wrapper"
      sectionLabel="Tipologías y Planos"
      onSave={saveSectionCMS}
      pencilPosition="top-6 right-6"
    >
      {(isEditing) => {
        if (!isVisible && !isEditing) return null;

        return (
          <section
            id={id}
            aria-label="Tipologías y planos del proyecto"
            className={`py-20 md:py-28 bg-paper border-t border-line transition-opacity duration-300 ${className} ${
              !isVisible ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <Container>
              {/* Banner de control de visibilidad en modo edición admin */}
              {isEditing && (
                <div className="mb-10 p-4 bg-brand-500/10 border border-brand-500/30 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    {isVisible ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <Eye className="w-4 h-4" /> La sección de planos y tipologías está <strong>visible</strong>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                        <EyeOff className="w-4 h-4" /> La sección de planos y tipologías está <strong>oculta</strong>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSection('sectionVisible', isVisible ? 'false' : 'true')}
                    className={`px-3 py-1.5 font-medium tracking-wide uppercase transition-colors rounded ${
                      isVisible
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {isVisible ? 'Ocultar sección' : 'Hacer visible'}
                  </button>
                </div>
              )}

              {/* Encabezado */}
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline bg-paper-soft text-xs font-medium uppercase tracking-widest text-brand-700 dark:text-brand-300 mb-4">
                  <Layers className="w-3.5 h-3.5 text-brand-500" />
                  <EditableText
                    value={sectionData.kicker}
                    isEditing={isEditing}
                    onChange={(val) => updateSection('kicker', val)}
                  />
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-ink font-serif">
                  <EditableText
                    value={sectionData.title}
                    isEditing={isEditing}
                    onChange={(val) => updateSection('title', val)}
                  />
                </h2>
                <p className="mt-4 text-sm sm:text-base text-ink-soft font-light leading-relaxed">
                  <EditableText
                    value={sectionData.intro}
                    isEditing={isEditing}
                    onChange={(val) => updateSection('intro', val)}
                  />
                </p>
              </div>

              {/* Pestañas de Selección de Tipología */}
              <div
                role="tablist"
                aria-label="Tipologías de departamentos"
                className="mt-10 flex flex-wrap gap-2 border-b border-line pb-4"
              >
                {tipologias.map((tipologia) => {
                  const isSelected = tipologia.id === selectedId;
                  return (
                    <button
                      key={tipologia.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedId(tipologia.id)}
                      className={`px-5 py-3 text-xs font-medium tracking-wider uppercase transition-all rounded-sm flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-brand-900 text-white dark:bg-brand-500 shadow-md'
                          : 'bg-paper-soft border border-line text-ink-soft hover:text-ink hover:border-brand-500/40'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>{tipologia.nombre}</span>
                      <span className={`text-[0.68rem] px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-line text-ink-soft'
                      }`}>
                        {tipologia.superficieTotal} m²
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Contenido de la Tipología Activa */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Columna Izquierda: Plano Arquitectónico Ilustrado (7 cols) */}
                <div className="lg:col-span-7 bg-paper-soft border border-line p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-hairline pb-4 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-widest text-ink font-medium">
                        Esquema de Planta
                      </span>
                      <span className="text-xs text-ink-soft font-light">
                        Escala 1:50 referencial
                      </span>
                    </div>

                    {/* Badge de Disponibilidad */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[0.7rem] uppercase tracking-wider font-medium ${
                        activeTipologia.disponibilidad === 'disponible'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : activeTipologia.disponibilidad === 'ultimas_unidades'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {activeTipologia.disponibilidad === 'disponible' && <CheckCircle2 className="w-3 h-3" />}
                      {activeTipologia.disponibilidad === 'ultimas_unidades' && <Clock className="w-3 h-3" />}
                      {activeTipologia.disponibilidad === 'disponible'
                        ? 'Disponible'
                        : activeTipologia.disponibilidad === 'ultimas_unidades'
                        ? 'Últimas unidades'
                        : 'Reservada'}
                    </span>
                  </div>

                  {/* Plano arquitectónico ilustrado con grid blueprints */}
                  <div className="relative aspect-[4/3] w-full rounded-sm bg-brand-950/5 dark:bg-black/30 border border-hairline overflow-hidden flex items-center justify-center p-6">
                    {/* Cuadrícula milimetrada estilo blueprint arquitectónico */}
                    <div
                      className="absolute inset-0 opacity-15 dark:opacity-25 pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, var(--border) 1px, transparent 1px),
                          linear-gradient(to bottom, var(--border) 1px, transparent 1px)
                        `,
                        backgroundSize: '24px 24px',
                      }}
                    />

                    {/* Ilustración esquemática del plano */}
                    <div className="relative z-10 w-full max-w-md p-6 bg-paper/90 dark:bg-ink-fixed/90 backdrop-blur-sm border-2 border-brand-700/40 dark:border-brand-400/40 rounded shadow-lg text-center space-y-4">
                      <div className="flex items-center justify-between border-b border-hairline pb-3">
                        <span className="text-xs font-mono font-bold text-brand-700 dark:text-brand-300 uppercase">
                          {project.name}
                        </span>
                        <span className="text-xs font-mono text-ink-soft">
                          NIVEL TIPO
                        </span>
                      </div>

                      <div className="py-6 border border-dashed border-line rounded flex flex-col items-center justify-center gap-2">
                        <Home className="w-10 h-10 text-brand-500/70 stroke-[1.5]" />
                        <p className="text-sm font-light text-ink">
                          {activeTipologia.nombre}
                        </p>
                        <p className="text-2xl font-light text-brand-700 dark:text-brand-300 font-serif">
                          {activeTipologia.superficieTotal} m²
                        </p>
                        <div className="flex items-center gap-4 text-xs font-light text-ink-soft pt-1">
                          <span>Cubierta: <strong>{activeTipologia.superficieCubierta} m²</strong></span>
                          <span>Descubierta: <strong>{activeTipologia.superficieDescubierta} m²</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[0.7rem] text-ink-soft font-mono pt-2">
                        <span>Cochera: {activeTipologia.cocheraOpcional ? 'Opcional en SS' : 'No aplica'}</span>
                        <span>{activeTipologia.orientacion}</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-[0.75rem] text-ink-soft font-light italic">
                    * El plano ilustrado es de carácter preliminar y sujeto a ajustes de proyecto ejecutivo y aprobación municipal.
                  </p>
                </div>

                {/* Columna Derecha: Especificaciones Técnicas y CTA (5 cols) */}
                <div className="lg:col-span-5 bg-paper border border-line p-6 sm:p-8 space-y-6">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-widest text-brand-600 dark:text-brand-400">
                      Detalle de la unidad
                    </span>
                    <h3 className="mt-1 text-2xl font-light text-ink font-serif">
                      {activeTipologia.nombre}
                    </h3>
                    <p className="mt-3 text-xs sm:text-sm font-light text-ink-soft leading-relaxed">
                      {activeTipologia.descripcion}
                    </p>
                  </div>

                  {/* Ficha métrica */}
                  <div className="grid grid-cols-3 gap-3 border-y border-hairline py-4 text-center">
                    <div className="p-2 bg-paper-soft rounded-sm">
                      <span className="text-[0.65rem] uppercase tracking-wider text-ink-soft block">
                        Total
                      </span>
                      <span className="text-lg font-light text-ink font-serif">
                        {activeTipologia.superficieTotal} m²
                      </span>
                    </div>
                    <div className="p-2 bg-paper-soft rounded-sm">
                      <span className="text-[0.65rem] uppercase tracking-wider text-ink-soft block">
                        Cubierta
                      </span>
                      <span className="text-lg font-light text-ink font-serif">
                        {activeTipologia.superficieCubierta} m²
                      </span>
                    </div>
                    <div className="p-2 bg-paper-soft rounded-sm">
                      <span className="text-[0.65rem] uppercase tracking-wider text-ink-soft block">
                        Exterior
                      </span>
                      <span className="text-lg font-light text-ink font-serif">
                        {activeTipologia.superficieDescubierta} m²
                      </span>
                    </div>
                  </div>

                  {/* Atributos especiales */}
                  <div className="space-y-2.5 text-xs text-ink-soft">
                    {activeTipologia.orientacion && (
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-brand-500 shrink-0" />
                        <span>Orientación: <strong className="text-ink">{activeTipologia.orientacion}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-brand-500 shrink-0" />
                      <span>
                        Cochera: <strong className="text-ink">{activeTipologia.cocheraOpcional ? 'Disponible / Opcional' : 'No requerida'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Lista de Características */}
                  {activeTipologia.caracteristicas && activeTipologia.caracteristicas.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs uppercase tracking-wider text-ink font-medium">
                        Terminaciones y Equipamiento:
                      </p>
                      <ul className="space-y-1.5">
                        {activeTipologia.caracteristicas.map((carac, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-light text-ink-soft">
                            <span className="text-brand-500 mt-0.5">•</span>
                            <span>{carac}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Botón de Contacto / WhatsApp */}
                  <div className="pt-4 border-t border-hairline">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-900 hover:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400 text-white font-medium text-xs uppercase tracking-widest transition-colors rounded-sm shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Consultar disponibilidad y precios
                    </a>
                  </div>
                </div>
              </div>
            </Container>
          </section>
        );
      }}
    </EditableSectionWrapper>
  );
}
