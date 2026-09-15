/*
  # Punto Cero Desarrollos — schema inicial

  Espeja exactamente los tipos de dominio de `src/data/types.ts`, que hoy sirve
  `LocalStorageRepo`. El swap de repositorio (src/data/index.ts) no debe exigir
  ningún cambio en los componentes: mismos campos, mismos invariantes.

  ## Decisiones

  - **snake_case en la DB, camelCase en TS.** El mapeo vive en el repositorio
    de Supabase (src/data/supabaseRepo.ts), no en los componentes.

  - **`slug` es la clave de negocio, `id` la clave técnica.** Toda la app
    navega y referencia por slug (`/proyectos/:slug`), así que lleva UNIQUE y
    su propio índice. Se conserva `id uuid` porque Supabase Storage, las FK y
    las políticas RLS son más simples con una PK opaca.

  - **jsonb para los objetos de valor anidados** (specs, docs, timeline,
    integración, hitos, fiduciario). Son listas cortas, siempre se leen
    completas junto a su fila padre, nunca se filtran ni se ordenan por sus
    campos internos, y normalizarlas obligaría a 6 tablas satélite y 6 joins
    para pintar una card. Cada columna lleva un CHECK de forma para que un
    insert malformado falle en la DB y no en el render.

  - **`published` gobierna la visibilidad pública.** Las políticas RLS anónimas
    filtran por `published = true`: un borrador es invisible para el sitio
    aunque alguien adivine su slug. El panel lee con sesión autenticada y ve
    todo.

  - **Leads: insert anónimo, lectura solo autenticada.** El formulario público
    tiene que poder escribir sin login, pero nadie sin sesión puede listar los
    datos personales de terceros (Ley 25.326).
*/

-- ---------------------------------------------------------------- Extensiones

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------- Helpers

-- updated_at automático: el panel muestra la última edición y no queremos
-- depender de que cada repositorio se acuerde de setearlo.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Los dos helpers de abajo existen porque Postgres NO permite subqueries
-- dentro de un CHECK ("cannot use subquery in check constraint"), y ambos
-- invariantes se calculan recorriendo un array jsonb. Envolverlos en
-- funciones IMMUTABLE es la forma soportada de expresarlos como constraint.

-- Cuántas etapas del timeline están marcadas como la actual.
create or replace function timeline_current_count(timeline jsonb)
returns integer
language sql
immutable
as $$
  select count(*)::int
  from jsonb_array_elements(timeline) t
  where (t->>'current')::boolean;
$$;

-- Suma de los porcentajes del cronograma de integración de aportes.
create or replace function integracion_percent_sum(items jsonb)
returns numeric
language sql
immutable
as $$
  select coalesce(sum((e->>'porcentaje')::numeric), 0)
  from jsonb_array_elements(items) e;
$$;

-- --------------------------------------------------------------- admin_users

-- Allowlist explícita: estar autenticado en Supabase no alcanza para entrar al
-- panel. Se puebla a mano (o por invitación) — el sitio no tiene registro
-- público, es un sitio de captación, no un marketplace.
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

-- ¿La sesión actual es del equipo de Punto Cero? Se usa en todas las políticas
-- de escritura. SECURITY DEFINER + search_path fijo para que no pueda ser
-- suplantada creando un esquema homónimo.
--
-- Va DESPUÉS de admin_users a propósito: en una función `language sql` el
-- cuerpo se valida al crearla (a diferencia de plpgsql, que lo difiere hasta
-- la primera ejecución), así que declararla antes de la tabla falla con
-- "relation admin_users does not exist".
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users where user_id = auth.uid()
  );
$$;

alter table admin_users enable row level security;

create policy "admin_users: el equipo se ve a sí mismo"
  on admin_users for select
  to authenticated
  using (is_admin());

-- ------------------------------------------------------------------ projects

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  location text not null,
  type text not null check (type in ('residencial', 'comercial', 'mixto', 'infraestructura')),
  status text not null check (status in ('en-pozo', 'en-obra', 'terminado')),

  cover_image text not null,
  -- Galería: array de URLs. El orden de la columna ES el orden en el sitio.
  gallery text[] not null default '{}',

  -- [{ label, value }]
  specs jsonb not null default '[]'::jsonb,
  -- [{ name, url, sizeLabel, kind }]
  docs jsonb not null default '[]'::jsonb,
  -- [{ stage, current, startedAt?, completedAt?, notes? }] — exactamente una con current
  timeline jsonb not null default '[]'::jsonb,

  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),

  featured boolean not null default false,
  is_render boolean not null default false,
  published boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint projects_specs_is_array check (jsonb_typeof(specs) = 'array'),
  constraint projects_docs_is_array check (jsonb_typeof(docs) = 'array'),
  constraint projects_timeline_is_array check (jsonb_typeof(timeline) = 'array'),
  -- Invariante de dominio que la app ya sostiene en el formulario: una y solo
  -- una etapa marcada como actual. Replicado acá para que ningún otro cliente
  -- (script de carga, SQL a mano) pueda romperlo.
  constraint projects_one_current_stage check (
    timeline = '[]'::jsonb or timeline_current_count(timeline) = 1
  )
);

create index if not exists projects_published_idx on projects (published) where published;
create index if not exists projects_featured_idx on projects (featured) where featured and published;
create index if not exists projects_created_at_idx on projects (created_at desc);

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

alter table projects enable row level security;

create policy "projects: lectura pública solo de publicados"
  on projects for select
  to anon, authenticated
  using (published or is_admin());

create policy "projects: solo el equipo escribe"
  on projects for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --------------------------------------------------------------- investments

create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,

  amount numeric(14, 2) not null check (amount > 0),
  currency text not null check (currency in ('USD', 'ARS')),
  -- Texto, no número: SIEMPRE se publica como estimación con su disclaimer
  -- (INV-03 / Ley 26.831). Guardarlo como numeric invitaría a presentarlo
  -- como una cifra cerrada.
  est_return text not null,
  term_months integer not null check (term_months > 0),
  status text not null check (status in ('activa', 'proximamente', 'cerrada')),

  -- ON DELETE SET NULL: borrar un proyecto no debe borrar el fideicomiso que
  -- lo financió; la oportunidad queda standalone.
  project_id uuid references projects(id) on delete set null,

  cover_image text not null,
  docs jsonb not null default '[]'::jsonb,

  -- { nombre, tipo }
  fiduciario jsonb not null,
  tipo_estructura text not null check (
    tipo_estructura in ('Fideicomiso al costo', 'Fideicomiso a valor fijo')
  ),
  ticket_minimo numeric(14, 2) not null check (ticket_minimo > 0),
  moneda text not null check (moneda in ('USD', 'ARS')),

  -- [{ etapa, porcentaje, momento }] — los porcentajes deben sumar 100
  integracion jsonb not null default '[]'::jsonb,
  -- [{ hito, avanceObra, fecha }]
  hitos_desembolso jsonb not null default '[]'::jsonb,

  salida text not null,
  escribania text not null,

  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint investments_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint investments_docs_is_array check (jsonb_typeof(docs) = 'array'),
  constraint investments_integracion_is_array check (jsonb_typeof(integracion) = 'array'),
  constraint investments_hitos_is_array check (jsonb_typeof(hitos_desembolso) = 'array'),
  constraint investments_fiduciario_shape check (
    fiduciario ? 'nombre' and fiduciario ? 'tipo'
  ),
  -- Mismo criterio que el formulario: un cronograma de aportes que no suma
  -- 100% es información financiera incorrecta publicada a inversores.
  constraint investments_integracion_suma_100 check (
    integracion = '[]'::jsonb or round(integracion_percent_sum(integracion)) = 100
  )
);

create index if not exists investments_published_idx on investments (published) where published;
create index if not exists investments_status_idx on investments (status);
create index if not exists investments_project_idx on investments (project_id);

create trigger investments_set_updated_at
  before update on investments
  for each row execute function set_updated_at();

alter table investments enable row level security;

create policy "investments: lectura pública solo de publicadas"
  on investments for select
  to anon, authenticated
  using (published or is_admin());

create policy "investments: solo el equipo escribe"
  on investments for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --------------------------------------------------------------------- leads

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  message text not null default '',
  source text not null check (source in ('contacto', 'inversion')),
  -- Slug de la inversión/proyecto consultado. Texto libre y no FK: si el
  -- proyecto se borra, la consulta comercial sigue siendo válida y su contexto
  -- no debe evaporarse.
  interest_slug text,

  status text not null default 'nuevo'
    check (status in ('nuevo', 'contactado', 'calificado', 'cerrado', 'descartado')),
  -- Notas internas del seguimiento: nunca se exponen al público (ver RLS).
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_status_idx on leads (status);

create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

alter table leads enable row level security;

-- El formulario público escribe sin sesión…
create policy "leads: cualquiera puede enviar una consulta"
  on leads for insert
  to anon, authenticated
  with check (true);

-- …pero nadie sin sesión puede leerlas: son datos personales de terceros
-- (Ley 25.326). Sin política de SELECT para anon, la tabla es opaca.
create policy "leads: solo el equipo lee"
  on leads for select
  to authenticated
  using (is_admin());

create policy "leads: solo el equipo gestiona"
  on leads for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "leads: solo el equipo elimina"
  on leads for delete
  to authenticated
  using (is_admin());

-- --------------------------------------------------------- newsletter_subs

create table if not exists newsletter_subs (
  id uuid primary key default gen_random_uuid(),
  -- citext sería más limpio, pero exige otra extensión: un índice único sobre
  -- lower(email) resuelve lo mismo sin sumar dependencias.
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_subs_email_key
  on newsletter_subs (lower(email));

alter table newsletter_subs enable row level security;

create policy "newsletter: cualquiera puede suscribirse"
  on newsletter_subs for insert
  to anon, authenticated
  with check (true);

create policy "newsletter: solo el equipo lee"
  on newsletter_subs for select
  to authenticated
  using (is_admin());

create policy "newsletter: solo el equipo elimina"
  on newsletter_subs for delete
  to authenticated
  using (is_admin());

-- -------------------------------------------------------------- team_members

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  photo text not null,
  bio text not null,
  -- El panel reordena la grilla pública moviendo este entero.
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_members_order_idx on team_members (sort_order);

create trigger team_members_set_updated_at
  before update on team_members
  for each row execute function set_updated_at();

alter table team_members enable row level security;

create policy "team: lectura pública"
  on team_members for select
  to anon, authenticated
  using (true);

create policy "team: solo el equipo escribe"
  on team_members for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ------------------------------------------------------------------ services

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  -- URL de la foto del servicio. Antes acá vivía el nombre de un icono de
  -- lucide: la grilla de iconos de línea se leía genérica —"de plantilla"— al
  -- lado de la fotografía real del resto del sitio.
  image text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint services_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index if not exists services_order_idx on services (sort_order);

create trigger services_set_updated_at
  before update on services
  for each row execute function set_updated_at();

alter table services enable row level security;

create policy "services: lectura pública"
  on services for select
  to anon, authenticated
  using (true);

create policy "services: solo el equipo escribe"
  on services for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --------------------------------------------------------------- page_config

-- Fila única: el `id = 1` con CHECK es el candado que impide que existan dos
-- configuraciones del sitio compitiendo.
create table if not exists page_config (
  id integer primary key default 1 check (id = 1),

  -- Apagado por defecto: el tour se habilita desde Configuracion.
  hero_scrub_enabled boolean not null default false,

  contact_email text not null,
  contact_phone text not null,
  whatsapp_number text not null check (whatsapp_number ~ '^\d{8,15}$'),
  address text not null,
  office_lat double precision not null check (office_lat between -90 and 90),
  office_lng double precision not null check (office_lng between -180 and 180),
  horario_atencion text not null default '',
  zonas_cobertura text[] not null default '{}',

  metrics_years integer not null default 0 check (metrics_years >= 0),
  metrics_m2 integer not null default 0 check (metrics_m2 >= 0),
  metrics_projects integer not null default 0 check (metrics_projects >= 0),

  legal_name text not null default '',
  cuit text not null default '',
  matricula text not null default '',
  domicilio_legal text not null default '',
  -- Textos legales obligatorios del pie (Ley 26.831 y Ley 25.326).
  disclaimer_oferta_publica text not null default '',
  disclaimer_datos_personales text not null default '',

  updated_at timestamptz not null default now()
);

create trigger page_config_set_updated_at
  before update on page_config
  for each row execute function set_updated_at();

alter table page_config enable row level security;

create policy "config: lectura pública"
  on page_config for select
  to anon, authenticated
  using (true);

create policy "config: solo el equipo escribe"
  on page_config for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --------------------------------------------------------------- Storage

-- Dos buckets públicos: las imágenes y los PDFs institucionales se sirven
-- directo por URL desde el sitio, no hay contenido privado detrás de login.
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('project-docs', 'project-docs', true)
on conflict (id) do nothing;

create policy "storage: lectura pública de imágenes"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('project-images', 'project-docs'));

create policy "storage: solo el equipo sube"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('project-images', 'project-docs') and is_admin());

create policy "storage: solo el equipo borra"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('project-images', 'project-docs') and is_admin());

-- ----------------------------------------------------------------- GRANTS

/*
  RLS por sí sola NO alcanza. Son dos capas independientes y ambas tienen que
  permitir la operación:

    1. GRANT  — privilegio SQL clásico: ¿este rol puede tocar esta tabla?
    2. RLS    — ¿y qué FILAS puede tocar?

  Sin los GRANT de abajo, PostgREST responde `42501 permission denied for
  table …` (o 401 en el insert) antes siquiera de evaluar las políticas, y el
  sitio público queda completamente roto aunque las policies estén perfectas.
  Verificado en local: sin esta sección, `GET /rest/v1/projects` como anónimo
  devuelve error en vez de la lista de publicados.

  Los GRANT son deliberadamente amplios (por tabla, no por fila) porque quien
  restringe las filas es RLS: `authenticated` puede intentar un UPDATE sobre
  `projects`, pero la policy lo rechaza salvo que sea `is_admin()`.
*/

grant usage on schema public to anon, authenticated;

-- Contenido público: cualquiera lee (RLS filtra a published = true donde aplica).
grant select on projects, investments, team_members, services, page_config
  to anon, authenticated;

-- Formularios públicos: el visitante escribe pero no lee.
grant insert on leads, newsletter_subs to anon, authenticated;

-- Panel: el equipo gestiona todo (RLS exige is_admin() en cada policy).
grant select, insert, update, delete on
  projects, investments, team_members, services, leads, newsletter_subs
  to authenticated;
grant select, update on page_config to authenticated;
grant select on admin_users to authenticated;
