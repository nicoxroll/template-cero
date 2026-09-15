// Repositorios resilientes: si Supabase está configurado pero NO responde, las
// lecturas caen a los datos locales en vez de dejar el sitio en blanco.
//
// Por qué hace falta. `SUPABASE_READY` sólo mira si existen las dos variables de
// entorno — no si sirven. Con una URL válida y una key inválida (o un proyecto
// pausado, o sin red) el swap igual monta Supabase, cada lectura rechaza y el
// sitio queda MUDO: sin proyectos, sin servicios, sin datos de contacto, sin
// footer. Para una portada cuyo único trabajo es inspirar confianza, ése es el
// peor modo de falla posible, y es exactamente el que se vio en producción:
// la key desplegada era la de demo del Supabase local contra la URL de la nube,
// así que PostgREST contestaba 401 "Invalid API key" a todo.
//
// Tres límites deliberados de la caída:
//
//   1. Sólo LECTURAS. Una escritura que cae al mock es peor que un error: el
//      admin cree que guardó y no guardó, y un lead "guardado" en localStorage
//      es un contacto comercial perdido en silencio. Las escrituras propagan.
//
//   2. Sólo ante ERROR, nunca ante respuesta vacía. Una tabla sin filas es un
//      estado legítimo ("todavía no cargamos proyectos"); resucitar ahí los
//      datos de ejemplo haría reaparecer contenido que el equipo borró a
//      propósito, que es una forma rarísima de romper la confianza.
//
//   3. Con techo de tiempo, y SE PAGA UNA SOLA VEZ. Un backend que no contesta
//      nunca dejaría al sitio en skeletons para siempre. Pero el techo tiene que
//      cobrarse una vez, no una vez por lectura: la home dispara media docena de
//      lecturas y con un techo por llamada la primera pantalla tardaba el techo
//      entero en aparecer. Tras la primera falla el repo queda marcado como
//      degradado y las lecturas siguientes van directo a los datos locales, sin
//      esperar nada.

// 3,5 s: de sobra para cualquier lectura sana de PostgREST —incluso desde un
// celular con mala señal— y poco para que una espera se note como una espera.
// Antes eran 10 s, elegidos para "no degradar a nadie por lentitud", pero como
// se pagaban por llamada el efecto real era una portada en blanco diez segundos.
const READ_TIMEOUT_MS = 3500;

/** Métodos que pueden caer al fallback. Todo lo que no esté acá —create,
 * update, remove, subscribe, reorder— propaga el error sin red de contención. */
const READ_METHODS = new Set([
  'list',
  'listPublished',
  'listFeatured',
  'listActive',
  'getBySlug',
  'getBySlugAdmin',
  'get',
]);

let degraded = false;
const listeners = new Set<() => void>();

/** true si alguna lectura ya tuvo que caer al mock en esta sesión. Lo usa el
 * panel para avisar que lo que se está viendo no sale de la base real. */
export function isBackendDegraded(): boolean {
  return degraded;
}

/** Suscripción para `useSyncExternalStore`. La degradación se descubre DESPUÉS
 * del primer render —cuando la primera lectura falla—, así que leer el flag una
 * sola vez al montar no alcanza: el aviso del panel nunca aparecería. */
export function subscribeBackendStatus(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function markDegraded(): void {
  if (degraded) return;
  degraded = true;
  listeners.forEach((notify) => notify());
}

// Un aviso por repositorio y no uno por llamada: con el backend caído, la home
// sola dispara media docena de lecturas y la consola queda ilegible justo
// cuando alguien la está mirando para entender qué pasa.
const warned = new Set<string>();

function warnOnce(label: string, method: string, error: unknown): void {
  if (warned.has(label)) return;
  warned.add(label);
  console.warn(
    `[datos] ${label}.${method}() falló contra Supabase; se sirven los datos locales de ejemplo. ` +
      'Revisá VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY y que el proyecto esté activo.',
    error,
  );
}

function withTimeout<T>(promise: Promise<T>, label: string, method: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label}.${method}() no respondió en ${READ_TIMEOUT_MS} ms`)),
      READ_TIMEOUT_MS,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/**
 * Envuelve un repositorio remoto con uno local del mismo contrato.
 *
 * Se hace con Proxy y no escribiendo una clase envoltorio por repositorio
 * porque los siete repos tienen métodos distintos: a mano serían siete clases
 * casi idénticas que hay que acordarse de actualizar cada vez que el contrato
 * cambia — y olvidarse no rompería nada visible, simplemente ese método dejaría
 * de tener fallback. Con el Proxy, cualquier método nuevo queda cubierto por su
 * nombre y la regla vive en un solo lugar.
 */
export function withLocalFallback<T extends object>(primary: T, fallback: T, label: string): T {
  return new Proxy(primary, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver) as unknown;
      if (typeof original !== 'function') return original;

      const method = String(prop);
      const bound = (original as (...args: unknown[]) => unknown).bind(target);
      if (!READ_METHODS.has(method)) return bound;

      return async (...args: unknown[]) => {
        const alternativeFor = () => Reflect.get(fallback, prop) as unknown;

        // Atajo: si el backend YA falló en esta carga, no se lo vuelve a
        // intentar. Un servidor que acaba de no responder no va a responder
        // dentro de la misma pantalla, y reintentarlo sólo agrega otra espera
        // completa por cada sección que pide datos. Se re-prueba al recargar.
        if (degraded) {
          const alternative = alternativeFor();
          if (typeof alternative === 'function') {
            return (alternative as (...a: unknown[]) => unknown).apply(fallback, args);
          }
        }

        try {
          return await withTimeout(Promise.resolve(bound(...args)), label, method);
        } catch (error) {
          const alternative = alternativeFor();
          // Sin equivalente local no hay nada que servir: propagar el error
          // original es más honesto que inventar un vacío que el consumidor
          // leería como "no hay datos".
          if (typeof alternative !== 'function') throw error;

          markDegraded();
          warnOnce(label, method, error);
          return (alternative as (...a: unknown[]) => unknown).apply(fallback, args);
        }
      };
    },
  }) as T;
}
