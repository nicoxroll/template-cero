// Login del panel (ADMIN-05). Auth mock v1: cualquier email + cualquier password.
// Con sesión activa redirige directo al panel.

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePageMeta } from '../../lib/usePageMeta';
import { gsap } from '../../lib/gsapReveal';
import { prefersReducedMotion } from '../../lib/useReducedMotion';
import {
  isAuthenticated,
  login,
  type LoginFailReason,
} from '../../components/admin/shell/adminAuth';
import Button from '../../components/ui/Button';
import LogoMark from '../../components/ui/LogoMark';
import { STORY_PHOTO_URL } from '../../components/home/story/frameSource';
import { siteConfig } from '../../config/site';

const loginSchema = z.object({
  email: z.string().min(1, 'Ingrese su email').email('Ingrese un email válido'),
  password: z.string().min(1, 'Ingrese su contraseña'),
});

type LoginForm = z.infer<typeof loginSchema>;

const FIELD_CLS =
  'w-full border border-line bg-paper px-4 py-3 text-sm font-light text-ink outline-none transition-colors duration-300 placeholder:text-ink-soft/50 focus:border-brand-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden';

export default function AdminLogin() {
  usePageMeta({ title: 'Admin — Ingreso' });

  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [authError, setAuthError] = useState<LoginFailReason | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (!cardRef.current || prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
    );
    return () => {
      tween.kill();
    };
  }, []);

  if (isAuthenticated()) {
    return <Navigate to="/admin/panel" replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    // login() es async desde que hay auth real: consulta Supabase y además
    // verifica la allowlist del equipo (ver adminAuth.ts).
    const result = await login(data.email, data.password);
    if (!result.ok) {
      setAuthError(result.reason);
      return;
    }
    navigate('/admin/panel', { replace: true });
  };

  // Un mensaje por causa. El genérico anterior culpaba a las credenciales
  // incluso cuando el servidor no estaba respondiendo, que es la manera más
  // rápida de hacer perder media hora probando contraseñas.
  const MENSAJE: Record<LoginFailReason, string> = {
    credenciales: 'Email o contraseña incorrectos.',
    'sin-permiso':
      'Las credenciales son correctas, pero esta cuenta no está habilitada para el panel. Pedí que te agreguen al equipo.',
    'sin-conexion':
      'No se pudo contactar al servidor. No es un problema de tu contraseña: revisá que la base esté levantada y que VITE_SUPABASE_URL apunte al puerto correcto.',
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-fixed px-4">
      {/* Botón Volver al sitio */}
      <Link
        to="/"
        className="group absolute left-6 top-6 z-20 inline-flex items-center gap-2 border border-white/20 bg-black/60 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-white/80 backdrop-blur-md transition-all duration-300 hover:border-brand-500 hover:bg-brand-950/80 hover:text-white active:scale-95 sm:left-8 sm:top-8"
        title="Volver al sitio principal"
        aria-label="Volver al sitio principal"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={1.5} />
        <span>Volver al sitio</span>
      </Link>

      {/* La misma foto del hero de la portada: entrar al panel es entrar al
          sitio, y el login era la única pantalla que no se parecía a él —un
          recuadro sobre gris plano—. Sobre la foto va un velo negro fuerte
          porque acá lo que tiene que leerse es el formulario, no la imagen. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${STORY_PHOTO_URL})` }}
      />
      <div aria-hidden className="absolute inset-0 bg-black/75" />
      <div aria-hidden className="absolute inset-0 bg-brand-900/30" />

      {/* La tarjeta no es translúcida: un formulario con la foto atravesándolo
          se lee peor, y acá se escriben credenciales. */}
      <div ref={cardRef} className="relative w-full max-w-md border border-line bg-paper p-10 shadow-2xl">
        <div className="mb-10 flex items-center gap-3 leading-none">
          <LogoMark className="h-11 w-auto shrink-0" gradientId="pc-logo-login" />
          <span className="flex flex-col">
            <span className="text-lg font-light tracking-[0.35em] text-ink uppercase">{siteConfig.name}</span>
            <span className="mt-2 text-[0.6rem] font-medium tracking-[0.5em] text-brand-500">
              PANEL DE ADMINISTRACIÓN
            </span>
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-xs font-medium uppercase tracking-widest text-ink-soft"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              placeholder="nombre@puntocero.com"
              className={FIELD_CLS}
              {...register('email', { onChange: () => setAuthError(null) })}
            />
            {errors.email && (
              <p className="mt-2 text-xs font-light text-red-700 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-xs font-medium uppercase tracking-widest text-ink-soft"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                // pr-12 reserva el lugar del botón: sin esto una contraseña
                // larga pasa por debajo del ojo y no se lee ni con el ojo abierto.
                className={`${FIELD_CLS} pr-12`}
                {...register('password', { onChange: () => setAuthError(null) })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                // aria-pressed y no un aria-label fijo: un lector de pantalla
                // tiene que poder saber en qué estado está, no sólo qué hace.
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                // tabIndex -1: el orden natural del formulario es email →
                // contraseña → Ingresar. Meter el ojo en el medio hace que
                // tabular después de escribir la contraseña no llegue al botón.
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-ink-soft transition-colors hover:text-brand-700 dark:hover:text-brand-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-xs font-light text-red-700 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          {authError && (
            <div
              role="alert"
              className="border border-red-200 bg-red-50 px-4 py-3 text-xs font-light leading-relaxed text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            >
              {MENSAJE[authError]}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            Ingresar
          </Button>
        </form>

        <div className="mt-8 border-t border-line/60 pt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-light text-ink-soft transition-colors duration-300 hover:text-brand-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Volver al sitio web</span>
          </Link>
          <p className="mt-3 text-[0.65rem] font-light leading-relaxed text-ink-soft/70">
            Acceso restringido al equipo de {siteConfig.name}.
          </p>
        </div>
      </div>
    </main>
  );
}
