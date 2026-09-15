// Cliente Supabase.
//
// El sitio funciona con o sin él: si las variables no están definidas,
// `src/data/index.ts` sirve los repositorios mock de localStorage y este módulo
// nunca crea un cliente. Eso mantiene el repo clonable y corrible sin backend
// (`npm run dev` y anda), que es como se desarrolló toda la fase v1.
//
// Para conectar: ver supabase/README.md.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;

// Se aceptan los DOS nombres de la clave pública.
//
// Supabase renombró el concepto: los proyectos nuevos ya no muestran una "anon
// key" sino una "publishable key" (sb_publishable_…), y quien copia del
// dashboard nombra la variable como la ve. Cuál de los dos nombres usó el
// entorno no debería decidir si el sitio tiene backend o no: son la misma
// credencial, pública por diseño en ambos casos.
//
// Esto ya costó un desvío real: con la variable cargada como
// VITE_SUPABASE_PUBLISHABLE_KEY el build salía sin credenciales y el panel
// decía "modo demostración", sin ninguna pista de que el problema era el nombre.
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

/** true cuando hay credenciales: decide qué implementación de repositorio se usa. */
export const SUPABASE_READY = Boolean(url && anonKey);

// Aviso para el caso más difícil de diagnosticar: media configuración. Con una
// sola de las dos variables el sitio arranca en modo demostración y se ve
// exactamente igual que si no se hubiera configurado nada.
if (import.meta.env.PROD && Boolean(url) !== Boolean(anonKey)) {
  console.warn(
    '[datos] Configuración de Supabase incompleta: ' +
      (url ? 'hay URL pero falta la clave' : 'hay clave pero falta la URL') +
      '. Hacen falta VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (o ' +
      'VITE_SUPABASE_PUBLISHABLE_KEY). El sitio sigue con datos de demostración.',
  );
}

// Singleton perezoso: crear el cliente arriba del módulo obligaría a que exista
// configuración aunque la app corra en modo mock.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!SUPABASE_READY) {
    throw new Error(
      'Supabase no está configurado. Definí VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver supabase/README.md).',
    );
  }
  client ??= createClient(url!, anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // El panel es la única parte con sesión y no usa OAuth: sin esto, el
      // cliente intenta parsear tokens del hash de la URL en cada carga y
      // pelea con el ScrollManager de react-router en los anchors (/#servicios).
      detectSessionInUrl: false,
    },
  });
  return client;
}
