// Aviso de privacidad Ley 25.326 (CONT-04). Extraído de la página Contacto
// para que el formulario pueda montarse también en la home sin duplicar el
// texto legal — una sola fuente de verdad para lo que el usuario acepta.

import { useEffect } from 'react';
import Button from '../ui/Button';

export default function PrivacyModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
    >
      <div
        data-lenis-prevent className="max-h-[80vh] w-full max-w-xl overflow-y-auto border border-hairline bg-paper p-8 md:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-brand-500">
          Ley 25.326
        </p>
        <h2 id="privacy-title" className="text-xl font-light tracking-wide text-ink md:text-2xl">
          Política de privacidad
        </h2>
        <div className="mt-6 space-y-4 text-base font-light leading-relaxed text-ink-soft">
          <p>
            Los datos personales ingresados en este formulario (nombre, email, teléfono y mensaje)
            serán utilizados por Punto Cero Desarrollos con el único fin de responder su consulta y
            mantener contacto comercial relacionado con nuestros proyectos y servicios.
          </p>
          <p>
            Sus datos no serán cedidos a terceros ni utilizados con fines distintos a los
            declarados. El envío del formulario implica su consentimiento libre, expreso e
            informado conforme a la Ley 25.326 de Protección de los Datos Personales.
          </p>
          <p>
            Usted podrá ejercer en cualquier momento los derechos de acceso, rectificación y
            supresión de sus datos escribiéndonos por cualquiera de los canales de contacto
            publicados en este sitio. La Agencia de Acceso a la Información Pública, órgano de
            control de la Ley 25.326, tiene la atribución de atender denuncias y reclamos por
            incumplimiento de las normas de protección de datos personales.
          </p>
        </div>
        <div className="mt-8">
          <Button variant="outline" type="button" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
