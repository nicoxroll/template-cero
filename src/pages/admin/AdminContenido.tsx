// Contenido institucional editable: Equipo (CONF-02), Servicios (SERV-01) y Secciones extra.

import { useCallback, useEffect, useState, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  Video,
  Upload,
  Layers,
  Sparkles,
  Sliders,
  Play,
} from 'lucide-react';
import {
  faqRepo,
  serviceRepo,
  teamRepo,
  customSectionRepo,
  siteContentRepo,
  SITE_CONTENT_UPDATED_EVENT,
  CUSTOM_SECTIONS_UPDATED_EVENT,
  type FaqItem,
  type Service,
  type TeamMember,
  type CustomSection,
} from '../../data';
import { uploadVideo } from '../../data/storage';
import { usePageMeta } from '../../lib/usePageMeta';
import { Skeleton, useMinVisible } from '../../components/ui/Skeleton';
import AdminShell from '../../components/admin/shell/AdminShell';
import SidePanel from '../../components/admin/crud/SidePanel';
import ConfirmDialog from '../../components/admin/crud/ConfirmDialog';
import { Field, inputCls } from '../../components/admin/crud/FormField';
import ImageUploader from '../../components/admin/crud/ImageUploader';
import SharedFormActions from '../../components/admin/crud/FormActions';
import { useToast } from '../../components/admin/crud/Toast';

type Tab = 'equipo' | 'servicios' | 'faq' | 'secciones';

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ------------------------------------------------------------- Formularios */

const memberSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres'),
  role: z.string().trim().min(2, 'Requerido'),
  photo: z.string().trim().min(1, 'Requerido'),
  bio: z.string().trim().min(10, 'Mínimo 10 caracteres'),
});
type MemberValues = z.infer<typeof memberSchema>;

function MemberForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: TeamMember;
  onSubmit: (values: MemberValues) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MemberValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: initial?.name ?? '',
      role: initial?.role ?? '',
      photo: initial?.photo ?? '',
      bio: initial?.bio ?? '',
    },
    mode: 'onBlur',
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'No se pudo guardar.' });
    }
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="space-y-4">
      <Field label="Nombre" htmlFor="m-name" error={errors.name?.message}>
        <input id="m-name" className={inputCls(!!errors.name)} placeholder="María Fernández" {...register('name')} />
      </Field>
      <Field label="Rol" htmlFor="m-role" error={errors.role?.message}>
        <input id="m-role" className={inputCls(!!errors.role)} placeholder="Directora de Obra" {...register('role')} />
      </Field>
      <Controller
        control={control}
        name="photo"
        render={({ field }) => (
          <ImageUploader
            label="Foto del integrante"
            hint="Retrato vertical (3:4) para la sección Quiénes Somos."
            value={field.value}
            onChange={field.onChange}
            error={errors.photo?.message}
          />
        )}
      />
      <Field label="Bio" htmlFor="m-bio" error={errors.bio?.message}>
        <textarea id="m-bio" rows={4} className={inputCls(!!errors.bio)} {...register('bio')} />
      </Field>

      {errors.root && (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-light text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {errors.root.message}
        </p>
      )}

      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} editing={Boolean(initial)} />
    </form>
  );
}

const serviceSchema = z.object({
  title: z.string().trim().min(2, 'Mínimo 2 caracteres'),
  slug: z.string().trim().min(1, 'Requerido').regex(SLUG_RE, 'Formato kebab-case (ej: direccion-de-obra)'),
  description: z.string().trim().min(10, 'Mínimo 10 caracteres'),
  image: z.string().trim().min(1, 'Requerido'),
});
type ServiceValues = z.infer<typeof serviceSchema>;

function ServiceForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Service;
  onSubmit: (values: ServiceValues) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getFieldState,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: initial?.title ?? '',
      slug: initial?.slug ?? '',
      description: initial?.description ?? '',
      image: initial?.image ?? '',
    },
    mode: 'onBlur',
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'No se pudo guardar.' });
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
    <form onSubmit={(e) => void submit(e)} noValidate className="space-y-4">
      <Field label="Título" htmlFor="s-title" error={errors.title?.message}>
        <input id="s-title" className={inputCls(!!errors.title)} placeholder="Dirección de obra" {...titleField} />
      </Field>
      <Field label="Slug" htmlFor="s-slug" error={errors.slug?.message}>
        <input id="s-slug" className={inputCls(!!errors.slug)} placeholder="direccion-de-obra" {...register('slug')} />
      </Field>
      <Field label="Descripción" htmlFor="s-desc" error={errors.description?.message}>
        <textarea id="s-desc" rows={4} className={inputCls(!!errors.description)} {...register('description')} />
      </Field>
      <Controller
        control={control}
        name="image"
        render={({ field }) => (
          <ImageUploader
            label="Imagen del servicio"
            hint="Se muestra en la tarjeta del servicio en la portada (conviene apaisada)."
            value={field.value}
            onChange={field.onChange}
            error={errors.image?.message}
          />
        )}
      />

      {errors.root && (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-light text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {errors.root.message}
        </p>
      )}

      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} editing={Boolean(initial)} />
    </form>
  );
}

// El mínimo de 15 en la respuesta no es capricho: este FAQ contesta preguntas
// sobre riesgo y retorno de una inversión, y una respuesta de tres palabras a
// "¿qué riesgos tiene?" es peor que no tener la pregunta.
const faqSchema = z.object({
  question: z.string().trim().min(8, 'Mínimo 8 caracteres'),
  answer: z.string().trim().min(15, 'Mínimo 15 caracteres'),
});
type FaqValues = z.infer<typeof faqSchema>;

function FaqForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: FaqItem;
  onSubmit: (values: FaqValues) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FaqValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: initial?.question ?? '',
      answer: initial?.answer ?? '',
    },
    mode: 'onBlur',
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'No se pudo guardar.' });
    }
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="space-y-4">
      <Field label="Pregunta" htmlFor="f-question" error={errors.question?.message}>
        <input
          id="f-question"
          className={inputCls(!!errors.question)}
          placeholder="¿Qué es un fideicomiso al costo?"
          {...register('question')}
        />
      </Field>
      <Field label="Respuesta" htmlFor="f-answer" error={errors.answer?.message}>
        <textarea id="f-answer" rows={8} className={inputCls(!!errors.answer)} {...register('answer')} />
      </Field>

      {errors.root && (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-light text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {errors.root.message}
        </p>
      )}

      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} editing={Boolean(initial)} />
    </form>
  );
}

const customSectionSchema = z.object({
  title: z.string().trim().min(2, 'Mínimo 2 caracteres'),
  kicker: z.string().trim().optional(),
  content: z.string().trim().min(5, 'Mínimo 5 caracteres'),
  layout: z.enum(['split-balanced', 'split-media-large', 'full-width', 'compact']),
  theme: z.enum(['light', 'dark']),
  mediaType: z.enum(['image', 'video', 'none']),
  mediaUrl: z.string().trim().optional(),
  mediaAlt: z.string().trim().optional(),
  autoplay: z.boolean(),
  muted: z.boolean(),
  loop: z.boolean(),
  controls: z.boolean(),
  aspectRatio: z.enum(['16/9', '21/9', '4/3', '1/1', 'auto']),
  height: z.enum(['compact', 'medium', 'immersive']),
  ctaText: z.string().trim().optional(),
  ctaUrl: z.string().trim().optional(),
  visible: z.boolean(),
});
type CustomSectionFormValues = z.infer<typeof customSectionSchema>;

function CustomSectionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: CustomSection;
  onSubmit: (values: CustomSectionFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomSectionFormValues>({
    resolver: zodResolver(customSectionSchema),
    defaultValues: {
      title: initial?.title ?? '',
      kicker: initial?.kicker ?? '',
      content: initial?.content ?? '',
      layout: initial?.layout ?? 'split-balanced',
      theme: (initial?.theme === 'dark' || initial?.theme === 'ink') ? 'dark' : 'light',
      mediaType: (initial?.mediaType === 'image' || initial?.mediaType === 'video') ? initial.mediaType : 'video',
      mediaUrl: initial?.mediaUrl ?? '',
      mediaAlt: initial?.mediaAlt ?? '',
      autoplay: initial?.videoConfig?.autoplay ?? true,
      muted: initial?.videoConfig?.muted ?? true,
      loop: initial?.videoConfig?.loop ?? true,
      controls: initial?.videoConfig?.controls ?? true,
      aspectRatio: initial?.videoConfig?.aspectRatio ?? '16/9',
      height: initial?.videoConfig?.height ?? 'medium',
      ctaText: initial?.ctaText ?? '',
      ctaUrl: initial?.ctaUrl ?? initial?.ctaLink ?? '',
      visible: initial?.visible ?? initial?.published ?? true,
    },
    mode: 'onBlur',
  });

  const mediaType = watch('mediaType');
  const mediaUrl = watch('mediaUrl');
  const isMuted = watch('muted');
  const isAutoplay = watch('autoplay');

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setVideoUploadError(null);
    try {
      const url = await uploadVideo(file);
      setValue('mediaUrl', url, { shouldValidate: true, shouldDirty: true });
    } catch (err) {
      setVideoUploadError(err instanceof Error ? err.message : 'Error al subir el video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const submit = handleSubmit(async (values: CustomSectionFormValues) => {
    try {
      await onSubmit(values);
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'No se pudo guardar la sección.' });
    }
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
          Texto y Contenido
        </h4>
        <Field label="Kicker / Subtítulo superior" htmlFor="cs-kicker" hint="Texto pequeño arriba del título (ej: Tecnología & Innovación)">
          <input id="cs-kicker" className={inputCls(false)} placeholder="Ej: Procesos & Calidad" {...register('kicker')} />
        </Field>
        <Field label="Título de la sección" htmlFor="cs-title" error={errors.title?.message}>
          <input id="cs-title" className={inputCls(!!errors.title)} placeholder="Ej: Obras diseñadas para durar" {...register('title')} />
        </Field>
        <Field label="Texto descriptivo" htmlFor="cs-content" error={errors.content?.message} hint="Párrafos explicativos sobre este eje o propuesta.">
          <textarea id="cs-content" rows={4} className={inputCls(!!errors.content)} placeholder="Describa el contenido de la sección..." {...register('content')} />
        </Field>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
          Botón de Acción (Opcional)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Texto del botón" htmlFor="cs-cta-text">
            <input id="cs-cta-text" className={inputCls(false)} placeholder="Ej: Conocer más" {...register('ctaText')} />
          </Field>
          <Field label="Enlace del botón" htmlFor="cs-cta-url">
            <input id="cs-cta-url" className={inputCls(false)} placeholder="Ej: /proyectos o #contacto" {...register('ctaUrl')} />
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
          Diseño y Estilo Visual
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Disposición (Layout)" htmlFor="cs-layout">
            <select id="cs-layout" className={inputCls(false)} {...register('layout')}>
              <option value="split-balanced">50% Texto / 50% Media (Equilibrado)</option>
              <option value="split-media-large">35% Texto / 65% Media (Destacado)</option>
              <option value="full-width">Ancho Completo Inmersivo</option>
              <option value="compact">Centrado Compacto Editorial</option>
            </select>
          </Field>
          <Field label="Esquema de Color (Tema)" htmlFor="cs-theme">
            <select id="cs-theme" className={inputCls(false)} {...register('theme')}>
              <option value="light">Fondo Claro Institucional (Gris suave)</option>
              <option value="dark">Fondo Oscuro Premium (Negro elegante)</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft border-b border-line pb-2 flex items-center justify-between">
          <span>Elemento Multimedia</span>
          <span className="text-[0.65rem] font-normal text-brand-600 dark:text-brand-400">Videos optimizados</span>
        </h4>
        <Field label="Tipo de multimedia" htmlFor="cs-media-type">
          <select id="cs-media-type" className={inputCls(false)} {...register('mediaType')}>
            <option value="video">Video (MP4/WebM subido o URL externa)</option>
            <option value="image">Imagen Fotográfica</option>
            <option value="none">Sin multimedia (Solo texto y botón)</option>
          </select>
        </Field>

        {mediaType === 'image' && (
          <div className="space-y-4 border border-line p-4 bg-paper-soft rounded">
            <Controller
              control={control}
              name="mediaUrl"
              render={({ field }) => (
                <Field label="Foto de la sección" htmlFor="cs-image-uploader" error={errors.mediaUrl?.message}>
                  <ImageUploader value={field.value ?? ''} onChange={field.onChange} />
                </Field>
              )}
            />
            <Field label="Descripción de la imagen (alt)" htmlFor="cs-media-alt">
              <input id="cs-media-alt" className={inputCls(false)} placeholder="Ej: Obra en construcción en Barrio Norte" {...register('mediaAlt')} />
            </Field>
          </div>
        )}

        {mediaType === 'video' && (
          <div className="space-y-4 border border-line p-4 bg-paper-soft rounded">
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-widest text-ink-soft">
                Archivo de Video
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  ref={videoFileRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  className="hidden"
                  onChange={handleVideoFileChange}
                />
                <button
                  type="button"
                  disabled={uploadingVideo}
                  onClick={() => videoFileRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-brand-900 text-white hover:bg-brand-700 px-4 py-2.5 text-xs font-medium uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingVideo ? 'Subiendo video…' : 'Subir archivo (hasta 50MB)'}
                </button>
                <span className="text-xs text-ink-soft">Formatos: MP4, WebM</span>
              </div>
              {videoUploadError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{videoUploadError}</p>
              )}
            </div>

            <Field
              label="O enlace directo de video (URL)"
              htmlFor="cs-video-url"
              hint="Puede ingresar una URL directa de video MP4/WebM o archivo alojado."
            >
              <input
                id="cs-video-url"
                className={inputCls(false)}
                placeholder="https://.../video.mp4"
                {...register('mediaUrl')}
              />
            </Field>

            {mediaUrl && (
              <div className="border border-line bg-paper p-3 rounded">
                <p className="text-[0.65rem] font-mono uppercase text-ink-soft mb-2 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-brand-500" /> Vista previa del video:
                </p>
                <div className="relative aspect-video max-h-48 overflow-hidden rounded bg-black flex items-center justify-center">
                  <video
                    src={mediaUrl}
                    controls
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-line/60 space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-brand-500" /> Configuración de Reproducción
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Tamaño / Altura del Video" htmlFor="cs-video-height">
                  <select id="cs-video-height" className={inputCls(false)} {...register('height')}>
                    <option value="compact">Compacto (~40vh)</option>
                    <option value="medium">Medio (~60vh)</option>
                    <option value="immersive">Inmersivo Pantalla Completa (~78vh)</option>
                  </select>
                </Field>
                <Field label="Relación de Aspecto (Proporción)" htmlFor="cs-video-ratio">
                  <select id="cs-video-ratio" className={inputCls(false)} {...register('aspectRatio')}>
                    <option value="16/9">16:9 Panorámico Estándar</option>
                    <option value="21/9">21:9 Ultra-Wide Cinemático</option>
                    <option value="4/3">4:3 Clásico</option>
                    <option value="1/1">1:1 Cuadrado</option>
                    <option value="auto">Automático</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-start gap-2.5 p-2.5 border border-line bg-paper rounded cursor-pointer hover:bg-paper-soft transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded accent-brand-500"
                    {...register('autoplay')}
                  />
                  <div>
                    <span className="text-xs font-medium text-ink block">Autoplay al scrollear</span>
                    <span className="text-[0.7rem] text-ink-soft block leading-tight">
                      Se reproduce solo cuando entra en pantalla
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 border border-line bg-paper rounded cursor-pointer hover:bg-paper-soft transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded accent-brand-500"
                    {...register('muted')}
                  />
                  <div>
                    <span className="text-xs font-medium text-ink block">Silenciado por defecto</span>
                    <span className="text-[0.7rem] text-ink-soft block leading-tight">
                      Requerido por navegadores para autoplay
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 border border-line bg-paper rounded cursor-pointer hover:bg-paper-soft transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded accent-brand-500"
                    {...register('loop')}
                  />
                  <div>
                    <span className="text-xs font-medium text-ink block">Bucle continuo (Loop)</span>
                    <span className="text-[0.7rem] text-ink-soft block leading-tight">
                      Vuelve a empezar cuando termina
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 border border-line bg-paper rounded cursor-pointer hover:bg-paper-soft transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded accent-brand-500"
                    {...register('controls')}
                  />
                  <div>
                    <span className="text-xs font-medium text-ink block">Controles visibles</span>
                    <span className="text-[0.7rem] text-ink-soft block leading-tight">
                      Play/pausa y barra de progreso
                    </span>
                  </div>
                </label>
              </div>

              {!isMuted && isAutoplay && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-700 dark:text-amber-300">
                  <strong>Política de audio:</strong> Los navegadores exigen que los videos en reproducción automática inicien silenciados. El reproductor comenzará en silencio y mostrará un botón flotante <em>"Activar sonido"</em> para que el visitante active el audio con un clic.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border border-line p-4 bg-paper rounded">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-brand-500"
            {...register('visible')}
          />
          <div>
            <span className="text-sm font-medium text-ink block">Sección visible en la portada</span>
            <span className="text-xs text-ink-soft block">
              Si está desmarcada, la sección no se mostrará a los visitantes del sitio.
            </span>
          </div>
        </label>
      </div>

      {errors.root && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.root.message}</p>
      )}

      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} editing={Boolean(initial)} />
    </form>
  );
}

/** Adaptador del `editing` que usan los tres formularios de esta página al
 * `submitLabel` del componente compartido. */
function FormActions({
  isSubmitting,
  onCancel,
  editing,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  editing: boolean;
}) {
  return (
    <SharedFormActions
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      submitLabel={editing ? 'Guardar cambios' : 'Crear'}
    />
  );
}

/* ------------------------------------------------------------------ Página */

function ListSkeleton() {
  return (
    <div aria-hidden className="divide-y divide-line border border-line bg-paper">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-12 w-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Botones de orden: la grilla pública respeta el orden del repositorio, así
 * que subir/bajar acá es literalmente reordenar la sección del sitio. */
function OrderButtons({
  index,
  total,
  label,
  onMove,
}: {
  index: number;
  total: number;
  label: string;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <span className="flex flex-col">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        aria-label={`Subir ${label}`}
        className="p-0.5 text-ink-soft transition-colors hover:text-brand-700 disabled:opacity-25 disabled:hover:text-ink-soft dark:hover:text-brand-300"
      >
        <ArrowUp className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        onClick={() => onMove(index, index + 1)}
        aria-label={`Bajar ${label}`}
        className="p-0.5 text-ink-soft transition-colors hover:text-brand-700 disabled:opacity-25 disabled:hover:text-ink-soft dark:hover:text-brand-300"
      >
        <ArrowDown className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  );
}

type PanelState =
  | { kind: 'member'; member?: TeamMember }
  | { kind: 'service'; service?: Service }
  | { kind: 'faq'; item?: FaqItem }
  | { kind: 'section'; section?: CustomSection }
  | null;

type DeleteState =
  | { kind: 'member'; member: TeamMember }
  | { kind: 'service'; service: Service }
  | { kind: 'faq'; item: FaqItem }
  | { kind: 'section'; section: CustomSection }
  | null;

export default function AdminContenido() {
  usePageMeta({ title: 'Admin — Contenido' });

  const [tab, setTab] = useState<Tab>('equipo');
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [faq, setFaq] = useState<FaqItem[] | null>(null);
  const [customSections, setCustomSections] = useState<CustomSection[] | null>(null);
  const [panel, setPanel] = useState<PanelState>(null);
  const [toDelete, setToDelete] = useState<DeleteState>(null);
  const [deleting, setDeleting] = useState(false);
  const { toastEl, showToast } = useToast();

  const [teamVisible, setTeamVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['quienes.teamVisible'] === 'true';
  });
  const [serviciosVisible, setServiciosVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['servicios.visible'] !== 'false';
  });
  const [faqVisible, setFaqVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['inversiones.faq.visible'] !== 'false';
  });

  useEffect(() => {
    const onUpdate = () => {
      const sync = siteContentRepo.getSync();
      setTeamVisible(sync['quienes.teamVisible'] === 'true');
      setServiciosVisible(sync['servicios.visible'] !== 'false');
      setFaqVisible(sync['inversiones.faq.visible'] !== 'false');
    };
    window.addEventListener(SITE_CONTENT_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(SITE_CONTENT_UPDATED_EVENT, onUpdate);
  }, []);

  useEffect(() => {
    const onSectionUpdate = () => {
      customSectionRepo.list().then((items) => setCustomSections(items)).catch(() => {});
    };
    window.addEventListener(CUSTOM_SECTIONS_UPDATED_EVENT, onSectionUpdate);
    return () => window.removeEventListener(CUSTOM_SECTIONS_UPDATED_EVENT, onSectionUpdate);
  }, []);

  const handleToggleTeamVisibility = async () => {
    const next = !teamVisible;
    setTeamVisible(next);
    await siteContentRepo.updateMany({ 'quienes.teamVisible': String(next) });
    showToast(
      next
        ? 'Sección de equipo ahora es visible en el sitio web.'
        : 'Sección de equipo oculta en el sitio web.',
    );
  };

  const handleToggleServiciosVisibility = async () => {
    const next = !serviciosVisible;
    setServiciosVisible(next);
    await siteContentRepo.updateMany({ 'servicios.visible': String(next) });
    showToast(
      next
        ? 'Sección de servicios ahora es visible en la portada.'
        : 'Sección de servicios oculta en la portada.',
    );
  };

  const handleToggleFaqVisibility = async () => {
    const next = !faqVisible;
    setFaqVisible(next);
    await siteContentRepo.updateMany({ 'inversiones.faq.visible': String(next) });
    showToast(
      next
        ? 'Preguntas frecuentes ahora visibles en Inversiones.'
        : 'Preguntas frecuentes ocultas en Inversiones.',
    );
  };

  const handleToggleCustomSectionVisibility = async (sec: CustomSection) => {
    const isCurrentlyVisible = sec.visible ?? sec.published;
    const next = !isCurrentlyVisible;
    await customSectionRepo.update(sec.id, { published: next, visible: next });
    showToast(
      next
        ? `Sección "${sec.title}" ahora es visible en la portada.`
        : `Sección "${sec.title}" oculta en la portada.`,
    );
    await load();
  };

  const loading = team === null || services === null || faq === null || customSections === null;
  const showSkeleton = useMinVisible(loading);

  const load = useCallback(async () => {
    const [t, s, f, cs] = await Promise.all([
      teamRepo.list(),
      serviceRepo.list(),
      faqRepo.list(),
      customSectionRepo.list(),
    ]);
    setTeam(t);
    setServices(s);
    setFaq(f);
    setCustomSections(cs);
  }, []);

  useEffect(() => {
    let alive = true;
    void Promise.all([
      teamRepo.list(),
      serviceRepo.list(),
      faqRepo.list(),
      customSectionRepo.list(),
    ])
      .then(([t, s, f, cs]) => {
        if (!alive) return;
        setTeam(t);
        setServices(s);
        setFaq(f);
        setCustomSections(cs);
      })
      .catch(() => {
        if (!alive) return;
        setTeam([]);
        setServices([]);
        setFaq([]);
        setCustomSections([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const move = async (kind: Tab, from: number, to: number) => {
    const list: { id: string }[] | null =
      kind === 'equipo'
        ? team
        : kind === 'servicios'
          ? services
          : kind === 'faq'
            ? faq
            : customSections;
    if (!list || to < 0 || to >= list.length) return;
    const ids: string[] = list.map((x: { id: string }) => x.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);

    const sortByIds = <T extends { id: string }>(prev: T[] | null): T[] | null =>
      prev ? ids.map((id: string) => prev.find((x: T) => x.id === id)!) : prev;

    try {
      if (kind === 'equipo') {
        setTeam(sortByIds);
        await teamRepo.reorder(ids);
      } else if (kind === 'servicios') {
        setServices(sortByIds);
        await serviceRepo.reorder(ids);
      } else if (kind === 'faq') {
        setFaq(sortByIds);
        await faqRepo.reorder(ids);
      } else {
        setCustomSections(sortByIds);
        await customSectionRepo.reorder(ids);
      }
    } catch {
      if (kind === 'equipo') setTeam(list as TeamMember[]);
      else if (kind === 'servicios') setServices(list as Service[]);
      else if (kind === 'faq') setFaq(list as FaqItem[]);
      else setCustomSections(list as CustomSection[]);
      showToast('No se pudo guardar el nuevo orden.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      if (toDelete.kind === 'member') {
        await teamRepo.remove(toDelete.member.id);
        showToast('Integrante eliminado.');
      } else if (toDelete.kind === 'service') {
        await serviceRepo.remove(toDelete.service.id);
        showToast('Servicio eliminado.');
      } else if (toDelete.kind === 'faq') {
        await faqRepo.remove(toDelete.item.id);
        showToast('Pregunta eliminada.');
      } else {
        await customSectionRepo.remove(toDelete.section.id);
        showToast('Sección eliminada.');
      }
      setToDelete(null);
      await load();
    } catch {
      showToast('No se pudo eliminar.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'equipo', label: 'Equipo', count: team?.length ?? 0 },
    { key: 'servicios', label: 'Servicios', count: services?.length ?? 0 },
    { key: 'faq', label: 'Preguntas frecuentes', count: faq?.length ?? 0 },
    { key: 'secciones', label: 'Secciones extra', count: customSections?.length ?? 0 },
  ];

  const NUEVO: Record<Tab, string> = {
    equipo: 'Nuevo integrante',
    servicios: 'Nuevo servicio',
    faq: 'Nueva pregunta',
    secciones: 'Nueva sección',
  };

  return (
    <AdminShell
      title="Contenido"
      subtitle="Equipo, servicios, preguntas frecuentes y secciones dinámicas de la portada. Los cambios se ven al recargar."
      actions={
        <button
          type="button"
          onClick={() =>
            setPanel(
              tab === 'equipo'
                ? { kind: 'member' }
                : tab === 'servicios'
                  ? { kind: 'service' }
                  : tab === 'faq'
                    ? { kind: 'faq' }
                    : { kind: 'section' },
            )
          }
          className="inline-flex items-center gap-2 rounded-none bg-brand-900 px-6 py-3 text-sm font-medium uppercase tracking-widest text-white transition-all duration-300 hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {NUEVO[tab]}
        </button>
      }
    >
      <div role="tablist" aria-label="Tipo de contenido" className="mb-6 flex border-b border-line">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-medium uppercase tracking-widest transition-colors duration-300 ${
              tab === key
                ? 'border-brand-900 text-ink dark:border-brand-500'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {label}
            {!loading && (
              <span
                className={`inline-flex min-w-6 justify-center rounded-sm px-1.5 py-0.5 text-[0.65rem] tracking-normal ${
                  tab === key ? 'bg-brand-100 text-brand-700' : 'bg-paper-soft text-ink-soft'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {showSkeleton ? (
        <ListSkeleton />
      ) : loading ? null : tab === 'equipo' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-line bg-paper p-5">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`shrink-0 rounded-sm p-2.5 ${
                  teamVisible
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {teamVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-ink">Visibilidad de la sección en la web</h3>
                  <span
                    className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                      teamVisible
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {teamVisible ? 'Visible' : 'Oculta'}
                  </span>
                </div>
                <p className="mt-1 text-xs font-light text-ink-soft">
                  {teamVisible
                    ? 'El bloque de equipo ("Nuestro equipo / Las personas detrás de cada proyecto") se muestra en la página principal.'
                    : 'El bloque de equipo está oculto para los visitantes de la página principal. Podés seguir editando los integrantes abajo.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleTeamVisibility}
              className={`inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                teamVisible
                  ? 'border border-line bg-paper text-ink hover:bg-paper-soft hover:text-red-600'
                  : 'bg-brand-900 text-white hover:bg-brand-700'
              }`}
            >
              {teamVisible ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" aria-hidden />
                  Ocultar del sitio
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  Mostrar en la web
                </>
              )}
            </button>
          </div>

          <ul className="divide-y divide-line border border-line bg-paper">
            {team.map((m: TeamMember, i: number) => (
              <li key={m.id} className="flex items-center gap-4 px-4 py-3">
                <OrderButtons
                  index={i}
                  total={team.length}
                  label={m.name}
                  onMove={(from, to) => void move('equipo', from, to)}
                />
                <img
                  src={m.photo}
                  alt=""
                  loading="lazy"
                  className="h-14 w-12 shrink-0 border border-line bg-paper-soft object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{m.name}</p>
                  <p className="text-xs font-medium uppercase tracking-widest text-brand-500">
                    {m.role}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs font-light text-ink-soft">{m.bio}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`Editar ${m.name}`}
                    onClick={() => setPanel({ kind: 'member', member: m })}
                    className="rounded-sm p-2 text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${m.name}`}
                    onClick={() => setToDelete({ kind: 'member', member: m })}
                    className="rounded-sm p-2 text-ink-soft transition-colors hover:bg-paper-soft hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : tab === 'faq' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-line bg-paper p-5">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`shrink-0 rounded-sm p-2.5 ${
                  faqVisible
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {faqVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-ink">Visibilidad de FAQ en Inversiones</h3>
                  <span
                    className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                      faqVisible
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {faqVisible ? 'Visible' : 'Oculta'}
                  </span>
                </div>
                <p className="mt-1 text-xs font-light text-ink-soft">
                  {faqVisible
                    ? 'El bloque de Preguntas Frecuentes se muestra en la sección de Inversiones.'
                    : 'El bloque de Preguntas Frecuentes está oculto para los visitantes.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleFaqVisibility}
              className={`inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                faqVisible
                  ? 'border border-line bg-paper text-ink hover:bg-paper-soft hover:text-red-600'
                  : 'bg-brand-900 text-white hover:bg-brand-700'
              }`}
            >
              {faqVisible ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" aria-hidden />
                  Ocultar de la página
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  Hacer visible
                </>
              )}
            </button>
          </div>

          <ul className="divide-y divide-line border border-line bg-paper">
            {faq.map((f: FaqItem, i: number) => (
              <li key={f.id} className="flex items-start gap-4 px-4 py-3">
                <div className="pt-1">
                  <OrderButtons
                    index={i}
                    total={faq.length}
                    label={f.question}
                    onMove={(from, to) => void move('faq', from, to)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{f.question}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-light text-ink-soft">{f.answer}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`Editar pregunta: ${f.question}`}
                    onClick={() => setPanel({ kind: 'faq', item: f })}
                    className="rounded-sm p-2 text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar pregunta: ${f.question}`}
                    onClick={() => setToDelete({ kind: 'faq', item: f })}
                    className="rounded-sm p-2 text-ink-soft transition-colors hover:bg-paper-soft hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : tab === 'servicios' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-line bg-paper p-5">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`shrink-0 rounded-sm p-2.5 ${
                  serviciosVisible
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {serviciosVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-ink">Visibilidad de la sección en la portada</h3>
                  <span
                    className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                      serviciosVisible
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {serviciosVisible ? 'Visible' : 'Oculta'}
                  </span>
                </div>
                <p className="mt-1 text-xs font-light text-ink-soft">
                  {serviciosVisible
                    ? 'El bloque de servicios ("Soluciones integrales / Mazo de servicios") se muestra en la portada.'
                    : 'El bloque de servicios está oculto para los visitantes en la portada.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleServiciosVisibility}
              className={`inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                serviciosVisible
                  ? 'border border-line bg-paper text-ink hover:bg-paper-soft hover:text-red-600'
                  : 'bg-brand-900 text-white hover:bg-brand-700'
              }`}
            >
              {serviciosVisible ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" aria-hidden />
                  Ocultar de la portada
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  Hacer visible
                </>
              )}
            </button>
          </div>

          <ul className="divide-y divide-line border border-line bg-paper">
            {services.map((s: Service, i: number) => {
              return (
                <li key={s.id} className="flex items-center gap-4 px-4 py-3">
                  <OrderButtons
                    index={i}
                    total={services.length}
                    label={s.title}
                    onMove={(from, to) => void move('servicios', from, to)}
                  />
                  <img
                    src={s.image}
                    alt=""
                    loading="lazy"
                    className="h-12 w-16 shrink-0 border border-line bg-paper-soft object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{s.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-light text-ink-soft">
                      {s.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`Editar ${s.title}`}
                      onClick={() => setPanel({ kind: 'service', service: s })}
                      className="rounded-sm p-2 text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`Eliminar ${s.title}`}
                      onClick={() => setToDelete({ kind: 'service', service: s })}
                      className="rounded-sm p-2 text-ink-soft transition-colors hover:bg-paper-soft hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border border-line bg-paper p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-ink flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" /> Secciones adicionales en portada
                </h3>
                <p className="mt-1 text-xs font-light text-ink-soft max-w-2xl leading-relaxed">
                  Agregá módulos y bloques narrativos con el mismo estilo visual del sitio.
                  Podés configurar videos con reproducción automática, audio configurable, tamaño adaptable y disposición en 50/50, ancho completo o destacado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPanel({ kind: 'section' })}
                className="inline-flex shrink-0 items-center gap-2 bg-brand-900 text-white hover:bg-brand-700 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors"
              >
                <Plus className="w-4 h-4" /> Nueva sección
              </button>
            </div>
          </div>

          {customSections.length === 0 ? (
            <div className="border border-line bg-paper p-12 text-center">
              <Layers className="w-8 h-8 mx-auto text-ink-soft/40 mb-3" />
              <h4 className="text-base font-light text-ink">No hay secciones adicionales aún</h4>
              <p className="text-xs font-light text-ink-soft mt-1 max-w-md mx-auto">
                Creá tu primera sección personalizada con video institucional, recorrido de obras o pilares corporativos.
              </p>
              <button
                type="button"
                onClick={() => setPanel({ kind: 'section' })}
                className="mt-5 inline-flex items-center gap-2 bg-brand-900 text-white hover:bg-brand-700 px-5 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors"
              >
                <Plus className="w-4 h-4" /> Crear primera sección
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line border border-line bg-paper">
              {customSections.map((sec: CustomSection, i: number) => (
                <li key={sec.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <OrderButtons
                      index={i}
                      total={customSections.length}
                      label={sec.title}
                      onMove={(from, to) => void move('secciones', from, to)}
                    />
                    <div className="w-20 h-14 shrink-0 border border-line bg-ink-fixed/10 overflow-hidden flex items-center justify-center relative">
                      {sec.mediaType === 'video' ? (
                        sec.mediaUrl ? (
                          <video
                            src={sec.mediaUrl}
                            muted
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Video className="w-6 h-6 text-brand-500" />
                        )
                      ) : sec.mediaType === 'image' && sec.mediaUrl ? (
                        <img
                          src={sec.mediaUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Layers className="w-6 h-6 text-ink-soft" />
                      )}
                      {sec.mediaType === 'video' && (
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[0.6rem] px-1 py-0.2 rounded font-mono">
                          MP4
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {sec.kicker && (
                        <span className="text-[0.65rem] font-medium uppercase tracking-widest text-brand-500">
                          {sec.kicker}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-sm px-1.5 py-0.2 text-[0.6rem] font-medium uppercase tracking-wide ${
                          sec.visible
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {sec.visible ? 'Visible' : 'Oculta'}
                      </span>
                      <span className="text-[0.65rem] text-ink-soft bg-paper-soft border border-line px-1.5 py-0.2 rounded">
                        {sec.mediaType === 'video'
                          ? `Video (${sec.videoConfig?.aspectRatio ?? '16/9'}, ${sec.videoConfig?.height ?? 'medium'})`
                          : sec.mediaType === 'image'
                            ? 'Imagen'
                            : 'Solo texto'}
                      </span>
                      <span className="text-[0.65rem] text-ink-soft bg-paper-soft border border-line px-1.5 py-0.2 rounded">
                        {sec.layout === 'split-balanced'
                          ? '50/50'
                          : sec.layout === 'split-media-large'
                            ? 'Media destacado'
                            : sec.layout === 'full-width'
                              ? 'Ancho completo'
                              : 'Compacto'}
                      </span>
                      <span className="text-[0.65rem] text-ink-soft bg-paper-soft border border-line px-1.5 py-0.2 rounded">
                        {sec.theme === 'dark' ? 'Tema oscuro' : 'Tema claro'}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-ink mt-1">{sec.title}</p>
                    <p className="line-clamp-1 text-xs font-light text-ink-soft mt-0.5">{sec.content}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      aria-label={sec.visible ? 'Ocultar sección' : 'Mostrar sección'}
                      onClick={() => void handleToggleCustomSectionVisibility(sec)}
                      className={`p-2 rounded-sm transition-colors ${
                        sec.visible
                          ? 'text-emerald-600 hover:text-emerald-700 hover:bg-paper-soft'
                          : 'text-amber-600 hover:text-amber-700 hover:bg-paper-soft'
                      }`}
                      title={sec.visible ? 'Ocultar sección en la portada' : 'Mostrar sección en la portada'}
                    >
                      {sec.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      aria-label={`Editar ${sec.title}`}
                      onClick={() => setPanel({ kind: 'section', section: sec })}
                      className="rounded-sm p-2 text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`Eliminar ${sec.title}`}
                      onClick={() => setToDelete({ kind: 'section', section: sec })}
                      className="rounded-sm p-2 text-ink-soft transition-colors hover:bg-paper-soft hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <SidePanel
        open={panel !== null}
        title={
          panel === null
            ? ''
            : panel.kind === 'member'
              ? panel.member
                ? 'Editar integrante'
                : 'Nuevo integrante'
              : panel.kind === 'service'
                ? panel.service
                  ? 'Editar servicio'
                  : 'Nuevo servicio'
                : panel.kind === 'faq'
                  ? panel.item
                    ? 'Editar pregunta'
                    : 'Nueva pregunta'
                  : panel.section
                    ? 'Editar sección adicional'
                    : 'Nueva sección adicional'
        }
        onClose={() => setPanel(null)}
      >
        {panel?.kind === 'member' && (
          <MemberForm
            key={panel.member?.id ?? 'create-member'}
            initial={panel.member}
            onCancel={() => setPanel(null)}
            onSubmit={async (values) => {
              if (panel.member) {
                await teamRepo.update(panel.member.id, values);
                showToast('Integrante actualizado.');
              } else {
                await teamRepo.create(values);
                showToast('Integrante creado.');
              }
              setPanel(null);
              await load();
            }}
          />
        )}
        {panel?.kind === 'service' && (
          <ServiceForm
            key={panel.service?.id ?? 'create-service'}
            initial={panel.service}
            onCancel={() => setPanel(null)}
            onSubmit={async (values) => {
              if (panel.service) {
                await serviceRepo.update(panel.service.id, values);
                showToast('Servicio actualizado.');
              } else {
                await serviceRepo.create(values);
                showToast('Servicio creado.');
              }
              setPanel(null);
              await load();
            }}
          />
        )}
        {panel?.kind === 'faq' && (
          <FaqForm
            key={panel.item?.id ?? 'create-faq'}
            initial={panel.item}
            onCancel={() => setPanel(null)}
            onSubmit={async (values) => {
              if (panel.item) {
                await faqRepo.update(panel.item.id, values);
                showToast('Pregunta actualizada.');
              } else {
                await faqRepo.create(values);
                showToast('Pregunta creada.');
              }
              setPanel(null);
              await load();
            }}
          />
        )}
        {panel?.kind === 'section' && (
          <CustomSectionForm
            key={panel.section?.id ?? 'create-section'}
            initial={panel.section}
            onCancel={() => setPanel(null)}
            onSubmit={async (values) => {
              const payload = {
                title: values.title,
                kicker: values.kicker || undefined,
                content: values.content,
                layout: values.layout,
                theme: values.theme,
                mediaType: values.mediaType,
                mediaUrl: values.mediaUrl || undefined,
                mediaAlt: values.mediaAlt || undefined,
                videoConfig: {
                  autoplay: values.autoplay,
                  muted: values.muted,
                  loop: values.loop,
                  controls: values.controls,
                  aspectRatio: values.aspectRatio,
                  height: values.height,
                },
                ctaText: values.ctaText || undefined,
                ctaLink: values.ctaUrl || undefined,
                ctaUrl: values.ctaUrl || undefined,
                published: values.visible,
                visible: values.visible,
              };
              if (panel.section) {
                await customSectionRepo.update(panel.section.id, payload);
                showToast('Sección adicional actualizada.');
              } else {
                await customSectionRepo.create(payload);
                showToast('Sección adicional creada.');
              }
              setPanel(null);
              await load();
            }}
          />
        )}
      </SidePanel>

      <ConfirmDialog
        open={toDelete !== null}
        title={
          toDelete?.kind === 'service'
            ? 'Eliminar servicio'
            : toDelete?.kind === 'faq'
              ? 'Eliminar pregunta'
              : toDelete?.kind === 'section'
                ? 'Eliminar sección'
                : 'Eliminar integrante'
        }
        message={
          toDelete === null
            ? ''
            : toDelete.kind === 'service'
              ? `"${toDelete.service.title}" dejará de aparecer en la grilla de servicios del sitio.`
              : toDelete.kind === 'faq'
                ? `"${toDelete.item.question}" dejará de aparecer en las preguntas frecuentes de Inversiones.`
                : toDelete.kind === 'section'
                  ? `"${toDelete.section.title}" dejará de aparecer en la portada del sitio.`
                  : `"${toDelete.member.name}" dejará de aparecer en la sección Quiénes somos del sitio.`
        }
        busy={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setToDelete(null)}
      />

      {toastEl}
    </AdminShell>
  );
}
