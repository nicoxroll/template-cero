// Componente de gestión de imágenes con preview y drag-and-drop múltiple (ADMIN).
// Soporta arrastrar múltiples archivos simultáneamente, conversión a Data URL / preview,
// vista previa en lightbox modal, reordenamiento y badge de portada.

import React, { useState, useRef } from 'react';
import { UploadCloud, Trash2, Eye, ChevronUp, ChevronDown, Image as ImageIcon, Loader2, X, Sparkles } from 'lucide-react';
import { USING_REAL_BACKEND } from '../../../data';
import { MAX_IMAGE_BYTES, uploadImage } from '../../../data/storage';
import { optimizeImage, formatBytes } from '../../../lib/imageOptimizer';
import { inputCls } from './FormField';

interface ImageUploaderBaseProps {
  /** Etiqueta superior del campo */
  label?: string;
  /** Sugerencia o ayuda sobre la imagen */
  hint?: string;
  /** Mensaje de error */
  error?: string;
}

/** Props discriminadas por `multiple`: en modo galería el valor y el callback
 * hablan de `string[]`; en modo simple, de `string`.
 *
 * Antes el callback era `(value: any) => void`, que además de no describir nada
 * dejaba pasar errores en los dos sentidos —por ejemplo entregarle un array al
 * campo de portada, que no falla hasta que el sitio intenta renderizar esa foto
 * en runtime—. Con la unión, cada uso queda atado a la forma que le corresponde. */
type ImageUploaderProps = ImageUploaderBaseProps &
  (
    | { multiple: true; value: string[]; onChange: (value: string[]) => void }
    | { multiple?: false; value: string; onChange: (value: string) => void }
  );

export default function ImageUploader({
  value,
  onChange,
  multiple = false,
  label,
  hint,
  error,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [optimizationFeedback, setOptimizationFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Único punto de conversión hacia el callback. Cada llamada de abajo ya elige
  // la forma correcta según `multiple`, pero TypeScript no puede correlacionar
  // props ya desestructuradas con la rama de la unión de la que salieron, así
  // que la afirmación vive acá una sola vez y no repartida por el archivo.
  const emit = (next: string | string[]) => (onChange as (value: string | string[]) => void)(next);

  // Normalizar array de URLs
  const urls: string[] = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
    ? [value]
    : [];

  /** Convierte un archivo en la URL que se va a guardar.
   *
   * Con backend: se sube a Supabase Storage y se guarda la URL pública. Antes
   * se guardaba el data URI del archivo dentro de la propia columna de texto,
   * y eso metía la foto ENTERA (base64, un 33% más pesada que el original) en
   * la fila del proyecto: viajaba en cada consulta que trajera ese proyecto,
   * incluida la grilla de la home. Ver src/data/storage.ts.
   *
   * Sin backend (modo demo con localStorage) se mantiene el data URI, que ahí
   * es la única opción posible y no sale de la máquina de quien lo prueba. */
  const toStoredUrl = (file: File): Promise<string> => {
    if (USING_REAL_BACKEND) return uploadImage(file);
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') resolve(e.target.result);
        else reject(new Error(`No se pudo leer "${file.name}".`));
      };
      // Sin onerror, un archivo corrupto dejaba la promesa colgada para
      // siempre y el formulario esperando en silencio.
      reader.onerror = () => reject(new Error(`No se pudo leer "${file.name}".`));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setOptimizationFeedback('Optimizando imágenes para carga ultra rápida...');
    try {
      // 1. Optimización en el navegador antes de subir
      const optimizationResults = await Promise.all(validFiles.map((f) => optimizeImage(f)));
      const filesToUpload = optimizationResults.map((r) => r.file);

      const totalOrig = optimizationResults.reduce((acc, r) => acc + r.originalSize, 0);
      const totalOpt = optimizationResults.reduce((acc, r) => acc + r.optimizedSize, 0);
      const anyOptimized = optimizationResults.some((r) => r.wasOptimized);

      if (anyOptimized && totalOrig > totalOpt) {
        const pct = Math.round(((totalOrig - totalOpt) / totalOrig) * 100);
        setOptimizationFeedback(
          `Compresión WebP activa: ${formatBytes(totalOrig)} → ${formatBytes(totalOpt)} (${pct}% ahorro)`,
        );
      } else {
        setOptimizationFeedback(null);
      }

      // 2. Subida a Supabase Storage / Local
      const newUrls = await Promise.all(filesToUpload.map(toStoredUrl));
      if (multiple) {
        emit([...urls, ...newUrls]);
      } else {
        emit(newUrls[0]);
      }
    } catch (e) {
      // El error se muestra en el propio campo. Antes no había catch: una
      // subida fallida no hacía absolutamente nada visible y el admin volvía a
      // arrastrar el archivo pensando que no había soltado bien.
      setUploadError(e instanceof Error ? e.message : 'No se pudieron subir las imágenes.');
      setOptimizationFeedback(null);
    } finally {
      setUploading(false);
    }
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const urlToAdd = urlInput.trim();
    if (multiple) {
      emit([...urls, urlToAdd]);
    } else {
      emit(urlToAdd);
    }
    setUrlInput('');
  };

  const handleRemove = (index: number) => {
    if (multiple) {
      const next = [...urls];
      next.splice(index, 1);
      emit(next);
    } else {
      emit('');
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!multiple) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= urls.length) return;
    const next = [...urls];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    emit(next);
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-widest text-ink-soft">
            {label}
          </label>
          <span className="text-[11px] font-light text-ink-soft/70">
            {multiple ? `${urls.length} imágenes` : urls.length > 0 ? 'Cargada' : 'Sin imagen'}
          </span>
        </div>
      )}

      {/* Zone de Drag and Drop Múltiple */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-900/50 scale-[1.01]'
            : 'border-line bg-paper hover:border-brand-500/50 hover:bg-paper-soft'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-paper-soft text-brand-500 transition-transform duration-300 group-hover:scale-110">
          {uploading ? (
            <Loader2 size={24} strokeWidth={1.5} className="animate-spin" aria-hidden />
          ) : (
            <UploadCloud size={24} strokeWidth={1.5} />
          )}
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-widest text-ink">
          {uploading
            ? 'Subiendo…'
            : multiple
              ? 'Arrastrá múltiples imágenes aquí'
              : 'Arrastrá la imagen aquí'}
        </p>
        <p className="mt-1 text-[11px] font-light text-ink-soft">
          {uploading
            ? 'No cierres el formulario hasta que termine.'
            : `o hacé click para seleccionar desde tu equipo (JPG, PNG, WebP · hasta ${MAX_IMAGE_BYTES / 1024 / 1024} MB)`}
        </p>
      </div>

      {optimizationFeedback && (
        <div className="flex items-center gap-2 border border-brand-500/30 bg-brand-50/70 px-3 py-2 text-xs font-light text-brand-900 dark:bg-brand-950/40 dark:text-brand-200">
          <Sparkles size={14} className="shrink-0 text-brand-500" />
          <span>{optimizationFeedback}</span>
        </div>
      )}

      {uploadError && (

        <p
          role="alert"
          className="border border-red-200 bg-red-50 px-3 py-2 text-xs font-light text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          {uploadError}
        </p>
      )}

      {/* Input manual de URL como alternativa */}
      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="O pegá un enlace de imagen (https://...)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddUrl();
            }
          }}
          className={`${inputCls(false)} flex-1 text-xs`}
        />
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="border border-ink px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-40"
        >
          Agregar URL
        </button>
      </div>

      {hint && <p className="text-[11px] font-light text-ink-soft/70">{hint}</p>}
      {error && <p role="alert" className="text-xs font-light text-red-600 dark:text-red-400">{error}</p>}

      {/* Grilla de Previsualizaciones (Previews) */}
      {urls.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-ink-soft">
            Vista previa de {multiple ? 'galería' : 'imagen'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {urls.map((url, i) => (
              <div
                key={`${url.slice(0, 20)}-${i}`}
                className="group relative border border-line bg-paper overflow-hidden shadow-xs transition-all hover:border-brand-500/50"
              >
                <div className="aspect-[4/3] w-full bg-paper-soft relative overflow-hidden">
                  <img
                    src={url}
                    alt={`Preview ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback en error de carga
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-paper-soft/80 text-ink-soft pointer-events-none -z-10">
                    <ImageIcon size={24} />
                  </div>
                </div>

                {/* Overlays y Controles */}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-brand-900/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(url)}
                    title="Ver en grande"
                    aria-label="Ver en grande"
                    className="p-2 text-white hover:text-brand-300 transition-colors"
                  >
                    <Eye size={18} />
                  </button>

                  {multiple && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMove(i, 'up')}
                        disabled={i === 0}
                        title="Mover arriba/izquierda"
                        aria-label="Mover hacia arriba"
                        className="p-2 text-white hover:text-brand-300 disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(i, 'down')}
                        disabled={i === urls.length - 1}
                        title="Mover abajo/derecha"
                        aria-label="Mover hacia abajo"
                        className="p-2 text-white hover:text-brand-300 disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown size={18} />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    title="Eliminar imagen"
                    aria-label="Eliminar imagen"
                    className="p-2 text-red-300 hover:text-red-100 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Badge de número o portada */}
                <div className="absolute top-2 left-2 pointer-events-none">
                  {i === 0 && !multiple ? (
                    <span className="border border-white/20 bg-brand-900/90 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-white backdrop-blur-sm">
                      Portada
                    </span>
                  ) : (
                    <span className="border border-white/20 bg-brand-900/80 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                      #{i + 1}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal de Previsualización */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden border border-white/20 bg-paper"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 z-10 bg-brand-900 p-2 text-white hover:bg-brand-700"
              aria-label="Cerrar vista previa"
            >
              <X size={20} />
            </button>
            <img
              src={previewModalUrl}
              alt="Vista previa ampliada"
              className="max-h-[85vh] max-w-[85vw] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
