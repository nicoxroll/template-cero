// Auth del panel (ADMIN-05). Dos modos, igual que la capa de datos:
//
//   · Con Supabase configurado → `supabase.auth` real + allowlist `admin_users`.
//     Estar autenticado NO alcanza: el sitio es de captación, no un marketplace,
//     y cualquiera podría registrarse. Quien decide es la tabla `admin_users`,
//     que es la misma que consultan las políticas RLS vía `is_admin()`.
//
//   · Sin Supabase → mock v1 en sessionStorage (cualquier credencial), para que
//     el panel siga siendo navegable sin backend.
//
// La sesión se cachea en memoria porque el guard de AdminShell corre en cada
// render y tiene que ser SÍNCRONO: `supabase.auth.getSession()` es async y
// devolver una promesa ahí obligaría a un estado de carga en cada navegación
// del panel. `initAuth()` (abajo) resuelve la sesión una vez al arrancar y
// mantiene la caché al día con `onAuthStateChange`.

import { getSupabase, SUPABASE_READY } from '../../../data/supabaseClient';

const SESSION_KEY = 'puntocero:v1:admin-session';

export interface AdminSession {
  email: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ Mock v1 */

function mockLogin(email: string, password: string): AdminSession | null {
  if (!email.trim() || !password.trim()) return null;
  const session: AdminSession = { email: email.trim(), createdAt: new Date().toISOString() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function mockGetSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    return typeof parsed.email === 'string' && parsed.email.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------- Sesión con Supabase */

let cachedSession: AdminSession | null = null;
let ready = !SUPABASE_READY; // en modo mock no hay nada que resolver

/** ¿El usuario está en la allowlist del equipo? Una consulta a `admin_users`;
 * si RLS la bloquea o no hay fila, no es admin. */
async function isAllowlisted(userId: string, email?: string): Promise<boolean> {
  const supabase = getSupabase();
  const emailNorm = (email ?? '').trim().toLowerCase();

  if (emailNorm) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .or(`user_id.eq.${userId},email.ilike.${emailNorm}`)
      .limit(1)
      .maybeSingle();
    return !error && data !== null;
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !error && data !== null;
}

async function resolveSession(): Promise<AdminSession | null> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  if (!(await isAllowlisted(user.id, user.email))) {
    // Autenticado pero ajeno al equipo: se cierra la sesión en vez de dejarla
    // colgada, así el login vuelve a mostrar el error en el próximo intento.
    await supabase.auth.signOut();
    return null;
  }
  return {
    email: user.email ?? '',
    createdAt: user.last_sign_in_at ?? new Date().toISOString(),
  };
}

/**
 * Resuelve la sesión una vez antes de montar la app y deja el listener que
 * mantiene la caché al día. Se llama desde main.tsx: sin esto, el guard
 * síncrono de AdminShell rebotaría al login en cada recarga aunque la sesión
 * de Supabase siga viva en localStorage.
 */
export async function initAuth(): Promise<void> {
  if (!SUPABASE_READY) return;
  try {
    cachedSession = await resolveSession();
  } catch {
    cachedSession = null;
  } finally {
    ready = true;
  }

  getSupabase().auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      const hadSession = cachedSession !== null;
      cachedSession = null;
      if (hadSession) notifySessionExpired();
      return;
    }
    // SIGNED_IN / TOKEN_REFRESHED: revalidar contra la allowlist, no confiar
    // solo en que exista sesión.
    void resolveSession().then((s) => {
      cachedSession = s;
    });
  });
}

/* -------------------------------------------------------------- API pública */

/** Intenta iniciar sesión. Devuelve la sesión o null si no es válida o el
 * usuario no pertenece al equipo. */
export type LoginFailReason = 'credenciales' | 'sin-permiso' | 'sin-conexion';

export type LoginResult =
  | { ok: true; session: AdminSession }
  | { ok: false; reason: LoginFailReason };

export async function login(email: string, password: string): Promise<LoginResult> {
  if (!SUPABASE_READY) {
    const mock = mockLogin(email, password);
    return mock ? { ok: true, session: mock } : { ok: false, reason: 'credenciales' };
  }

  const supabase = getSupabase();

  let data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data'] | null = null;
  try {
    const res = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (res.error) {
      const sinConexion =
        res.error.name === 'AuthRetryableFetchError' || !res.error.status || res.error.status === 0;
      return { ok: false, reason: sinConexion ? 'sin-conexion' : 'credenciales' };
    }
    data = res.data;
  } catch {
    return { ok: false, reason: 'sin-conexion' };
  }

  if (!data?.user) return { ok: false, reason: 'credenciales' };

  if (!(await isAllowlisted(data.user.id, data.user.email))) {
    await supabase.auth.signOut();
    return { ok: false, reason: 'sin-permiso' };
  }

  cachedSession = {
    email: data.user.email ?? email.trim(),
    createdAt: new Date().toISOString(),
  };
  return { ok: true, session: cachedSession };
}

export async function reauthenticate(password: string): Promise<LoginResult> {
  const currentEmail = getSession()?.email ?? '';
  if (!currentEmail) return { ok: false, reason: 'credenciales' };
  return login(currentEmail, password);
}

export async function logout(): Promise<void> {
  cachedSession = null;
  if (!SUPABASE_READY) {
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  await getSupabase().auth.signOut();
}

export function getSession(): AdminSession | null {
  return SUPABASE_READY ? cachedSession : mockGetSession();
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/** false mientras `initAuth()` no terminó */
export function isAuthReady(): boolean {
  return ready;
}

type SessionExpireListener = () => void;
const expireListeners = new Set<SessionExpireListener>();

export function subscribeSessionExpired(listener: SessionExpireListener): () => void {
  expireListeners.add(listener);
  return () => {
    expireListeners.delete(listener);
  };
}

export function notifySessionExpired(): void {
  expireListeners.forEach((fn) => fn());
}

