// Alianzas y Respaldo Institucional (Social Proof & Fiduciary Trust).
// Destaca las alianzas estratégicas, escribanías intervinientes, bancos fiduciarios
// y estudios de arquitectura que respaldan cada desarrollo de Punto Cero.
// Soporta edición en vivo y control de visibilidad desde el panel de administración.

import { ShieldCheck, Scale, Building, Landmark, CheckCircle2, Eye, EyeOff, Award } from 'lucide-react';
import Container from '../ui/Container';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../ui/InlineEditOverlay';

export interface AlianzasStripProps {
  id?: string;
  className?: string;
}

interface PartnerItem {
  nombre: string;
  rol: string;
  subtexto: string;
  icon: typeof ShieldCheck;
}

const PARTNERS_FIJOS: PartnerItem[] = [
  {
    nombre: 'Escribanías Titulares',
    rol: 'Seguridad y Trazabilidad Notarial',
    subtexto: 'Boletos de adhesión, protocolizaciones y constitución de fideicomisos bajo Ley 24.441.',
    icon: Scale,
  },
  {
    nombre: 'Bancos Fiduciarios',
    rol: 'Cuentas Fiduciarias Segregadas',
    subtexto: 'Custodia independiente de aportes: el capital solo se aplica a los certificados de la obra.',
    icon: Landmark,
  },
  {
    nombre: 'Estudios de Arquitectura & BIM',
    rol: 'Proyecto y Dirección Ejecutiva',
    subtexto: 'Modelado 3D de alta precisión, sustentabilidad térmica y optimización de costos constructivos.',
    icon: Building,
  },
  {
    nombre: 'Auditoría Técnica Externa',
    rol: 'Inspección de Avance y Calidad',
    subtexto: 'Certificaciones bimestrales de hitos de obra previo a cada liberación de fondos del cronograma.',
    icon: ShieldCheck,
  },
];

const GARANTIAS_METRICAS = [
  { valor: '100%', etiqueta: 'Fideicomisos al Costo Auditados' },
  { valor: '+15', etiqueta: 'Años de Trayectoria Constructora' },
  { valor: '0', etiqueta: 'Litigios Notariales o Financieros' },
  { valor: '100%', etiqueta: 'Obras Entregadas en Plazo' },
];

export default function AlianzasStrip({
  id = 'alianzas-institucionales',
  className = '',
}: AlianzasStripProps) {
  const {
    data: sectionData,
    update: updateSection,
    save: saveSectionCMS,
  } = useLiveSection({
    kicker: { key: 'home.alianzas.kicker', default: 'Respaldo Institucional' },
    title: { key: 'home.alianzas.title', default: 'Seguridad jurídica y excelencia profesional' },
    intro: {
      key: 'home.alianzas.intro',
      default:
        'Cada desarrollo de Punto Cero se estructura bajo los más rigurosos estándares jurídicos, financieros y técnicos del mercado inmobiliario argentino.',
    },
    sectionVisible: { key: 'home.alianzas.visible', default: 'true' },
  });

  const isVisible = sectionData.sectionVisible !== 'false';

  return (
    <EditableSectionWrapper
      sectionId="home-alianzas-wrapper"
      sectionLabel="Alianzas y Respaldo"
      onSave={saveSectionCMS}
      pencilPosition="top-6 right-6"
    >
      {(isEditing) => {
        if (!isVisible && !isEditing) return null;

        return (
          <section
            id={id}
            aria-label="Alianzas estratégicas y respaldo institucional"
            className={`py-20 md:py-28 bg-paper-soft border-t border-line transition-opacity duration-300 ${className} ${
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
                        <Eye className="w-4 h-4" /> La sección de alianzas está <strong>visible</strong> en la portada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                        <EyeOff className="w-4 h-4" /> La sección de alianzas está <strong>oculta</strong> en la portada
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline bg-paper text-xs font-medium uppercase tracking-widest text-brand-700 dark:text-brand-300 mb-4">
                  <Award className="w-3.5 h-3.5 text-brand-500" />
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

              {/* Grilla de Pilares Institucionales */}
              <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {PARTNERS_FIJOS.map((partner) => {
                  const Icon = partner.icon;
                  return (
                    <article
                      key={partner.nombre}
                      className="group relative bg-paper border border-line p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:border-brand-500/50 hover:shadow-lg"
                    >
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-sm bg-brand-500/10 text-brand-700 dark:text-brand-300 flex items-center justify-center transition-colors group-hover:bg-brand-900 group-hover:text-white dark:group-hover:bg-brand-500">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-widest text-brand-600 dark:text-brand-400">
                            {partner.rol}
                          </p>
                          <h3 className="mt-1 text-lg font-light text-ink">
                            {partner.nombre}
                          </h3>
                        </div>
                        <p className="text-xs font-light text-ink-soft leading-relaxed">
                          {partner.subtexto}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-1.5 text-[0.7rem] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verificado y Activo</span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Tira inferior de Métricas de Garantía Fiduciaria */}
              <div className="mt-12 bg-ink-fixed text-white p-8 sm:p-10 border border-white/10 shadow-xl">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                  {GARANTIAS_METRICAS.map((m, idx) => (
                    <div key={m.etiqueta} className={`${idx > 0 ? 'pt-6 lg:pt-0' : ''} px-4`}>
                      <span className="text-3xl sm:text-4xl font-light tracking-tight text-brand-300 font-serif">
                        {m.valor}
                      </span>
                      <p className="mt-2 text-xs font-light tracking-wide text-white/70 uppercase">
                        {m.etiqueta}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Container>
          </section>
        );
      }}
    </EditableSectionWrapper>
  );
}
