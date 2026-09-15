// Barra de Cancelar / Guardar de los formularios del panel.
//
// Estaba copiada textualmente en tres lugares —ProjectForm, InvestmentForm y
// los tres formularios de AdminContenido— con la misma clase larguísima y sólo
// la etiqueta del submit cambiando. Acá vive una sola vez.
//
// STICKY al pie del área que scrollea, que es el cambio de fondo: el formulario
// de proyecto tiene cronograma, specs, documentos y galería, así que la barra
// quedaba al final de un documento largo y había que scrollear hasta abajo de
// todo para guardar, cada vez, incluso después de tocar un solo campo de arriba.
//
// El fondo opaco y el borde superior no son decoración: sin ellos el contenido
// del formulario se lee POR DEBAJO de los botones mientras se scrollea.
//
// Los márgenes negativos compensan el padding lateral del SidePanel para que la
// barra llegue a los bordes del panel. Sin eso queda como un bloque flotando en
// el medio, y se lee como parte del formulario en vez de como su pie.

import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  /** Texto del botón de envío: "Crear proyecto", "Guardar cambios", etc. */
  submitLabel: string;
}

export default function FormActions({ isSubmitting, onCancel, submitLabel }: FormActionsProps) {
  return (
    <div className="sticky bottom-0 -mx-6 mt-2 flex flex-col-reverse gap-3 border-t border-line bg-paper px-6 py-4 sm:flex-row sm:justify-end md:-mx-8 md:px-8">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="w-full rounded-none border border-ink px-6 py-2.5 text-sm font-medium uppercase tracking-widest text-ink transition-all duration-300 hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-none bg-brand-900 px-8 py-2.5 text-sm font-medium uppercase tracking-widest text-white transition-all duration-300 hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {submitLabel}
      </button>
    </div>
  );
}
