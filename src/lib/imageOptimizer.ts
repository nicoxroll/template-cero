/**
 * Utilidad de optimización y compresión de imágenes en el cliente (Browser-native Canvas API).
 *
 * Convierte imágenes pesadas (JPG, PNG, WebP de cámara de 5–20 MB) a formato WebP moderno
 * con dimensiones máximas de 1920×1920px y calidad óptima (82%), logrando reducciones del
 * 75% al 95% de peso sin degradación visual perceptible antes de la subida a Storage.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Tamaño mínimo en bytes para intentar comprimir (por defecto 100 KB) */
  minBytesThreshold?: number;
}

export interface OptimizationResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
  wasOptimized: boolean;
}

const DEFAULT_OPTIONS: Required<OptimizeImageOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.82,
  minBytesThreshold: 100 * 1024, // 100 KB
};

/** Formatea bytes a texto amigable (ej: "2.4 MB", "340 KB") */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Optimiza un archivo de imagen en el navegador.
 * Si el archivo es un SVG, GIF animado, PDF o ya es liviano, lo devuelve intacto.
 */
export async function optimizeImage(
  file: File,
  options?: OptimizeImageOptions,
): Promise<OptimizationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  // Ignorar formatos no rasterizables o especiales
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif' ||
    originalSize <= opts.minBytesThreshold
  ) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      reductionPercent: 0,
      wasOptimized: false,
    };
  }

  return new Promise<OptimizationResult>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calcular escala proporcional
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          file,
          originalSize,
          optimizedSize: originalSize,
          reductionPercent: 0,
          wasOptimized: false,
        });
        return;
      }

      // Mejor calidad de interpolación
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= originalSize) {
            // Si por alguna razón el blob resultante no es más chico, conservar original
            resolve({
              file,
              originalSize,
              optimizedSize: originalSize,
              reductionPercent: 0,
              wasOptimized: false,
            });
            return;
          }

          // Generar nuevo nombre con extensión .webp
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const optimizedFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          const optimizedSize = optimizedFile.size;
          const reductionPercent = Math.round(((originalSize - optimizedSize) / originalSize) * 100);

          resolve({
            file: optimizedFile,
            originalSize,
            optimizedSize,
            reductionPercent,
            wasOptimized: true,
          });
        },
        'image/webp',
        opts.quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file,
        originalSize,
        optimizedSize: originalSize,
        reductionPercent: 0,
        wasOptimized: false,
      });
    };

    img.src = objectUrl;
  });
}
