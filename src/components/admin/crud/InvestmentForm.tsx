// Formulario de alta/edición de oportunidades de inversión (ADMIN-02).
// react-hook-form + zod; retorno estimado con wording "estimado" obligatorio
// mientras la oportunidad no esté cerrada (INV-03).

import { useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  DOCUMENT_KIND_LABELS,
  INVESTMENT_STATUS_LABELS,
  type DocumentKind,
  type Investment,
  type Project,
} from '../../../data';

const DOCUMENT_KINDS = Object.keys(DOCUMENT_KIND_LABELS) as DocumentKind[];
const TIPO_ESTRUCTURA_OPTIONS = ['Fideicomiso al costo', 'Fideicomiso a valor fijo'] as const;
import { CheckboxField, Field, FormSection, inputCls } from './FormField';
import ImageUploader from './ImageUploader';
import FormActions from './FormActions';

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildSchema(takenSlugs: string[]) {
  return z
    .object({
      title: z.string().trim().min(2, 'Mínimo 2 caracteres'),
      slug: z
        .string()
        .trim()
        .min(1, 'Requerido')
        .regex(SLUG_RE, 'Formato kebab-case (ej: fideicomiso-torre-norte)'),
      description: z.string().trim().min(10, 'Mínimo 10 caracteres'),
      amount: z
        .string()
        .trim()
        .min(1, 'Requerido')
        .refine((v) => !Number.isNaN(Number(v.replace(',', '.'))), 'Debe ser un número')
        .refine((v) => Number(v.replace(',', '.')) > 0, 'Debe ser mayor a cero'),
      currency: z.enum(['USD', 'ARS']),
      estReturn: z.string().trim().min(3, 'Requerido'),
      termMonths: z
        .string()
        .trim()
        .min(1, 'Requerido')
        .refine((v) => /^\d+$/.test(v) && Number(v) > 0, 'Meses enteros, mayor a cero'),
      status: z.enum(['activa', 'proximamente', 'cerrada']),
      projectSlug: z.string(),
      coverImage: z.string().trim().min(1, 'Requerido'),
      docs: z.array(
        z.object({
          name: z.string().trim().min(1, 'Requerido'),
          url: z.string().trim().min(1, 'URL requerida'),
          sizeLabel: z.string().trim().min(1, 'Requerido'),
          kind: z.enum(DOCUMENT_KINDS as [DocumentKind, ...DocumentKind[]]),
        }),
      ),
      fiduciarioNombre: z.string().trim().min(2, 'Requerido'),
      fiduciarioTipo: z.string().trim().min(2, 'Requerido'),
      tipoEstructura: z.enum(TIPO_ESTRUCTURA_OPTIONS),
      ticketMinimo: z
        .string()
        .trim()
        .min(1, 'Requerido')
        .refine((v) => !Number.isNaN(Number(v.replace(',', '.'))), 'Debe ser un número')
        .refine((v) => Number(v.replace(',', '.')) > 0, 'Debe ser mayor a cero'),
      moneda: z.enum(['USD', 'ARS']),
      integracion: z.array(
        z.object({
          etapa: z.string().trim().min(1, 'Requerido'),
          porcentaje: z
            .string()
            .trim()
            .min(1, 'Requerido')
            .refine((v) => !Number.isNaN(Number(v.replace(',', '.'))), 'Debe ser un número'),
          momento: z.string().trim().min(1, 'Requerido'),
        }),
      ),
      hitosDesembolso: z.array(
        z.object({
          hito: z.string().trim().min(1, 'Requerido'),
          avanceObra: z.string().trim().min(1, 'Requerido'),
          fecha: z.string().trim().min(1, 'Requerido'),
        }),
      ),
      salida: z.string().trim().min(10, 'Mínimo 10 caracteres'),
      escribania: z.string().trim().min(2, 'Requerido'),
      published: z.boolean(),
    })
    .superRefine((v, ctx) => {
      if (takenSlugs.includes(v.slug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['slug'],
          message: 'Ya existe una oportunidad con ese slug',
        });
      }
      // INV-03: mientras la oportunidad no esté cerrada, el retorno debe declararse estimado
      if (v.status !== 'cerrada' && !/estimad/i.test(v.estReturn)) {
        ctx.addIssue({
          code: 'custom',
          path: ['estReturn'],
          message: 'El retorno debe incluir la palabra "estimado" (no es garantía — INV-03)',
        });
      }
      // La suma de porcentajes de integración de aportes debe dar 100
      if (v.integracion.length > 0) {
        const total = v.integracion.reduce(
          (sum, i) => sum + (Number(i.porcentaje.replace(',', '.')) || 0),
          0,
        );
        if (Math.round(total) !== 100) {
          ctx.addIssue({
            code: 'custom',
            path: ['integracion'],
            message: `La suma de porcentajes debe dar 100% (hoy: ${total}%)`,
          });
        }
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function toDefaults(initial?: Investment): FormValues {
  return {
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    amount: initial ? String(initial.amount) : '',
    currency: initial?.currency ?? 'USD',
    estReturn: initial?.estReturn ?? '',
    termMonths: initial ? String(initial.termMonths) : '',
    status: initial?.status ?? 'activa',
    projectSlug: initial?.projectSlug ?? '',
    coverImage: initial?.coverImage ?? '',
    docs: initial?.docs ?? [],
    fiduciarioNombre: initial?.fiduciario.nombre ?? '',
    fiduciarioTipo: initial?.fiduciario.tipo ?? 'Fiduciario financiero registrado en CNV',
    tipoEstructura: initial?.tipoEstructura ?? 'Fideicomiso al costo',
    ticketMinimo: initial ? String(initial.ticketMinimo) : '',
    moneda: initial?.moneda ?? 'USD',
    integracion: (initial?.integracion ?? []).map((i) => ({
      etapa: i.etapa,
      porcentaje: String(i.porcentaje),
      momento: i.momento,
    })),
    hitosDesembolso: (initial?.hitosDesembolso ?? []).map((h) => ({
      hito: h.hito,
      avanceObra: h.avanceObra,
      fecha: h.fecha?.slice(0, 10) ?? '',
    })),
    salida: initial?.salida ?? '',
    escribania: initial?.escribania ?? '',
    // Alta = borrador: una oportunidad se arma con term sheet, hitos y
    // escribanía cargados en varias sesiones; publicarla a medio hacer sería
    // publicar información financiera incompleta.
    published: initial?.published ?? false,
  };
}

function toInvestment(values: FormValues, initial?: Investment): Investment {
  return {
    slug: values.slug,
    title: values.title.trim(),
    description: values.description.trim(),
    amount: Number(values.amount.replace(',', '.')),
    currency: values.currency,
    estReturn: values.estReturn.trim(),
    termMonths: Number(values.termMonths),
    status: values.status,
    projectSlug: values.projectSlug || null,
    coverImage: values.coverImage.trim(),
    docs: values.docs.map((d) => ({
      name: d.name.trim(),
      url: d.url.trim(),
      sizeLabel: d.sizeLabel.trim(),
      kind: d.kind,
    })),
    published: values.published,
    createdAt: initial?.createdAt ?? new Date().toISOString(),
    fiduciario: {
      nombre: values.fiduciarioNombre.trim(),
      tipo: values.fiduciarioTipo.trim(),
    },
    tipoEstructura: values.tipoEstructura,
    ticketMinimo: Number(values.ticketMinimo.replace(',', '.')),
    moneda: values.moneda,
    integracion: values.integracion.map((i) => ({
      etapa: i.etapa.trim(),
      porcentaje: Number(i.porcentaje.replace(',', '.')),
      momento: i.momento.trim(),
    })),
    hitosDesembolso: values.hitosDesembolso.map((h) => ({
      hito: h.hito.trim(),
      avanceObra: h.avanceObra.trim(),
      fecha: h.fecha,
    })),
    salida: values.salida.trim(),
    escribania: values.escribania.trim(),
  };
}

interface InvestmentFormProps {
  /** Oportunidad a editar; undefined = alta */
  initial?: Investment;
  /** Slugs ya usados (para unicidad); en edición excluir el propio */
  existingSlugs: string[];
  /** Proyectos disponibles para vincular */
  projects: Project[];
  onSubmit: (investment: Investment) => Promise<void>;
  onCancel: () => void;
}

export default function InvestmentForm({
  initial,
  existingSlugs,
  projects,
  onSubmit,
  onCancel,
}: InvestmentFormProps) {
  const schema = useMemo(
    () => buildSchema(existingSlugs.filter((s) => s !== initial?.slug)),
    [existingSlugs, initial?.slug],
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    getFieldState,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(initial),
    mode: 'onBlur',
  });

  const docs = useFieldArray({ control, name: 'docs' });
  const integracion = useFieldArray({ control, name: 'integracion' });
  const hitos = useFieldArray({ control, name: 'hitosDesembolso' });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toInvestment(values, initial));
    } catch (e) {
      setError('root', {
        message: e instanceof Error ? e.message : 'No se pudo guardar la oportunidad.',
      });
    }
  });

  const titleField = register('title', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!initial && !getFieldState('slug').isDirty) {
        setValue('slug', slugify(e.target.value));
      }
    },
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="space-y-8">
      <div className="space-y-4">
        <Field label="Título" htmlFor="i-title" error={errors.title?.message}>
          <input
            id="i-title"
            className={inputCls(!!errors.title)}
            placeholder="Fideicomiso Torre Libertador"
            {...titleField}
          />
        </Field>
        <Field
          label="Slug (URL pública)"
          htmlFor="i-slug"
          error={errors.slug?.message}
          hint={
            initial
              ? 'El slug es la URL pública de la oportunidad y no se modifica.'
              : 'Se genera solo a partir del título; podés ajustarlo.'
          }
        >
          <input
            id="i-slug"
            className={inputCls(!!errors.slug)}
            disabled={Boolean(initial)}
            placeholder="fideicomiso-torre-libertador"
            {...register('slug')}
          />
        </Field>
        <Field label="Descripción" htmlFor="i-desc" error={errors.description?.message}>
          <textarea
            id="i-desc"
            rows={4}
            className={inputCls(!!errors.description)}
            placeholder="Descripción de la oportunidad, estructura del fideicomiso…"
            {...register('description')}
          />
        </Field>
      </div>

      <FormSection title="Condiciones">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Monto mínimo" htmlFor="i-amount" error={errors.amount?.message}>
            <input
              id="i-amount"
              inputMode="decimal"
              className={inputCls(!!errors.amount)}
              placeholder="50000"
              {...register('amount')}
            />
          </Field>
          <Field label="Moneda" htmlFor="i-currency" error={errors.currency?.message}>
            <select
              id="i-currency"
              className={inputCls(!!errors.currency)}
              {...register('currency')}
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </Field>
          <Field label="Plazo (meses)" htmlFor="i-term" error={errors.termMonths?.message}>
            <input
              id="i-term"
              inputMode="numeric"
              className={inputCls(!!errors.termMonths)}
              placeholder="36"
              {...register('termMonths')}
            />
          </Field>
        </div>
        <Field
          label="Retorno estimado"
          htmlFor="i-return"
          error={errors.estReturn?.message}
          hint='Texto tal como se muestra al público, siempre con "estimado" (ej: 14–18% anual estimado en USD).'
        >
          <input
            id="i-return"
            className={inputCls(!!errors.estReturn)}
            placeholder="14–18% anual estimado en USD"
            {...register('estReturn')}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estado" htmlFor="i-status" error={errors.status?.message}>
            <select id="i-status" className={inputCls(!!errors.status)} {...register('status')}>
              {Object.entries(INVESTMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Proyecto vinculado"
            htmlFor="i-project"
            error={errors.projectSlug?.message}
          >
            <select
              id="i-project"
              className={inputCls(!!errors.projectSlug)}
              {...register('projectSlug')}
            >
              <option value="">— Sin proyecto vinculado —</option>
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="pt-1">
          <CheckboxField
            label="Publicada"
            hint="Sin tildar queda como borrador: editable acá, invisible en el sitio."
            {...register('published')}
          />
        </div>
      </FormSection>

      <FormSection title="Estructura del fideicomiso">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Fiduciario"
            htmlFor="i-fid-nombre"
            error={errors.fiduciarioNombre?.message}
          >
            <input
              id="i-fid-nombre"
              className={inputCls(!!errors.fiduciarioNombre)}
              placeholder="Fiduciaria Andes S.A."
              {...register('fiduciarioNombre')}
            />
          </Field>
          <Field
            label="Rol/registro del fiduciario"
            htmlFor="i-fid-tipo"
            error={errors.fiduciarioTipo?.message}
          >
            <input
              id="i-fid-tipo"
              className={inputCls(!!errors.fiduciarioTipo)}
              placeholder="Fiduciario financiero registrado en CNV"
              {...register('fiduciarioTipo')}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Tipo de estructura"
            htmlFor="i-tipo-estructura"
            error={errors.tipoEstructura?.message}
          >
            <select
              id="i-tipo-estructura"
              className={inputCls(!!errors.tipoEstructura)}
              {...register('tipoEstructura')}
            >
              {TIPO_ESTRUCTURA_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Ticket mínimo"
            htmlFor="i-ticket-minimo"
            error={errors.ticketMinimo?.message}
          >
            <input
              id="i-ticket-minimo"
              inputMode="decimal"
              className={inputCls(!!errors.ticketMinimo)}
              placeholder="120000"
              {...register('ticketMinimo')}
            />
          </Field>
          <Field label="Moneda" htmlFor="i-moneda" error={errors.moneda?.message}>
            <select id="i-moneda" className={inputCls(!!errors.moneda)} {...register('moneda')}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </Field>
        </div>
        <Field label="Escribanía" htmlFor="i-escribania" error={errors.escribania?.message}>
          <input
            id="i-escribania"
            className={inputCls(!!errors.escribania)}
            placeholder="Escribanía Roca & Asociados"
            {...register('escribania')}
          />
        </Field>
        <Field
          label="Salida de la inversión"
          htmlFor="i-salida"
          error={errors.salida?.message}
          hint="Cómo y cuándo se realiza el retorno de la inversión."
        >
          <textarea
            id="i-salida"
            rows={3}
            className={inputCls(!!errors.salida)}
            placeholder="Venta de la unidad asignada al inversor una vez escriturada…"
            {...register('salida')}
          />
        </Field>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-ink-soft">
            Integración de aportes
          </p>
          {integracion.fields.length === 0 && (
            <p className="mb-2 text-xs font-light text-ink-soft/70">
              Sin cronograma de integración cargado.
            </p>
          )}
          <ul className="space-y-2">
            {integracion.fields.map((field, i) => (
              <li key={field.id} className="flex items-start gap-2 border-b border-line pb-3 last:border-0">
                <div className="grid flex-1 grid-cols-3 gap-2">
                  <div>
                    <input
                      aria-label={`Etapa de integración ${i + 1}`}
                      className={inputCls(!!errors.integracion?.[i]?.etapa)}
                      placeholder="A la firma del boleto"
                      {...register(`integracion.${i}.etapa`)}
                    />
                  </div>
                  <div>
                    <input
                      aria-label={`Porcentaje de integración ${i + 1}`}
                      inputMode="decimal"
                      className={inputCls(!!errors.integracion?.[i]?.porcentaje)}
                      placeholder="30"
                      {...register(`integracion.${i}.porcentaje`)}
                    />
                  </div>
                  <div>
                    <input
                      aria-label={`Momento de integración ${i + 1}`}
                      className={inputCls(!!errors.integracion?.[i]?.momento)}
                      placeholder="A la firma del boleto de fideicomiso"
                      {...register(`integracion.${i}.momento`)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Quitar etapa de integración"
                  onClick={() => integracion.remove(i)}
                  className="mt-1.5 shrink-0 rounded-sm p-1.5 text-ink-soft transition-colors hover:bg-paper-soft hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          {errors.integracion?.message && (
            <p role="alert" className="mt-1.5 text-xs font-light text-red-600 dark:text-red-400">
              {errors.integracion.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => integracion.append({ etapa: '', porcentaje: '', momento: '' })}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-brand-500 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Agregar etapa
          </button>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-ink-soft">
            Hitos de desembolso
          </p>
          {hitos.fields.length === 0 && (
            <p className="mb-2 text-xs font-light text-ink-soft/70">
              Sin hitos de desembolso cargados.
            </p>
          )}
          <ul className="space-y-2">
            {hitos.fields.map((field, i) => (
              <li key={field.id} className="flex items-start gap-2 border-b border-line pb-3 last:border-0">
                <div className="grid flex-1 grid-cols-3 gap-2">
                  <div>
                    <input
                      aria-label={`Hito ${i + 1}`}
                      className={inputCls(!!errors.hitosDesembolso?.[i]?.hito)}
                      placeholder="Primer desembolso"
                      {...register(`hitosDesembolso.${i}.hito`)}
                    />
                  </div>
                  <div>
                    <input
                      aria-label={`Avance de obra del hito ${i + 1}`}
                      className={inputCls(!!errors.hitosDesembolso?.[i]?.avanceObra)}
                      placeholder="45%"
                      {...register(`hitosDesembolso.${i}.avanceObra`)}
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      aria-label={`Fecha del hito ${i + 1}`}
                      className={inputCls(!!errors.hitosDesembolso?.[i]?.fecha)}
                      {...register(`hitosDesembolso.${i}.fecha`)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Quitar hito de desembolso"
                  onClick={() => hitos.remove(i)}
                  className="mt-1.5 shrink-0 rounded-sm p-1.5 text-ink-soft transition-colors hover:bg-paper-soft hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => hitos.append({ hito: '', avanceObra: '', fecha: '' })}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-brand-500 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Agregar hito
          </button>
        </div>
      </FormSection>

      <FormSection title="Imagen">
        <Controller
          control={control}
          name="coverImage"
          render={({ field }) => (
            <ImageUploader
              label="Imagen de portada"
              hint="Se muestra en la tarjeta de inversión y en el encabezado de la oportunidad."
              value={field.value}
              onChange={field.onChange}
              error={errors.coverImage?.message}
            />
          )}
        />
      </FormSection>

      <FormSection title="Documentos">
        {docs.fields.length === 0 && (
          <p className="text-xs font-light text-ink-soft/70">
            Sin documentos (teaser, contrato marco, flujo proyectado…).
          </p>
        )}
        <ul className="space-y-2">
          {docs.fields.map((field, i) => (
            <li key={field.id} className="flex items-start gap-2 border-b border-line pb-3 last:border-0">
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div>
                  <input
                    aria-label={`Nombre de documento ${i + 1}`}
                    className={inputCls(!!errors.docs?.[i]?.name)}
                    placeholder="Teaser de inversión"
                    {...register(`docs.${i}.name`)}
                  />
                  {errors.docs?.[i]?.name && (
                    <p role="alert" className="mt-1 text-xs font-light text-red-600 dark:text-red-400">
                      {errors.docs[i]?.name?.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    aria-label={`URL de documento ${i + 1}`}
                    className={inputCls(!!errors.docs?.[i]?.url)}
                    placeholder="https://…/teaser.pdf"
                    {...register(`docs.${i}.url`)}
                  />
                  {errors.docs?.[i]?.url && (
                    <p role="alert" className="mt-1 text-xs font-light text-red-600 dark:text-red-400">
                      {errors.docs[i]?.url?.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    aria-label={`Tamaño de documento ${i + 1}`}
                    className={inputCls(!!errors.docs?.[i]?.sizeLabel)}
                    placeholder="1,2 MB"
                    {...register(`docs.${i}.sizeLabel`)}
                  />
                  {errors.docs?.[i]?.sizeLabel && (
                    <p role="alert" className="mt-1 text-xs font-light text-red-600 dark:text-red-400">
                      {errors.docs[i]?.sizeLabel?.message}
                    </p>
                  )}
                </div>
                <div>
                  <select
                    aria-label={`Tipo de documento ${i + 1}`}
                    className={inputCls(!!errors.docs?.[i]?.kind)}
                    {...register(`docs.${i}.kind`)}
                  >
                    {DOCUMENT_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {DOCUMENT_KIND_LABELS[kind]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                aria-label="Quitar documento"
                onClick={() => docs.remove(i)}
                className="mt-1.5 shrink-0 rounded-sm p-1.5 text-ink-soft transition-colors hover:bg-paper-soft hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => docs.append({ name: '', url: '', sizeLabel: '', kind: 'otro' })}
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-brand-500 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Agregar documento
        </button>
      </FormSection>

      {errors.root && (
        <p
          role="alert"
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-light text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          {errors.root.message}
        </p>
      )}

      <FormActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel={initial ? 'Guardar cambios' : 'Crear oportunidad'}
      />
    </form>
  );
}
