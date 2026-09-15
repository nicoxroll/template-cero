import { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { Link } from 'react-router';

const STORAGE_KEY = 'puntocero:privacy-consent:v1';

export default function PrivacyCookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Si ya aceptó o cerró, no se muestra
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Retrasar 1.2s para no competir con el primer paint
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      // Ignore storage errors
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Aviso de privacidad y cookies"
      className="fixed bottom-4 inset-x-4 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-[fade-in_0.5s_ease-out_both]"
    >
      <div className="bg-brand-900/95 text-white border border-white/15 backdrop-blur-md p-4 sm:p-5 shadow-2xl relative rounded-none flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-brand-300">
            <Shield className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
              Privacidad & Transparencia
            </span>
          </div>
          <button
            type="button"
            onClick={handleAccept}
            aria-label="Cerrar aviso de privacidad"
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-light text-white/80 leading-relaxed">
          Utilizamos almacenamiento local y cookies técnicas estrictamente para garantizar la
          funcionalidad del sitio y brindarle una navegación personalizada, en conformidad con la{' '}
          <strong>Ley 25.326 de Protección de Datos Personales</strong> de la República Argentina.
        </p>

        <div className="flex items-center justify-between gap-4 pt-1">
          <Link
            to="/contacto"
            className="text-[11px] text-brand-300 hover:text-white underline underline-offset-2 transition-colors font-light"
          >
            Conocer más
          </Link>

          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-medium uppercase tracking-wider transition-colors duration-300 shadow focus-ring cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </aside>
  );
}
