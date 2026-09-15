import { Link, useLocation } from 'react-router';
import { useLiveCMS } from '../lib/LiveCMSContext';
import { isAuthenticated } from './admin/shell/adminAuth';
import { Edit3, Eye, ShieldCheck, Zap } from 'lucide-react';

export default function LiveCMSEditor() {
  const { isEditMode, toggleEditMode } = useLiveCMS();
  const location = useLocation();
  const esAdmin = isAuthenticated();

  // Ocultar si no está autenticado como admin o si ya está dentro de las rutas del panel (/admin/*)
  if (!esAdmin || location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <aside
      aria-label="Panel flotante de edición en vivo CMS"
      className="fixed bottom-6 left-6 z-[60] flex items-center gap-2.5 animate-[fade-in_0.4s_ease-out] font-sans"
    >
      <div className="bg-ink-fixed/90 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.75)] p-1.5 flex items-center gap-2 group hover:border-brand-400/50 transition-all">
        <div className="pl-3 pr-2.5 flex items-center gap-2 border-r border-white/15">
          <Zap
            className={`w-3.5 h-3.5 ${
              isEditMode ? 'text-brand-400 animate-pulse' : 'text-neutral-400'
            }`}
          />
          <span className="text-[10px] uppercase font-bold tracking-widest text-white hidden sm:inline-block font-mono">
            CMS Live
          </span>
        </div>

        {/* Botón Toggle Modo Edición */}
        <button
          onClick={toggleEditMode}
          type="button"
          className={`px-4 py-2 rounded-full text-xs font-medium tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            isEditMode
              ? 'bg-brand-500 text-white shadow-[0_0_18px_rgba(20,184,166,0.5)] scale-102'
              : 'bg-white/10 hover:bg-white/20 text-white/90'
          }`}
        >
          {isEditMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isEditMode ? 'Modo Edición Activado' : 'Modo Vista'}</span>
        </button>

        {/* Acceso directo al panel completo */}
        <Link
          to="/admin/panel"
          title="Ir al panel de administración"
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-ring"
        >
          <ShieldCheck className="w-4 h-4" />
        </Link>
      </div>
    </aside>
  );
}
