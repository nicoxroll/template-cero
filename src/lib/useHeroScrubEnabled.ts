// Interruptor global del hero de video (Configuración → "Hero de video").
// Lo consultan dos componentes en árboles distintos —Home, para decidir qué
// hero monta, y Header, para mostrar u ocultar el toggle— así que la promesa
// se memoiza a nivel de módulo: una sola lectura del repo por carga de página
// en vez de una por consumidor.
//
// Arranca en `false`, que es el default del interruptor en la base
// (hero_scrub_enabled default false) y la decisión de producto: el hero por
// defecto es la imagen fija y el tour es OPT-IN desde el panel.
//
// Antes arrancaba en `true` con el criterio inverso, y eso hacía dos cosas
// mal: el toggle imagen/tour aparecía en el header en TODA carga hasta que
// resolvía la config —un parpadeo de una opción que no debería existir— y si
// configRepo.get() fallaba se quedaba visible para siempre. El default tiene
// que ser el estado apagado: una función que se habilita desde el panel no
// puede estar prendida mientras se averigua si está habilitada.

import { useEffect, useState } from 'react';
import { configRepo } from '../data';

let cached: Promise<boolean> | null = null;

function read(): Promise<boolean> {
  cached ??= configRepo.get().then((cfg) => cfg.heroScrubEnabled);
  return cached;
}

/** Invalida la caché tras guardar en el panel, para no exigir un reload duro. */
export function invalidateHeroScrubCache(): void {
  cached = null;
}

export function useHeroScrubEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let alive = true;
    void read().then((value) => {
      if (alive) setEnabled(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  return enabled;
}
