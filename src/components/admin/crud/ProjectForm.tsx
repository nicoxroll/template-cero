// Formulario de alta/edición de proyectos (ADMIN-01).
// react-hook-form + zod: nunca guarda datos inválidos. Mantiene los invariantes
// de dominio (timeline con exactamente UNA etapa current, slugs kebab-case únicos).

import { useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  DOCUMENT_KIND_LABELS,
  PROJECT_STAGE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  type DocumentKind,
  type Project,
  type ProjectStageName,
} from '../../../data';

const DOCUMENT_KINDS = Object.keys(DOCUMENT_KIND_LABELS) as DocumentKind[];
import { CheckboxField, Field, FormSection, inputCls } from './FormField';
import MapPickerField from './MapPickerField';
import ImageUploader from './ImageUploader';
import FormActions from './FormActions';

const STAGE_ORDER: ProjectStageName[] = ['planificacion', 'diseno', 'construccion', 'entrega'];

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const numericStr = (invalidMsg: string) =>
  z
    .string()
    .trim()
    .min(1, 'Requerido')
    .refine((v) => !Number.isNaN(Number(v.replace(',', '.'))), invalidMsg);

const stageSchema = z.object({
  done: z.boolean(),
  startedAt: z.string(),
  completedAt: z.string(),
});

function buildSchema(takenSlugs: string[]) {
  return z
    .object({
      name: z.string().trim().min(2, 'Mínimo 2 caracteres'),
      slug: z
        .string()
        .trim()
        .min(1, 'Requerido')
        .regex(SLUG_RE, 'Formato kebab-case (ej: torre-libertador)'),
      description: z.string().trim().min(10, 'Mínimo 10 caracteres'),
      location: z.string().trim().min(2, 'Requerido'),
      type: z.enum(['residencial', 'comercial', 'mixto', 'infraestructura']),
      status: z.enum(['en-pozo', 'en-obra', 'terminado']),
      coverImage: z.string().trim().min(1, 'Requerido'),
      gallery: z.array(z.object({ url: z.string().trim().min(1, 'URL requerida') })),
      specs: z.array(
        z.object({
          label: z.string().trim().min(1, 'Requerido'),
          value: z.string().trim().min(1, 'Requerido'),
        }),
      ),
      docs: z.array(
        z.object({
          name: z.string().trim().min(1, 'Requerido'),
          url: z.string().trim().min(1, 'URL requerida'),
          sizeLabel: z.string().trim().min(1, 'Requerido'),
          kind: z.enum(DOCUMENT_KINDS as [DocumentKind, ...DocumentKind[]]),
        }),
      ),
      lat: numericStr('Latitud inválida').refine(
        (v) => Math.abs(Number(v.replace(',', '.'))) <= 90,
        'Latitud fuera de rango (−90 a 90)',
      ),
      lng: numericStr('Longitud inválida').refine(
        (v) => Math.abs(Number(v.replace(',', '.'))) <= 180,
        'Longitud fuera de rango (−180 a 180)',
      ),
      featured: z.boolean(),
      isRender: z.boolean(),
      published: z.boolean(),
      currentStage: z.enum(['planificacion', 'diseno', 'construccion', 'entrega']),
      stages: z.array(stageSchema).length(STAGE_ORDER.length),
    })
    .superRefine((v, ctx) => {
      if (takenSlugs.includes(v.slug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['slug'],
          message: 'Ya existe un proyecto con ese slug',
        });
      }
      v.stages.forEach((st, i) => {
        // Nunca descartar datos en silencio: fecha de finalización cargada
        // exige la etapa marcada como completada.
        if (st.completedAt && !st.done) {
          ctx.addIssue({
            code: 'custom',
            path: ['stages', i, 'completedAt'],
            message: 'Hay fecha de finalización: marcá la etapa como completada o quitá la fecha',
          });
        }
        if (st.startedAt && st.completedAt && st.completedAt < st.startedAt) {
          ctx.addIssue({
            code: 'custom',
            path: ['stages', i, 'completedAt'],
            message: 'La finalización no puede ser anterior al inicio',
          });
        }
      });
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function toDefaults(initial?: Project): FormValues {
  return {
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    location: initial?.location ?? '',
    type: initial?.type ?? 'residencial',
    status: initial?.status ?? 'en-pozo',
    coverImage: initial?.coverImage ?? '',
    gallery: (initial?.gallery ?? []).map((url) => ({ url })),
    specs: initial?.specs ?? [],
    docs: initial?.docs ?? [],
    lat: initial ? String(initial.coords.lat) : '',
    lng: initial ? String(initial.coords.lng) : '',
    featured: initial?.featured ?? false,
    isRender: initial?.isRender ?? false,
    // Alta = borrador: un proyecto nuevo se carga en varias sesiones (fotos,
    // planos, specs) y no debería aparecer a medio cargar en el sitio.
    published: initial?.published ?? false,
    currentStage: initial?.timeline.find((t) => t.current)?.stage ?? 'planificacion',
    stages: STAGE_ORDER.map((stage) => {
      const st = initial?.timeline.find((t) => t.stage === stage);
      return {
        done: Boolean(st?.completedAt),
        startedAt: st?.startedAt?.slice(0, 10) ?? '',
        completedAt: st?.completedAt?.slice(0, 10) ?? '',
      };
    }),
  };
}

function toProject(values: FormValues, initial?: Project): Project {
  const today = new Date().toISOString().slice(0, 10);
  return {
    slug: values.slug,
    name: values.name.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    type: values.type,
    status: values.status,
    coverImage: values.coverImage.trim(),
    gallery: values.gallery.map((g) => g.url.trim()),
    specs: values.specs.map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
    docs: values.docs.map((d) => ({
      name: d.name.trim(),
      url: d.url.trim(),
      sizeLabel: d.sizeLabel.trim(),
      kind: d.kind,
    })),
    coords: {
      lat: Number(values.lat.replace(',', '.')),
      lng: Number(values.lng.replace(',', '.')),
    },
    featured: values.featured,
    isRender: values.isRender,
    published: values.published,
    timeline: STAGE_ORDER.map((stage, i) => {
      const st = values.stages[i];
      const prev = initial?.timeline.find((t) => t.stage === stage);
      return {
        stage,
        current: stage === values.currentStage,
        ...(st.startedAt ? { startedAt: st.startedAt } : {}),
        ...(st.done ? { completedAt: st.completedAt || today } : {}),
        ...(prev?.notes ? { notes: prev.notes } : {}),
      };
    }),
    createdAt: initial?.createdAt ?? new Date().toISOString(),
  };
}

interface ProjectFormProps {
  /** Proyecto a editar; undefined = alta */
  initial?: Project;
  /** Slugs ya usados (para unicidad); en edición excluir el propio */
  existingSlugs: string[];
  onSubmit: (project: Project) => Promise<void>;
  onCancel: () => void;
}

export default function ProjectForm({
  initial,
  existingSlugs,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
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
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(initial),
    mode: 'onBlur',
  });

  const specs = useFieldArray({ control, name: 'specs' });
  const docs = useFieldArray({ control, name: 'docs' });

  // El picker de mapa es un control controlado (no un <input> registrado): lee
  // lat/lng vía watch y los escribe con setValue. `location` alimenta la
  // sugerencia del buscador de direcciones.
  const latValue = watch('lat');
  const lngValue = watch('lng');
  const locationValue = watch('location');

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toProject(values, initial));
    } catch (e) {
      setError('root', {
        message: e instanceof Error ? e.message : 'No se pudo guardar el proyecto.',
      });
    }
  });

  const nameField = register('name', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      // Auto-slug solo en alta y mientras el admin no haya tocado el slug a mano
      if (!initial && !getFieldState('slug').isDirty) {
        setValue('slug', slugify(e.target.value));
      }
    },
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="space-y-8">
      {/* -------------------------------------------------- Datos generales */}
      <div className="space-y-4">
        <Field label="Nombre" htmlFor="p-name" error={errors.name?.message}>
          <input
            id="p-name"
            className={inputCls(!!errors.name)}
            placeholder="Torre Libertador"
            {...nameField}
          />
        </Field>
        <Field
          label="Slug (URL pública)"
          htmlFor="p-slug"
          error={errors.slug?.message}
          hint={
            initial
              ? 'El slug es la URL pública del proyecto y no se modifica.'
              : 'Se genera solo a partir del nombre; podés ajustarlo.'
          }
        >
          <input
            id="p-slug"
            className={inputCls(!!errors.slug)}
            disabled={Boolean(initial)}
            placeholder="torre-libertador"
            {...register('slug')}
          />
        </Field>
        <Field label="Descripción" htmlFor="p-desc" error={errors.description?.message}>
          <textarea
            id="p-desc"
            rows={4}
            className={inputCls(!!errors.description)}
            placeholder="Descripción institucional del proyecto…"
            {...register('description')}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ubicación" htmlFor="p-loc" error={errors.location?.message}>
            <input
              id="p-loc"
              className={inputCls(!!errors.location)}
              placeholder="Palermo, CABA"
              {...register('location')}
            />
          </Field>
          <Field label="Tipo" htmlFor="p-type" error={errors.type?.message}>
            <select id="p-type" className={inputCls(!!errors.type)} {...register('type')}>
              {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado" htmlFor="p-status" error={errors.status?.message}>
            <select id="p-status" className={inputCls(!!errors.status)} {...register('status')}>
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-3 pt-1 sm:grid-cols-2">
          <CheckboxField
            label="Publicado"
            hint="Sin tildar queda como borrador: editable acá, invisible en el sitio."
            {...register('published')}
          />
          <CheckboxField
            label="Proyecto destacado"
            hint="Aparece en la portada del sitio."
            {...register('featured')}
          />
          <CheckboxField
            label="Imágenes son renders"
            hint="Se etiquetan como render/concepto en el sitio público."
            {...register('isRender')}
          />
        </div>
      </div>

      {/* ---------------------------------------------------------- Imágenes */}
      <FormSection title="Imágenes">
        <Controller
          control={control}
          name="coverImage"
          render={({ field }) => (
            <ImageUploader
              label="Imagen de portada"
              hint="Se muestra en la card del proyecto y en el encabezado del detalle."
              value={field.value}
              onChange={field.onChange}
              error={errors.coverImage?.message}
            />
          )}
        />

        <div className="pt-2">
          <Controller
            control={control}
            name="gallery"
            render={({ field }) => {
              const urls = (field.value || []).map((g) => g.url);
              return (
                <ImageUploader
                  label="Galería de imágenes"
                  hint="Arrastrá múltiples fotos para la galería del proyecto. Podés reordenarlas y verlas en tamaño completo."
                  multiple
                  value={urls}
                  onChange={(nextUrls: string[]) => {
                    field.onChange(nextUrls.map((url) => ({ url })));
                  }}
                  error={errors.gallery?.root?.message}
                />
              );
            }}
          />
        </div>
      </FormSection>

      {/* ---------------------------------------------------- Especificaciones */}
      <FormSection title="Especificaciones">
        {specs.fields.length === 0 && (
          <p className="text-xs font-light text-ink-soft/70">
            Sin especificaciones cargadas (ej: Superficie — 12.400 m²).
          </p>
        )}
        <ul className="space-y-2">
          {specs.fields.map((field, i) => (
            <li key={field.id} className="flex items-start gap-2">
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div>
                  <input
                    aria-label={`Etiqueta de especificación ${i + 1}`}
                    className={inputCls(!!errors.specs?.[i]?.label)}
                    placeholder="Superficie"
                    {...register(`specs.${i}.label`)}
                  />
                  {errors.specs?.[i]?.label && (
                    <p role="alert" className="mt-1 text-xs font-light text-red-600 dark:text-red-400">
                      {errors.specs[i]?.label?.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    aria-label={`Valor de especificación ${i + 1}`}
                    className={inputCls(!!errors.specs?.[i]?.value)}
                    placeholder="12.400 m²"
                    {...register(`specs.${i}.value`)}
                  />
                  {errors.specs?.[i]?.value && (
                    <p role="alert" className="mt-1 text-xs font-light text-red-600 dark:text-red-400">
                      {errors.specs[i]?.value?.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Quitar especificación"
                onClick={() => specs.remove(i)}
                className="mt-1.5 shrink-0 rounded-sm p-1.5 text-ink-soft transition-colors hover:bg-paper-soft hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => specs.append({ label: '', value: '' })}
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-brand-500 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Agregar especificación
        </button>
      </FormSection>

      {/* ------------------------------------------------------- Documentos */}
      <FormSection title="Documentos">
        {docs.fields.length === 0 && (
          <p className="text-xs font-light text-ink-soft/70">
            Sin documentos (brochure, planos, memoria descriptiva…).
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
                    placeholder="Brochure comercial"
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
                    placeholder="https://…/brochure.pdf"
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

      {/* -------------------------------------------------------- Ubicación */}
      <FormSection title="Ubicación (mapa)">
        <MapPickerField
          lat={latValue}
          lng={lngValue}
          latError={errors.lat?.message}
          lngError={errors.lng?.message}
          locationHint={locationValue}
          onChange={(nextLat, nextLng) => {
            setValue('lat', nextLat, { shouldValidate: true, shouldDirty: true });
            setValue('lng', nextLng, { shouldValidate: true, shouldDirty: true });
          }}
        />
      </FormSection>

      {/* ---------------------------------------------------------- Timeline */}
      <FormSection title="Etapas del proyecto">
        <p className="text-xs font-light text-ink-soft/70">
          Marcá las etapas completadas y elegí la etapa actual (siempre una sola).
        </p>
        <ul className="divide-y divide-line border border-line">
          {STAGE_ORDER.map((stage, i) => (
            <li key={stage} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium uppercase tracking-widest text-ink">
                  {PROJECT_STAGE_LABELS[stage]}
                </span>
                <div className="flex items-center gap-5">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-light text-ink-soft">
                    <input
                      type="radio"
                      value={stage}
                      className="h-3.5 w-3.5 cursor-pointer accent-brand-900 dark:accent-brand-500"
                      {...register('currentStage')}
                    />
                    Etapa actual
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-light text-ink-soft">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 cursor-pointer accent-brand-900 dark:accent-brand-500"
                      {...register(`stages.${i}.done`)}
                    />
                    Completada
                  </label>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-light uppercase tracking-widest text-ink-soft/70">
                    Inicio
                  </span>
                  <input
                    type="date"
                    className={inputCls(false)}
                    {...register(`stages.${i}.startedAt`)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-light uppercase tracking-widest text-ink-soft/70">
                    Finalización
                  </span>
                  <input
                    type="date"
                    className={inputCls(!!errors.stages?.[i]?.completedAt)}
                    {...register(`stages.${i}.completedAt`)}
                  />
                  {errors.stages?.[i]?.completedAt && (
                    <p role="alert" className="mt-1 text-xs font-light text-red-600 dark:text-red-400">
                      {errors.stages[i]?.completedAt?.message}
                    </p>
                  )}
                </label>
              </div>
            </li>
          ))}
        </ul>
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
        submitLabel={initial ? 'Guardar cambios' : 'Crear proyecto'}
      />
    </form>
  );
}
