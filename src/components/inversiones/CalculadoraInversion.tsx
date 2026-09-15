// Calculadora / Simulador de Inversión Inmobiliaria interactiva.
// Permite a inversores y compradores proyectar su participación en fideicomisos al costo:
// anticipo, cuotas (CAC o USD), metros cuadrados equivalentes y plusvalía estimada de obra.
// Incluye control de visibilidad mediante Live CMS y WhatsApp click-to-chat personalizado.

import { useState, useEffect, useId, useMemo, useCallback } from 'react';
import {
  Calculator,
  TrendingUp,
  Building2,
  Calendar,
  MessageCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import Container from '../ui/Container';
import { configRepo, type PageConfig } from '../../data';
import { trackEvent } from '../../lib/analytics';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../ui/InlineEditOverlay';
import ReturnDisclaimer from './ReturnDisclaimer';

export interface CalculadoraInversionProps {
  id?: string;
  className?: string;
  initialProjectName?: string;
  initialTicketMinimo?: number;
  initialPlazoMeses?: number;
}

const PLAZOS_DISPONIBLES = [12, 18, 24, 36, 48];
const ANTICIPO_PRESETS = [30, 40, 50];

// Costo estimado referencial por m² en pozo (para estimación de superficie)
const COSTO_M2_USD = 1650;
const TIPO_CAMBIO_REFERENCIAL = 1350;

export default function CalculadoraInversion({
  id = 'calculadora-inversion',
  className = '',
  initialProjectName,
  initialTicketMinimo,
  initialPlazoMeses,
}: CalculadoraInversionProps) {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [moneda, setMoneda] = useState<'USD' | 'ARS'>('USD');

  // Valores interactivos
  const defaultMontoUSD = initialTicketMinimo ? Math.max(initialTicketMinimo, 25000) : 45000;
  const [montoUSD, setMontoUSD] = useState<number>(defaultMontoUSD);
  const [montoARS, setMontoARS] = useState<number>(defaultMontoUSD * TIPO_CAMBIO_REFERENCIAL);
  const [anticipoPct, setAnticipoPct] = useState<number>(40);
  const [plazoMeses, setPlazoMeses] = useState<number>(initialPlazoMeses ?? 24);
  const [modalidadAjuste, setModalidadAjuste] = useState<'CAC' | 'USD_FIJO'>('CAC');

  const montoSliderId = useId();
  const anticipoSliderId = useId();

  // Control de visibilidad vía Live CMS
  const {
    data: sectionData,
    update: updateSection,
    save: saveSectionCMS,
  } = useLiveSection({
    kicker: { key: 'inversiones.calculadora.kicker', default: 'Simulador Financiero' },
    title: { key: 'inversiones.calculadora.title', default: 'Proyecte su inversión en m²' },
    intro: {
      key: 'inversiones.calculadora.intro',
      default:
        'Personalice el capital a integrar, porcentaje de anticipo y cantidad de cuotas para simular su plan de aportes en fideicomiso al costo.',
    },
    sectionVisible: { key: 'inversiones.calculadora.visible', default: 'true' },
  });

  const isVisible = sectionData.sectionVisible !== 'false';

  useEffect(() => {
    configRepo.get().then(setConfig).catch(() => setConfig(null));
  }, []);

  // Monto actual según moneda elegida
  const montoActual = moneda === 'USD' ? montoUSD : montoARS;

  // Cálculos matemáticos en tiempo real
  const calculations = useMemo(() => {
    const anticipoMonto = montoActual * (anticipoPct / 100);
    const saldoAFinanciar = montoActual - anticipoMonto;
    const cuotaMensualEstimada = plazoMeses > 0 ? saldoAFinanciar / plazoMeses : 0;

    // Metros cuadrados equivalentes aproximados
    const m2Equivalentes =
      moneda === 'USD'
        ? montoActual / COSTO_M2_USD
        : (montoActual / TIPO_CAMBIO_REFERENCIAL) / COSTO_M2_USD;

    // Retorno proyectado según el plazo (plusvalía estimada de pozo a entrega)
    const plusvaliaBasePct = 18 + (plazoMeses / 12) * 3.5; // Ej: 24 meses = 25%
    const retornoEstimadoValor = montoActual * (1 + plusvaliaBasePct / 100);
    const tirAnualizadaEstimada = 10.5 + (plazoMeses <= 24 ? 1.5 : 0.8);

    return {
      anticipoMonto,
      saldoAFinanciar,
      cuotaMensualEstimada,
      m2Equivalentes: Math.round(m2Equivalentes * 10) / 10,
      plusvaliaBasePct: Math.round(plusvaliaBasePct),
      retornoEstimadoValor,
      tirAnualizadaEstimada: Math.round(tirAnualizadaEstimada * 10) / 10,
    };
  }, [montoActual, anticipoPct, plazoMeses, moneda]);

  // Formato monetario
  const formatMoney = useCallback(
    (val: number) => {
      return `${moneda === 'USD' ? 'USD' : '$'} ${Math.round(val).toLocaleString('es-AR')}`;
    },
    [moneda],
  );

  // URL WhatsApp con mensaje pre-armado
  const whatsappUrl = useMemo(() => {
    const phone = config?.whatsappNumber || '5491112345678';
    const projectMention = initialProjectName ? ` en el proyecto ${initialProjectName}` : '';
    const text = `Hola Punto Cero Desarrollos, utilicé el simulador de inversión en la web${projectMention}. Me interesa participar con un aporte de ${formatMoney(montoActual)}, con anticipo del ${anticipoPct}% (${formatMoney(calculations.anticipoMonto)}) y ${plazoMeses} cuotas de aprox. ${formatMoney(calculations.cuotaMensualEstimada)} ${moneda === 'ARS' ? '(ajuste CAC)' : 'fijas USD'}. Quisiera coordinar una reunión y recibir la corrida financiera detallada.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [config, initialProjectName, montoActual, anticipoPct, plazoMeses, calculations, formatMoney, moneda]);

  const handleMontoChange = (newVal: number) => {
    if (moneda === 'USD') {
      setMontoUSD(newVal);
      setMontoARS(newVal * TIPO_CAMBIO_REFERENCIAL);
    } else {
      setMontoARS(newVal);
      setMontoUSD(Math.round(newVal / TIPO_CAMBIO_REFERENCIAL));
    }
  };

  const minMonto = moneda === 'USD' ? 15000 : 15000 * TIPO_CAMBIO_REFERENCIAL;
  const maxMonto = moneda === 'USD' ? 250000 : 250000 * TIPO_CAMBIO_REFERENCIAL;
  const stepMonto = moneda === 'USD' ? 2500 : 2500000;

  return (
    <EditableSectionWrapper
      sectionId="calculadora-inversion-wrapper"
      sectionLabel="Calculadora de Inversión"
      onSave={saveSectionCMS}
      pencilPosition="top-6 right-6"
    >
      {(isEditing) => {
        if (!isVisible && !isEditing) return null;

        return (
          <section
            id={id}
            aria-label="Calculadora de inversión y proyección de cuotas"
            className={`relative py-20 md:py-28 bg-paper border-t border-line transition-opacity duration-300 ${className} ${
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
                        <Eye className="w-4 h-4" /> La calculadora está <strong>visible</strong> para los inversores
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                        <EyeOff className="w-4 h-4" /> La calculadora está <strong>oculta</strong> para los inversores
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
                    {isVisible ? 'Ocultar calculadora' : 'Hacer visible'}
                  </button>
                </div>
              )}

              {/* Encabezado */}
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline bg-paper-soft text-xs font-medium uppercase tracking-widest text-brand-700 dark:text-brand-300 mb-4">
                  <Calculator className="w-3.5 h-3.5 text-brand-500" />
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

              {/* Cuerpo del Simulador: Panel de Controles + Panel de Resultados */}
              <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Columna Izquierda: Parámetros del Simulador (7 cols) */}
                <div className="lg:col-span-7 bg-paper-soft border border-line p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-8">
                  {/* Selector de Moneda y Modalidad */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-ink-soft font-medium">
                        Moneda del aporte
                      </span>
                      <div className="mt-2 inline-flex rounded-sm p-1 bg-paper border border-line">
                        <button
                          type="button"
                          onClick={() => setMoneda('USD')}
                          className={`px-4 py-1.5 text-xs font-medium tracking-wider rounded-sm transition-colors ${
                            moneda === 'USD'
                              ? 'bg-brand-900 text-white dark:bg-brand-500'
                              : 'text-ink-soft hover:text-ink'
                          }`}
                        >
                          USD (Dólares)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMoneda('ARS')}
                          className={`px-4 py-1.5 text-xs font-medium tracking-wider rounded-sm transition-colors ${
                            moneda === 'ARS'
                              ? 'bg-brand-900 text-white dark:bg-brand-500'
                              : 'text-ink-soft hover:text-ink'
                          }`}
                        >
                          ARS (Pesos)
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs uppercase tracking-widest text-ink-soft font-medium">
                        Ajuste de cuotas
                      </span>
                      <div className="mt-2 inline-flex rounded-sm p-1 bg-paper border border-line">
                        <button
                          type="button"
                          onClick={() => setModalidadAjuste('CAC')}
                          className={`px-3 py-1.5 text-xs font-medium tracking-wider rounded-sm transition-colors ${
                            modalidadAjuste === 'CAC'
                              ? 'bg-brand-900 text-white dark:bg-brand-500'
                              : 'text-ink-soft hover:text-ink'
                          }`}
                          title="Ajuste mensual por índice de la Cámara Argentina de la Construcción"
                        >
                          Índice CAC
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalidadAjuste('USD_FIJO')}
                          className={`px-3 py-1.5 text-xs font-medium tracking-wider rounded-sm transition-colors ${
                            modalidadAjuste === 'USD_FIJO'
                              ? 'bg-brand-900 text-white dark:bg-brand-500'
                              : 'text-ink-soft hover:text-ink'
                          }`}
                          title="Cuotas fijas en dólares sin interés"
                        >
                          Cuota fija USD
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Slider 1: Monto total a invertir */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={montoSliderId}
                        className="text-xs font-medium uppercase tracking-wider text-ink"
                      >
                        Capital total de inversión
                      </label>
                      <span className="text-xl sm:text-2xl font-light text-brand-700 dark:text-brand-300 font-serif">
                        {formatMoney(montoActual)}
                      </span>
                    </div>

                    <input
                      id={montoSliderId}
                      type="range"
                      min={minMonto}
                      max={maxMonto}
                      step={stepMonto}
                      value={montoActual}
                      onChange={(e) => handleMontoChange(Number(e.target.value))}
                      className="w-full h-2 bg-paper border border-line rounded-lg appearance-none cursor-pointer accent-brand-700 dark:accent-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                    />

                    <div className="flex justify-between text-[0.7rem] text-ink-soft font-light">
                      <span>Mínimo: {formatMoney(minMonto)}</span>
                      <span>Máximo: {formatMoney(maxMonto)}</span>
                    </div>
                  </div>

                  {/* Slider 2: Anticipo Inicial (%) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={anticipoSliderId}
                          className="text-xs font-medium uppercase tracking-wider text-ink"
                        >
                          Anticipo inicial a la adhesión
                        </label>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-brand-500/10 text-brand-700 dark:text-brand-300">
                          {anticipoPct}%
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-light text-ink">
                        {formatMoney(calculations.anticipoMonto)}
                      </span>
                    </div>

                    <input
                      id={anticipoSliderId}
                      type="range"
                      min={30}
                      max={70}
                      step={5}
                      value={anticipoPct}
                      onChange={(e) => setAnticipoPct(Number(e.target.value))}
                      className="w-full h-2 bg-paper border border-line rounded-lg appearance-none cursor-pointer accent-brand-700 dark:accent-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                    />

                    {/* Presets rápidos */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[0.7rem] text-ink-soft uppercase tracking-wider">
                        Sugeridos:
                      </span>
                      {ANTICIPO_PRESETS.map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setAnticipoPct(pct)}
                          className={`text-xs px-2.5 py-1 rounded-sm border transition-colors ${
                            anticipoPct === pct
                              ? 'border-brand-700 bg-brand-100 text-brand-900 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-200'
                              : 'border-line bg-paper text-ink-soft hover:text-ink'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector 3: Plazo en Cuotas */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium uppercase tracking-wider text-ink">
                        Plazo de financiamiento del saldo
                      </label>
                      <span className="text-xs font-light text-ink-soft">
                        Saldo a financiar: {formatMoney(calculations.saldoAFinanciar)}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {PLAZOS_DISPONIBLES.map((meses) => (
                        <button
                          key={meses}
                          type="button"
                          onClick={() => setPlazoMeses(meses)}
                          className={`py-2.5 text-center text-xs font-medium tracking-wide rounded-sm border transition-all ${
                            plazoMeses === meses
                              ? 'border-brand-900 bg-brand-900 text-white dark:border-brand-400 dark:bg-brand-500'
                              : 'border-line bg-paper text-ink hover:border-brand-300'
                          }`}
                        >
                          {meses} meses
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Tarjeta de Proyección & Retorno (5 cols) */}
                <div className="lg:col-span-5 bg-ink-fixed text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden border border-white/10">
                  {/* Detalle sutil de fondo */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-xs uppercase tracking-widest text-brand-300 font-medium">
                        Resumen de Proyección
                      </span>
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                        <Sparkles className="w-3 h-3" /> Fideicomiso al Costo
                      </span>
                    </div>

                    {/* Métrica 1: Cuota Mensual */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
                      <div className="flex items-center gap-2 text-xs text-white/70 font-light">
                        <Calendar className="w-3.5 h-3.5 text-brand-300" />
                        <span>Cuota mensual estimada ({plazoMeses} cuotas):</span>
                      </div>
                      <p className="mt-1 text-2xl sm:text-3xl font-light tracking-tight text-white font-serif">
                        {formatMoney(calculations.cuotaMensualEstimada)}
                        <span className="text-xs font-sans text-white/60 ml-2">
                          / mes {modalidadAjuste === 'CAC' && moneda === 'ARS' ? '(+ CAC)' : ''}
                        </span>
                      </p>
                    </div>

                    {/* Métrica 2 y 3: Superficie m² y Plusvalía */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 bg-white/5 border border-white/10 rounded-sm">
                        <div className="flex items-center gap-1.5 text-xs text-white/70 font-light">
                          <Building2 className="w-3.5 h-3.5 text-brand-300" />
                          <span>Metros equivalentes:</span>
                        </div>
                        <p className="mt-1 text-xl font-light text-white font-serif">
                          ~{calculations.m2Equivalentes} <span className="text-xs font-sans text-white/60">m²</span>
                        </p>
                      </div>

                      <div className="p-3.5 bg-white/5 border border-white/10 rounded-sm">
                        <div className="flex items-center gap-1.5 text-xs text-white/70 font-light">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Retorno proyectado:</span>
                        </div>
                        <p className="mt-1 text-xl font-light text-emerald-300 font-serif">
                          +{calculations.plusvaliaBasePct}% <span className="text-[0.65rem] font-sans text-white/60">a posesión</span>
                        </p>
                      </div>
                    </div>

                    {/* Resumen numérico */}
                    <div className="space-y-2 text-xs font-light text-white/80 border-t border-white/10 pt-4">
                      <div className="flex justify-between">
                        <span className="text-white/60">Anticipo al boleto:</span>
                        <span className="font-mono text-white">{formatMoney(calculations.anticipoMonto)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Tasa Interna de Retorno (TIR est.):</span>
                        <span className="font-mono text-emerald-300">~{calculations.tirAnualizadaEstimada}% anual USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Valorización final estimada:</span>
                        <span className="font-mono text-white">{formatMoney(calculations.retornoEstimadoValor)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Conversión */}
                  <div className="relative space-y-3 pt-4 border-t border-white/10">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent('lead_whatsapp_calculadora', {
                          category: 'Conversión',
                          label: `Monto: ${montoActual} - Plazo: ${plazoMeses}`,
                        })
                      }
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs uppercase tracking-widest transition-colors rounded-sm shadow-lg hover:shadow-emerald-900/40"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Solicitar simulación por WhatsApp
                    </a>

                    <p className="text-[0.68rem] text-center text-white/50 leading-tight">
                      Un asesor fiduciario le enviará la corrida analítica detallada con el plan de certificación de obra.
                    </p>
                  </div>
                </div>
              </div>

              {/* Disclaimer legal obligatorio de la Ley 26.831 */}
              <div className="mt-8">
                <ReturnDisclaimer className="text-center max-w-4xl mx-auto" />
              </div>
            </Container>
          </section>
        );
      }}
    </EditableSectionWrapper>
  );
}
