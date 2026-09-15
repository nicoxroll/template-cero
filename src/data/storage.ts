// Subida de imágenes al bucket de Supabase Storage.
//
// Por qué existe. El uploader del panel convertía cada archivo a data URI con
// FileReader y guardaba ESO en la columna de texto: `cover_image text`,
// `gallery text[]`. Un JPG de 2 MB se vuelve ~2,7 MB de base64 —el encoding
// suma un 33%— que vive DENTRO de la fila del proyecto y viaja entero en cada
// consulta que traiga ese proyecto, incluida la grilla de la home y el listado
// del panel. Con diez proyectos con galería, cada pantalla arrastra decenas de
// megabytes de texto que el navegador tiene que parsear antes de pintar nada.
//
// Además rompe cosas que no se ven hasta que duelen: los data URI no los cachea
// el navegador por separado (van embebidos en la respuesta JSON), no pasan por
// CDN, y no se pueden servir en un tamaño distinto al original.
//
// Los dos buckets y sus policies ya estaban aprovisionados desde la migración
// inicial —lectura pública, escritura sólo para el equipo— y no se usaban:
// faltaba únicamente el lado cliente.

import { getSupabase, SUPABASE_READY } from './supabaseClient';

const BUCKET = 'project-images';

/** Tope de tamaño por archivo. No es una restricción del bucket sino una
 * cortesía: sin esto, arrastrar un TIFF de cámara de 60 MB se traduce en una
 * subida que parece colgada y termina en un error de red sin explicación. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Nombre aleatorio, no el original. Dos personas subiendo "portada.jpg"
 * pisarían el archivo de la otra, y un nombre con acentos o espacios obliga a
 * encodear la URL en cada uso. La extensión se conserva sólo para que el
 * archivo siga siendo reconocible al mirarlo en el panel de Supabase. */
function nombreSeguro(file: File): string {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${crypto.randomUUID()}.${ext || 'jpg'}`;
}

/** Sube el archivo y devuelve su URL pública. Lanza con un mensaje en
 * castellano listo para mostrar en el formulario. */
export async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `"${file.name}" pesa ${mb} MB y el máximo es ${MAX_IMAGE_BYTES / 1024 / 1024} MB. Reducila antes de subirla.`,
    );
  }

  if (!SUPABASE_READY) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error al leer la imagen seleccionada'));
      reader.readAsDataURL(file);
    });
  }

  const supabase = getSupabase();
  const path = nombreSeguro(file);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    // Un año de caché: el nombre es único e irrepetible, así que el contenido
    // de esa URL no puede cambiar nunca. Sin esto Supabase pone 3600 y el
    // navegador revalida cada hora una imagen que jamás se modifica.
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    // El caso más probable no es un fallo de red sino de permisos: subir exige
    // sesión con is_admin(), así que una sesión vencida cae acá.
    throw new Error(`No se pudo subir "${file.name}": ${error.message}`);
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export async function uploadVideo(file: File): Promise<string> {
  if (file.size > MAX_VIDEO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `"${file.name}" pesa ${mb} MB y el máximo permitido para videos es de ${MAX_VIDEO_BYTES / 1024 / 1024} MB.`,
    );
  }

  if (!SUPABASE_READY) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo de video'));
      reader.readAsDataURL(file);
    });
  }

  const supabase = getSupabase();
  const path = `videos/${nombreSeguro(file)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || 'video/mp4',
  });

  if (error) {
    throw new Error(`No se pudo subir el video "${file.name}": ${error.message}`);
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

