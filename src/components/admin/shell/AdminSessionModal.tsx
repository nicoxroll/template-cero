// Modal no invasivo de re-autenticación (ADMIN).
// Se dispara si la sesión de Supabase caduca mientras el usuario está en el panel,
// permitiéndole volver a autenticarse sin recargar la página ni perder datos cargados en formularios.

import { useEffect, useState } from 'react';
import { Lock, Eye, EyeOff, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  getSession,
  logout,
  reauthenticate,
  subscribeSessionExpired,
  type LoginFailReason,
} from './adminAuth';
import Button from '../../ui/Button';


export default function AdminSessionModal() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginFailReason | null>(null);
  const navigate = useNavigate();

  const session = getSession();

  useEffect(() => {
    return subscribeSessionExpired(() => {
      setOpen(true);
      setError(null);
      setPassword('');
    });
  }, []);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await reauthenticate(password);
      if (res.ok) {
        setOpen(false);
        setPassword('');
      } else {
        setError(res.reason);
      }
    } catch {
      setError('sin-conexion');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    setOpen(false);
    void logout().finally(() => navigate('/admin', { replace: true }));
  };

  const MENSAJE: Record<LoginFailReason, string> = {
    credenciales: 'Contraseña incorrecta.',
    'sin-permiso': 'Esta cuenta no tiene permisos de administración.',
    'sin-conexion': 'No se pudo contactar al servidor. Comprobá tu conexión.',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-[fade-in_0.3s_ease-out_both]"
    >
      <div className="relative w-full max-w-md border border-line bg-paper p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-brand-50 text-brand-900 dark:bg-brand-900/40 dark:text-brand-300">
            <Lock size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h2 id="session-modal-title" className="text-lg font-light text-ink">
              Sesión pausada
            </h2>
            <p className="text-xs font-light text-ink-soft">
              Reingresá tu contraseña para no perder los datos del formulario.
            </p>
          </div>
        </div>

        {session?.email && (
          <div className="mb-6 border border-hairline bg-paper-soft px-4 py-3 text-xs">
            <span className="text-ink-soft">Usuario:</span>{' '}
            <span className="font-medium text-ink">{session.email}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reauth-password"
              className="mb-2 block text-xs font-medium uppercase tracking-widest text-ink-soft"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="reauth-password"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full border border-line bg-paper px-4 py-3 pr-12 text-sm font-light text-ink outline-none transition-colors focus:border-brand-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-ink-soft transition-colors hover:text-brand-500"
              >
                {showPassword ? (
                  <EyeOff size={16} strokeWidth={1.5} />
                ) : (
                  <Eye size={16} strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs font-light text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{MENSAJE[error]}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={loading || !password.trim()} className="flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verificando...</span>
                </span>
              ) : (
                'Reanudar sesión'
              )}
            </Button>
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-2 border border-line px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
