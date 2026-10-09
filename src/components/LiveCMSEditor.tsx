import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useLiveCMS } from '../lib/LiveCMSContext';
import { isAuthenticated, logout } from './admin/shell/adminAuth';
import { useThemePreset, type ThemePreset } from '../lib/theme';
import { siteConfig } from '../config/site';
import {
  Edit3,
  Eye,
  ShieldCheck,
  Zap,
  Palette,
  Sliders,
  X,
  Check,
  FolderKanban,
  Coins,
  Layers,
  Settings,
  Mail,
  LogOut,
  Save,
} from 'lucide-react';

export default function LiveCMSEditor() {
  const { isEditMode, toggleEditMode, getContent, saveSectionContent } = useLiveCMS();
  const { preset, setPreset, presets } = useThemePreset();
  const location = useLocation();
  const navigate = useNavigate();
  const esAdmin = isAuthenticated();

  const [modalOpen, setModalOpen] = useState(false);
  const [siteName, setSiteName] = useState(() => getContent('site.name', siteConfig.name));
  const [siteShortName, setSiteShortName] = useState(() => getContent('site.shortName', siteConfig.shortName));
  const [siteTagline, setSiteTagline] = useState(() => getContent('site.tagline', siteConfig.tagline));
  const [savingConfig, setSavingConfig] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Ocultar si no está autenticado como admin o si ya está dentro de las rutas del panel (/admin/*)
  if (!esAdmin || location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await saveSectionContent({
        'site.name': siteName.trim() || siteConfig.name,
        'site.shortName': siteShortName.trim() || siteConfig.shortName,
        'site.tagline': siteTagline.trim() || siteConfig.tagline,
        'site.themePreset': preset,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Error al guardar datos de marca', err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSelectPreset = async (pId: ThemePreset) => {
    setPreset(pId);
    try {
      await saveSectionContent({
        'site.themePreset': pId,
      });
    } catch (err) {
      console.warn('No se pudo persistir el preset en el CMS:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    window.location.reload();
  };

  return (
    <>
      <aside
        aria-label="Barra flotante de personalización en vivo de la plantilla"
        className="fixed bottom-6 left-6 z-[60] flex items-center gap-2.5 animate-[fade-in_0.4s_ease-out] font-sans"
      >
        <div className="bg-ink-fixed/95 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.75)] p-1.5 flex items-center gap-1.5 group hover:border-brand-400/50 transition-all">
          <div className="pl-3 pr-2 flex items-center gap-2 border-r border-white/15">
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
            title="Activa los lápices para editar textos e imágenes directamente sobre la página"
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              isEditMode
                ? 'bg-brand-500 text-white shadow-[0_0_18px_rgba(20,184,166,0.5)] scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white/90'
            }`}
          >
            {isEditMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isEditMode ? 'Modo Edición Activado' : 'Editar Página'}</span>
          </button>

          {/* Botón Personalizar Plantilla */}
          <button
            onClick={() => {
              setSiteName(getContent('site.name', siteConfig.name));
              setSiteShortName(getContent('site.shortName', siteConfig.shortName));
              setSiteTagline(getContent('site.tagline', siteConfig.tagline));
              setModalOpen(true);
            }}
            type="button"
            title="Personalizar colores, nombre de empresa, textos y enlaces"
            className="px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider bg-white/10 hover:bg-white/20 text-white/90 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-brand-300" />
            <span className="hidden md:inline">Personalizar Plantilla</span>
          </button>

          {/* Acceso directo al panel completo */}
          <Link
            to="/admin/panel"
            title="Ir al panel de control completo (/admin/panel)"
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-ring"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>

          {/* Botón Salir */}
          <button
            onClick={handleLogout}
            type="button"
            title="Cerrar sesión de administrador"
            className="p-2 rounded-full text-white/50 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Modal / Panel Flotante de Personalización de Plantilla */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
        >
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-paper border border-line p-6 md:p-8 shadow-2xl rounded-none text-ink space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-light uppercase tracking-wide text-ink">
                    Personalizar Plantilla
                  </h3>
                  <p className="text-xs font-light text-ink-soft">
                    Cambie la marca, paleta de colores y contenido central en tiempo real.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-ink-soft hover:text-ink hover:bg-paper-soft transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-6">
              {/* Sección 1: Identidad de Marca */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  1. Identidad de Marca y Logo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-ink-soft mb-1.5">
                      Nombre de Marca / Empresa
                    </label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="Ej: Template Cero"
                      className="w-full border border-line bg-paper px-3.5 py-2.5 text-sm font-light text-ink outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-ink-soft mb-1.5">
                      Sigla / Nombre Corto
                    </label>
                    <input
                      type="text"
                      value={siteShortName}
                      onChange={(e) => setSiteShortName(e.target.value)}
                      placeholder="Ej: Cero"
                      className="w-full border border-line bg-paper px-3.5 py-2.5 text-sm font-light text-ink outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-ink-soft mb-1.5">
                    Slogan / Tagline Institucional
                  </label>
                  <input
                    type="text"
                    value={siteTagline}
                    onChange={(e) => setSiteTagline(e.target.value)}
                    placeholder="Transformamos ideas en proyectos de alto valor y escala"
                    className="w-full border border-line bg-paper px-3.5 py-2.5 text-sm font-light text-ink outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Sección 2: Paleta de Colores en Vivo */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400 flex items-center justify-between">
                  <span>2. Paleta de Colores (Preset de Tema)</span>
                  <span className="text-[10px] lowercase text-ink-soft font-mono">se aplica al instante</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {presets.map((p) => {
                    const isSelected = preset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.id)}
                        className={`p-3 border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-500/5'
                            : 'border-line hover:border-brand-500/50 bg-paper-soft/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                            style={{ backgroundColor: p.accentHex }}
                          />
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-500" />}
                        </div>
                        <p className="text-xs font-medium text-ink">{p.name}</p>
                        <p className="text-[10px] text-ink-soft line-clamp-2 leading-tight mt-1">
                          {p.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sección 3: Atajos de Gestión Rápida */}
              <div className="space-y-2.5 pt-2 border-t border-line">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
                  3. Gestionar Módulos del Sitio
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Link
                    to="/admin/proyectos"
                    onClick={() => setModalOpen(false)}
                    className="p-2.5 border border-line bg-paper-soft hover:bg-paper hover:border-brand-500/50 transition-all flex items-center gap-2 text-xs font-light text-ink"
                  >
                    <FolderKanban className="w-4 h-4 text-brand-500" />
                    <span>Proyectos</span>
                  </Link>

                  <Link
                    to="/admin/inversiones"
                    onClick={() => setModalOpen(false)}
                    className="p-2.5 border border-line bg-paper-soft hover:bg-paper hover:border-brand-500/50 transition-all flex items-center gap-2 text-xs font-light text-ink"
                  >
                    <Coins className="w-4 h-4 text-brand-500" />
                    <span>Inversiones</span>
                  </Link>

                  <Link
                    to="/admin/contenido"
                    onClick={() => setModalOpen(false)}
                    className="p-2.5 border border-line bg-paper-soft hover:bg-paper hover:border-brand-500/50 transition-all flex items-center gap-2 text-xs font-light text-ink"
                  >
                    <Layers className="w-4 h-4 text-brand-500" />
                    <span>Servicios & Equipo</span>
                  </Link>

                  <Link
                    to="/admin/configuracion"
                    onClick={() => setModalOpen(false)}
                    className="p-2.5 border border-line bg-paper-soft hover:bg-paper hover:border-brand-500/50 transition-all flex items-center gap-2 text-xs font-light text-ink"
                  >
                    <Settings className="w-4 h-4 text-brand-500" />
                    <span>Configuración General</span>
                  </Link>

                  <Link
                    to="/admin/leads"
                    onClick={() => setModalOpen(false)}
                    className="p-2.5 border border-line bg-paper-soft hover:bg-paper hover:border-brand-500/50 transition-all flex items-center gap-2 text-xs font-light text-ink"
                  >
                    <Mail className="w-4 h-4 text-brand-500" />
                    <span>Consultas & Leads</span>
                  </Link>

                  <Link
                    to="/admin/panel"
                    onClick={() => setModalOpen(false)}
                    className="p-2.5 border border-line bg-paper-soft hover:bg-paper hover:border-brand-500/50 transition-all flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-400"
                  >
                    <ShieldCheck className="w-4 h-4 text-brand-500" />
                    <span>Dashboard Admin</span>
                  </Link>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-between pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-line text-xs font-medium uppercase tracking-wider text-ink-soft hover:text-ink transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                <div className="flex items-center gap-3">
                  {savedSuccess && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Cambios aplicados
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="px-5 py-2.5 bg-brand-900 text-white hover:bg-brand-700 text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingConfig ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
