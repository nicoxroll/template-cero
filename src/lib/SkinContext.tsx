// Contexto React del modo de HERO de la portada (video | imagen). A diferencia
// del tema (que solo mueve una clase CSS y no necesita reactividad de React —
// cada consumidor relee el DOM), el modo decide QUÉ HERO monta la home (ver
// src/pages/Home.tsx) y el toggle vive en el Header, un componente hermano
// fuera del árbol de Home. Necesita estado compartido de verdad.
//
// Se hidrata sincrónicamente desde localStorage en el initializer de
// useState (sin SSR en este proyecto — createRoot, no hydrateRoot — así que
// no hay riesgo de mismatch) para no pintar un frame con el modo incorrecto.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { getCurrentMode, setMode as persistMode, type Mode } from './skin';

/** Evento disparado en window tras un cambio de modo confirmado (después de
 * persistir + aplicar el atributo data-mode). Cualquier dueño de un
 * ScrollTrigger propio puede escucharlo para matar/refrescar sus triggers y no
 * dejarlos colgados al cambiar de hero — ver REGLAS #4. El hero de video
 * (ScrubStage) instala el único pin del sitio: al alternar a imagen se
 * desmonta y su cleanup con `gsapCtx.revert()` saca el pin-spacer, pero los
 * triggers de reveal de las secciones de abajo quedan con starts calculados
 * CON ese spacer. Home escucha este evento para refrescarlos. */
export const MODE_CHANGE_EVENT = 'pc:mode-change';

interface SkinContextValue {
  mode: Mode;
  /** true = hero de video scrubeado (modo principal); false = hero de imagen fija. */
  isVideo: boolean;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const SkinContext = createContext<SkinContextValue | null>(null);

export function SkinProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(getCurrentMode);

  const value = useMemo<SkinContextValue>(() => {
    const setMode = (next: Mode) => {
      setModeState((prev) => {
        if (prev === next) return prev;
        persistMode(next);
        // El hero de video ocupa ~4 alturas de viewport (pin de +=300%) y el
        // de imagen una sola: alternar cambia el alto total del documento.
        // Arrancar desde el tope evita quedar con scroll a mitad de un hero
        // que ya no existe.
        if (typeof window !== 'undefined') {
          window.scrollTo(0, 0);
          window.dispatchEvent(new CustomEvent<Mode>(MODE_CHANGE_EVENT, { detail: next }));
        }
        return next;
      });
    };
    return {
      mode,
      isVideo: mode === 'video',
      setMode,
      toggleMode: () => setMode(mode === 'video' ? 'imagen' : 'video'),
    };
  }, [mode]);

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
}

export function useSkin(): SkinContextValue {
  const ctx = useContext(SkinContext);
  if (!ctx) throw new Error('useSkin debe usarse dentro de <SkinProvider>');
  return ctx;
}
