-- =====================================================================
-- PUNTO CERO — schema completo para el SQL Editor de Supabase
--
-- Pegar TODO y ejecutar de una sola vez. Equivale a `supabase db push` más el
-- contenido de demostración.
--
-- Es REEJECUTABLE: se puede volver a correr entero sin romper nada. Los
-- `create trigger` y `create policy` llevan su `drop ... if exists` adelante
-- porque el motor no les acepta `if not exists`, así que sin eso un segundo
-- pegado —o un reintento tras un error a mitad de camino— fallaría.
--
-- Lo que NO hace: crear el usuario del panel. La contraseña se guarda hasheada
-- por GoTrue y escribir en auth.users a mano depende de su versión interna. Ese
-- paso está al final, son dos clicks.
-- =====================================================================


-- =====================================================================
-- 1/5 — Tablas, índices, triggers, RLS, GRANTs y buckets
-- =====================================================================

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

drop policy if exists "admin_users: el equipo se ve a sí mismo" on admin_users;
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

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

alter table projects enable row level security;

drop policy if exists "projects: lectura pública solo de publicados" on projects;
create policy "projects: lectura pública solo de publicados"
  on projects for select
  to anon, authenticated
  using (published or is_admin());

drop policy if exists "projects: solo el equipo escribe" on projects;
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

drop trigger if exists investments_set_updated_at on investments;
create trigger investments_set_updated_at
  before update on investments
  for each row execute function set_updated_at();

alter table investments enable row level security;

drop policy if exists "investments: lectura pública solo de publicadas" on investments;
create policy "investments: lectura pública solo de publicadas"
  on investments for select
  to anon, authenticated
  using (published or is_admin());

drop policy if exists "investments: solo el equipo escribe" on investments;
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

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

alter table leads enable row level security;

-- El formulario público escribe sin sesión…
drop policy if exists "leads: cualquiera puede enviar una consulta" on leads;
create policy "leads: cualquiera puede enviar una consulta"
  on leads for insert
  to anon, authenticated
  with check (true);

-- …pero nadie sin sesión puede leerlas: son datos personales de terceros
-- (Ley 25.326). Sin política de SELECT para anon, la tabla es opaca.
drop policy if exists "leads: solo el equipo lee" on leads;
create policy "leads: solo el equipo lee"
  on leads for select
  to authenticated
  using (is_admin());

drop policy if exists "leads: solo el equipo gestiona" on leads;
create policy "leads: solo el equipo gestiona"
  on leads for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "leads: solo el equipo elimina" on leads;
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

drop policy if exists "newsletter: cualquiera puede suscribirse" on newsletter_subs;
create policy "newsletter: cualquiera puede suscribirse"
  on newsletter_subs for insert
  to anon, authenticated
  with check (true);

drop policy if exists "newsletter: solo el equipo lee" on newsletter_subs;
create policy "newsletter: solo el equipo lee"
  on newsletter_subs for select
  to authenticated
  using (is_admin());

drop policy if exists "newsletter: solo el equipo elimina" on newsletter_subs;
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

drop trigger if exists team_members_set_updated_at on team_members;
create trigger team_members_set_updated_at
  before update on team_members
  for each row execute function set_updated_at();

alter table team_members enable row level security;

drop policy if exists "team: lectura pública" on team_members;
create policy "team: lectura pública"
  on team_members for select
  to anon, authenticated
  using (true);

drop policy if exists "team: solo el equipo escribe" on team_members;
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

drop trigger if exists services_set_updated_at on services;
create trigger services_set_updated_at
  before update on services
  for each row execute function set_updated_at();

alter table services enable row level security;

drop policy if exists "services: lectura pública" on services;
create policy "services: lectura pública"
  on services for select
  to anon, authenticated
  using (true);

drop policy if exists "services: solo el equipo escribe" on services;
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
  team_visible boolean not null default false,

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

drop trigger if exists page_config_set_updated_at on page_config;
create trigger page_config_set_updated_at
  before update on page_config
  for each row execute function set_updated_at();

alter table page_config enable row level security;

drop policy if exists "config: lectura pública" on page_config;
create policy "config: lectura pública"
  on page_config for select
  to anon, authenticated
  using (true);

drop policy if exists "config: solo el equipo escribe" on page_config;
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

drop policy if exists "storage: lectura pública de imágenes" on storage.objects;
create policy "storage: lectura pública de imágenes"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('project-images', 'project-docs'));

drop policy if exists "storage: solo el equipo sube" on storage.objects;
create policy "storage: solo el equipo sube"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('project-images', 'project-docs') and is_admin());

drop policy if exists "storage: solo el equipo borra" on storage.objects;
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


-- =====================================================================
-- 2/5 — Configuración del sitio (fila única de page_config)
-- =====================================================================

/*
  # Seed mínimo — solo la fila de configuración

  Proyectos, inversiones, equipo y servicios NO se seedean: los fixtures de
  `src/data/fixtures.ts` son contenido de demostración y la empresa carga los
  reales desde el panel. Sembrarlos acá obligaría a borrarlos a mano antes de
  salir a producción.

  `page_config` sí se siembra porque la app la asume siempre presente (el
  footer, el WhatsApp flotante y la sección Contacto la leen en cada página):
  sin fila, el sitio arranca vacío. Los valores son placeholders explícitos —
  reemplazarlos desde Configuración antes de publicar.
*/

insert into page_config (
  id,
  hero_scrub_enabled,
  contact_email,
  contact_phone,
  whatsapp_number,
  address,
  office_lat,
  office_lng,
  horario_atencion,
  zonas_cobertura,
  metrics_years,
  metrics_m2,
  metrics_projects,
  legal_name,
  cuit,
  matricula,
  domicilio_legal,
  disclaimer_oferta_publica,
  disclaimer_datos_personales
) values (
  1,
  false,
  'contacto@puntocerodesarrollos.com.ar',
  '+54 11 5555-0123',
  '5491155550123',
  'Av. del Libertador 5252, Piso 3, Vicente López, Buenos Aires',
  -34.5271,
  -58.4795,
  'Lunes a viernes de 9 a 18 h',
  array['CABA', 'Zona Norte', 'La Plata'],
  0,
  0,
  0,
  'Punto Cero Desarrollos S.A.',
  '30-71234567-8',
  'Mat. CUCICBA 6042 / CMCPSI 4318',
  'Av. del Libertador 5252, Piso 3, Vicente López, Buenos Aires',
  'Las oportunidades publicadas en este sitio no constituyen oferta pública de valores negociables en los términos de la Ley 26.831. Los retornos indicados son estimaciones y no constituyen garantía de resultado.',
  'Los datos personales recolectados a través de este sitio son tratados conforme a la Ley 25.326 de Protección de los Datos Personales. El titular puede ejercer los derechos de acceso, rectificación y supresión escribiendo a los canales de contacto publicados.'
)
on conflict (id) do nothing;


-- =====================================================================
-- 3/5 — Preguntas frecuentes editables desde el panel
-- =====================================================================

-- Preguntas frecuentes de inversores (INV-04), editables desde el panel.
--
-- Antes eran ocho objetos escritos a mano dentro de InvestorFaq.tsx. El copy
-- migra idéntico en el seed de abajo; lo que cambia es quién lo puede tocar:
-- las preguntas de un inversor se mueven con cada proyecto y con cada cambio
-- normativo, y hasta ahora corregir una coma pedía un deploy.
--
-- Calca la tabla `services`: mismo id uuid, mismo sort_order + índice, mismo
-- trigger de updated_at, mismas dos policies y los mismos GRANTs. La única
-- diferencia deliberada es que no hay `slug`: una pregunta no tiene URL propia,
-- así que un identificador legible no compraría nada y sí obligaría a inventar
-- (y validar) uno en cada alta.

create table if not exists faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Sin esto, un submit accidental del panel con los campos vacíos deja una
  -- fila fantasma que en el sitio se ve como un acordeón que no abre nada.
  constraint faq_items_question_no_vacia check (length(trim(question)) > 0),
  constraint faq_items_answer_no_vacia check (length(trim(answer)) > 0)
);

create index if not exists faq_items_order_idx on faq_items (sort_order);

drop trigger if exists faq_items_set_updated_at on faq_items;
create trigger faq_items_set_updated_at
  before update on faq_items
  for each row execute function set_updated_at();

alter table faq_items enable row level security;

drop policy if exists "faq_items: lectura pública" on faq_items;
create policy "faq_items: lectura pública"
  on faq_items for select
  to anon, authenticated
  using (true);

drop policy if exists "faq_items: solo el equipo escribe" on faq_items;
create policy "faq_items: solo el equipo escribe"
  on faq_items for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Los GRANTs van aparte de RLS y no son opcionales: sin el grant, PostgREST
-- corta con 42501 "permission denied" ANTES de evaluar cualquier policy, y la
-- sección se ve vacía sin ninguna pista de por qué.
grant select on faq_items to anon, authenticated;
grant select, insert, update, delete on faq_items to authenticated;

-- ------------------------------------------------------------------- seed

-- Excepción deliberada a la regla del repo de que el contenido de ejemplo va en
-- supabase/seed.sql y nunca en migrations/ (ver 20260809000002_seed.sql). Esa
-- regla existe para no empujar datos de demostración a producción, y acá no
-- aplica: estas ocho preguntas NO son de relleno, son el copy real de la
-- empresa sobre fideicomisos, riesgo y retorno, redactado para este sitio. Si
-- quedaran solo en el seed local, producción estrenaría la sección vacía.
--
-- `where not exists` y no un insert pelado por dos motivos: la migración tiene
-- que poder correrse dos veces sin duplicar —no hay UNIQUE que la frene, porque
-- no hay slug—, y no debe resucitar las preguntas que el equipo haya borrado a
-- propósito desde el panel después del primer despliegue.
insert into faq_items (question, answer, sort_order)
select * from (values
  (
    '¿Qué es un fideicomiso al costo?',
    'Es una estructura jurídica en la que los inversores aportan capital para desarrollar un proyecto y asumen el costo real de la obra, sin margen de desarrollador incorporado al precio. El fiduciario administra los fondos con un fin exclusivo: ejecutar el proyecto. El patrimonio del fideicomiso queda separado del de la desarrolladora y del de los propios inversores, lo que otorga una protección jurídica relevante.',
    0
  ),
  (
    '¿Qué riesgos tiene invertir en un desarrollo inmobiliario?',
    'Como toda inversión, implica riesgos: variaciones en el costo de construcción, plazos de obra, condiciones del mercado inmobiliario y del contexto macroeconómico. Ninguna cifra de retorno constituye una garantía. Trabajamos para mitigarlos con presupuestos auditados, contratos de obra cerrados, seguimiento técnico permanente e información periódica al inversor, pero el riesgo nunca es cero y así lo comunicamos.',
    1
  ),
  (
    '¿Cómo se calculan los retornos estimados?',
    'Surgen de la diferencia proyectada entre el costo total del desarrollo y el valor de venta estimado de las unidades, neta de gastos, honorarios e impuestos, distribuida en proporción a la participación de cada inversor. Son proyecciones basadas en valores de mercado al momento de la publicación: se actualizan durante la vida del proyecto y pueden variar.',
    2
  ),
  (
    '¿Cómo y cuándo se realizan los retornos?',
    'Depende de la estructura de cada oportunidad. En general, el retorno se materializa con la venta de las unidades al finalizar la obra, o mediante la adjudicación de unidades al inversor, quien puede venderlas o rentarlas. Algunos proyectos de renta distribuyen ingresos periódicos. El detalle de cada esquema figura en la documentación de la oportunidad.',
    3
  ),
  (
    '¿Cuál es el proceso para invertir?',
    'Primero coordinamos una reunión para entender su perfil y objetivos. Luego compartimos la documentación completa del proyecto: memoria técnica, flujo de fondos, contrato de fideicomiso y cronograma. Con la revisión hecha —recomendamos hacerlo con asesoramiento legal y contable propio— se firma la adhesión ante escribano y se integra el aporte según el plan acordado.',
    4
  ),
  (
    '¿Cuál es el monto mínimo y en qué moneda se invierte?',
    'Cada oportunidad define su monto mínimo de participación, que publicamos en la ficha correspondiente. Los proyectos suelen estar nominados en dólares estadounidenses, con esquemas de integración en cuotas ajustadas al avance de obra según el caso.',
    5
  ),
  (
    '¿Qué información recibo durante la vida del proyecto?',
    'Reportes periódicos de avance de obra con registro fotográfico, estado de aplicación de fondos y novedades relevantes del proyecto. Además, el inversor puede coordinar visitas a obra y consultas directas con nuestro equipo en cualquier etapa.',
    6
  ),
  (
    '¿Puedo salir de la inversión antes de la finalización?',
    'Los proyectos inmobiliarios son inversiones de mediano plazo y la permanencia hasta el término es el escenario previsto. No obstante, los contratos suelen contemplar la cesión de la posición fiduciaria a un tercero, sujeta a las condiciones establecidas en cada fideicomiso. Lo analizamos caso por caso.',
    7
  )
) as semilla(question, answer, sort_order)
where not exists (select 1 from faq_items);


-- =====================================================================
-- 4/5 — Endurecimiento de GRANTs y constraints
-- =====================================================================

-- Endurecimiento de GRANTs y constraints.
--
-- Cierra desalineaciones entre lo que garantiza src/data/ y lo que la base hace
-- cumplir. Todas son del mismo tipo: la app sostiene un invariante en el
-- formulario (zod) o en el repositorio (TypeScript) y la base no lo replica, así
-- que cualquier escritura que NO pase por el panel —SQL a mano, un script de
-- carga, o un POST directo a PostgREST con la anon key, que es pública por
-- diseño— lo rompe sin encontrar resistencia.
--
-- Ninguna regla de acá cambia el comportamiento actual de la app: los payloads
-- que hoy manda src/data/supabaseRepo.ts las cumplen todas. Es defensa en
-- profundidad, no un cambio de contrato.
--
-- Por qué los CHECK van NOT VALID: `add constraint ... check` valida las filas
-- existentes y aborta la migración entera si encuentra una sola que no cumpla.
-- En leads y newsletter_subs las filas las escribió un anónimo sin ninguna
-- validación del lado servidor, así que es perfectamente posible que ya haya
-- basura cargada — y voltear el deploy por eso es peor que el problema. NOT
-- VALID aplica la regla a TODO insert y update futuro, que es el 100% del
-- objetivo, y sólo se saltea el backfill. Al final quedan los VALIDATE para
-- correr a mano después de limpiar.
--
-- Idempotencia: `add constraint` y `create policy` no admiten `if not exists`,
-- así que cada uno va precedido de su `drop ... if exists`.

-- ------------------------------------------------------------------- leads

-- El GRANT de INSERT para anon era por TABLA —o sea, por todas las columnas— y
-- la policy era `with check (true)`. Combinados, un visitante podía POSTear a
-- /rest/v1/leads fijando `status`, `notes`, `id` y `created_at`, que son
-- columnas internas del pipeline comercial. En la práctica: una consulta podía
-- nacer en 'descartado' y no aparecer nunca en el embudo del panel, con notas
-- internas escritas por un tercero (el panel las renderiza), o con un
-- created_at futuro que la clava arriba de todo en el orden por defecto.
--
-- El GRANT por columna es la barrera real; la policy es la segunda capa.
revoke insert on leads from anon;

-- Exactamente las seis columnas que arma SupabaseLeadRepository.create(). El
-- resto toma su DEFAULT: status = 'nuevo', id = gen_random_uuid(),
-- created_at = now(). Sin este GRANT, PostgREST corta con 42501 ANTES de
-- evaluar cualquier policy y el formulario público deja de funcionar.
grant insert (name, email, phone, message, source, interest_slug)
  on leads to anon;

-- El formato de email lo valida hoy sólo zod en el navegador, que es
-- exactamente donde no vale como garantía.
alter table leads drop constraint if exists leads_email_formato;
alter table leads add constraint leads_email_formato
  check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$') not valid;

alter table leads drop constraint if exists leads_name_no_vacio;
alter table leads add constraint leads_name_no_vacio
  check (length(trim(name)) > 0) not valid;

-- --------------------------------------------------------- newsletter_subs

-- Mismo razonamiento que leads: subscribe() manda una sola columna.
revoke insert on newsletter_subs from anon;
grant insert (email) on newsletter_subs to anon;

-- Sin esto, un POST con {"email":""} inserta una fila que el panel lista como
-- suscriptor y que termina en el CSV de exportación.
alter table newsletter_subs drop constraint if exists newsletter_subs_email_formato;
alter table newsletter_subs add constraint newsletter_subs_email_formato
  check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$') not valid;

-- ------------------------------------------------------------ team_members

-- `not null` no impide la cadena vacía, y una foto vacía se renderiza como un
-- <img src=""> que el navegador dibuja como imagen rota en Quiénes somos.
alter table team_members drop constraint if exists team_members_campos_no_vacios;
alter table team_members add constraint team_members_campos_no_vacios
  check (
    length(trim(name)) > 0
    and length(trim(role)) > 0
    and length(trim(photo)) > 0
  ) not valid;

-- ---------------------------------------------------------------- services

alter table services drop constraint if exists services_campos_no_vacios;
alter table services add constraint services_campos_no_vacios
  check (
    length(trim(title)) > 0
    and length(trim(description)) > 0
    and length(trim(image)) > 0
  ) not valid;

-- ---------------------------------------------------------------- projects

-- El cronograma ya valida que sea un array y que haya exactamente una etapa
-- actual, pero no QUÉ etapas son válidas. El tipo de TypeScript las acota a
-- cuatro; la base aceptaba cualquier string. Con una etapa desconocida el sitio
-- no rompe: busca su etiqueta en un diccionario, no la encuentra y pinta un
-- título vacío en la ficha pública, que es peor que un error visible.
--
-- Función IMMUTABLE y no una subconsulta: Postgres prohíbe subconsultas dentro
-- de un CHECK. Es el mismo patrón que timeline_current_count().
create or replace function timeline_stages_validos(timeline jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce(
    bool_and(t->>'stage' in ('planificacion', 'diseno', 'construccion', 'entrega')),
    true
  )
  from jsonb_array_elements(timeline) t;
$$;

alter table projects drop constraint if exists projects_timeline_etapas_validas;
alter table projects add constraint projects_timeline_etapas_validas
  check (timeline_stages_validos(timeline)) not valid;

-- ------------------------------------------------------------------ notas
--
-- Después de aplicar esto, revisar que no haya filas viejas que incumplan y
-- recién entonces validar las constraints. Cada VALIDATE toma un lock suave
-- (SHARE UPDATE EXCLUSIVE): no bloquea lecturas ni escrituras normales.
--
--   select id, email from leads
--     where email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$';
--   select id, email from newsletter_subs
--     where email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$';
--
--   alter table leads validate constraint leads_email_formato;
--   alter table leads validate constraint leads_name_no_vacio;
--   alter table newsletter_subs validate constraint newsletter_subs_email_formato;
--   alter table team_members validate constraint team_members_campos_no_vacios;
--   alter table services validate constraint services_campos_no_vacios;
--   alter table projects validate constraint projects_timeline_etapas_validas;


-- =====================================================================
-- 5/5 — CONTENIDO DE DEMOSTRACIÓN (opcional)
--
-- 6 proyectos, 4 oportunidades, 4 servicios, 4 integrantes. Sirve para ver el
-- sitio lleno mientras se prueba; NO es contenido real de la empresa.
--
-- Los DELETE de arriba hacen que se pueda volver a correr sin duplicar. Para
-- sacarlo todo cuando cargues lo tuyo, corré sólo esos DELETE (están repetidos
-- al final de este archivo, comentados).
-- =====================================================================

/*
  # Seed de DEMOSTRACIÓN — solo entorno local

  Este archivo lo aplica `supabase start` / `supabase db reset` en local, y
  NUNCA `supabase db push` a producción (que solo corre migrations/). Por eso
  el contenido de demo vive acá y no en una migración: la base real la carga la
  empresa desde el panel.

  Sirve para que el sitio corriendo contra Supabase local se vea igual de
  completo que corriendo contra los datos mock — si no, al conectar el backend
  la home queda sin proyectos ni oportunidades y parece rota.

  GENERADO desde src/data/fixtures.ts. No editar a mano: volver a generar.
*/

-- Idempotente: `supabase db reset` ya recrea el schema, pero correr el seed
-- dos veces sobre una base viva no debe duplicar nada.
delete from investments;
delete from projects;
delete from services;
delete from team_members;
delete from faq_items;


-- ------------------------------------------------------------ projects

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'torre-libertador', 'Torre Libertador', 'Torre residencial de 22 pisos sobre Av. del Libertador, con unidades de 2 a 4 ambientes, amenities completos y vistas abiertas al río. Estructura de hormigón visto y carpinterías de doble vidriado hermético.', 'Vicente López, Buenos Aires',
  'residencial', 'en-obra', 'https://images.pexels.com/photos/35282689/pexels-photo-35282689.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/35282689/pexels-photo-35282689.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/30832160/pexels-photo-30832160.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/11968124/pexels-photo-11968124.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/38525110/pexels-photo-38525110.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie total","value":"18.400 m²"},{"label":"Unidades","value":"96"},{"label":"Pisos","value":"22"},{"label":"Cocheras","value":"110"},{"label":"Amenities","value":"Piscina, gym, SUM, coworking"}]'::jsonb, '[{"name":"Brochure comercial (PDF)","url":"/docs/torre-libertador-brochure.pdf","sizeLabel":"2,4 MB","kind":"brochure"},{"name":"Planos de tipologías (PDF)","url":"/docs/torre-libertador-planos.pdf","sizeLabel":"3,1 MB","kind":"planos"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2023-03-01","completedAt":"2023-09-15"},{"stage":"diseno","current":false,"startedAt":"2023-09-15","completedAt":"2024-04-30"},{"stage":"construccion","current":true,"startedAt":"2024-05-02","notes":"Avance de obra 62% — hormigón completo hasta piso 18"},{"stage":"entrega","current":false}]'::jsonb,
  -34.5265, -58.4765, true, false, true, '2024-05-02T12:00:00.000Z'
);

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'edificio-alamos', 'Edificio Álamos', 'Edificio boutique de 8 niveles en el corazón de Palermo Botánico. Unidades premium con balcones aterrazados, parrilla propia y planta baja comercial. Fachada de líneas puras con parasoles de aluminio anodizado.', 'Palermo, CABA',
  'residencial', 'terminado', 'https://images.pexels.com/photos/13197873/pexels-photo-13197873.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/13197873/pexels-photo-13197873.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/2674418/pexels-photo-2674418.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/21418646/pexels-photo-21418646.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/6436782/pexels-photo-6436782.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie total","value":"4.850 m²"},{"label":"Unidades","value":"28"},{"label":"Pisos","value":"8"},{"label":"Locales comerciales","value":"2"}]'::jsonb, '[{"name":"Brochure comercial (PDF)","url":"/docs/edificio-alamos-brochure.pdf","sizeLabel":"1,8 MB","kind":"brochure"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2020-02-01","completedAt":"2020-08-01"},{"stage":"diseno","current":false,"startedAt":"2020-08-01","completedAt":"2021-03-01"},{"stage":"construccion","current":false,"startedAt":"2021-03-15","completedAt":"2023-06-30"},{"stage":"entrega","current":true,"startedAt":"2023-07-01","completedAt":"2023-11-30","notes":"Entregado — posesión completa"}]'::jsonb,
  -34.5828, -58.4177, true, false, true, '2023-11-30T12:00:00.000Z'
);

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'costa-tigre', 'Complejo Costa Tigre', 'Masterplan de usos mixtos frente al río Luján: tres torres residenciales, paseo comercial a cielo abierto y marina privada. Concepto en desarrollo — imágenes correspondientes a renders del anteproyecto.', 'Tigre, Buenos Aires',
  'mixto', 'en-pozo', 'https://images.pexels.com/photos/29791458/pexels-photo-29791458.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/29791458/pexels-photo-29791458.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/28494626/pexels-photo-28494626.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/38289824/pexels-photo-38289824.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/34360423/pexels-photo-34360423.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie del predio","value":"4,2 ha"},{"label":"Superficie construible","value":"52.000 m²"},{"label":"Torres","value":"3 (18 pisos c/u)"},{"label":"Amarras","value":"40"}]'::jsonb, '[{"name":"Masterplan conceptual (PDF)","url":"/docs/costa-tigre-planos.pdf","sizeLabel":"4,6 MB","kind":"planos"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2025-04-01","completedAt":"2025-12-15"},{"stage":"diseno","current":true,"startedAt":"2026-01-10","notes":"Anteproyecto aprobado — desarrollo de documentación ejecutiva"},{"stage":"construccion","current":false},{"stage":"entrega","current":false}]'::jsonb,
  -34.4241, -58.5796, true, true, true, '2026-01-10T12:00:00.000Z'
);

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'oficinas-distrito-norte', 'Oficinas Distrito Norte', 'Edificio corporativo AAA de plantas libres de 850 m², certificación LEED Silver, doble altura en acceso y 4 subsuelos de cocheras. Fachada vidriada de alta eficiencia energética.', 'Olivos, Buenos Aires',
  'comercial', 'terminado', 'https://images.pexels.com/photos/37320179/pexels-photo-37320179.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/37320179/pexels-photo-37320179.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/5230087/pexels-photo-5230087.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/946310/pexels-photo-946310.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/27322345/pexels-photo-27322345.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie total","value":"12.600 m²"},{"label":"Plantas","value":"10 libres de 850 m²"},{"label":"Certificación","value":"LEED Silver"},{"label":"Cocheras","value":"180"}]'::jsonb, '[{"name":"Ficha técnica (PDF)","url":"/docs/oficinas-distrito-norte-otro.pdf","sizeLabel":"1,1 MB","kind":"otro"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2019-05-01","completedAt":"2019-11-01"},{"stage":"diseno","current":false,"startedAt":"2019-11-01","completedAt":"2020-06-01"},{"stage":"construccion","current":false,"startedAt":"2020-07-01","completedAt":"2022-09-30"},{"stage":"entrega","current":true,"startedAt":"2022-10-01","completedAt":"2022-12-20","notes":"Entregado — 100% alquilado"}]'::jsonb,
  -34.5089, -58.4863, true, false, true, '2022-12-20T12:00:00.000Z'
);

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'barrio-los-nogales', 'Barrio Los Nogales', 'Urbanización privada de 120 lotes con club house, canchas y 3 ha de espacios verdes parquizados. Infraestructura subterránea completa. Imágenes correspondientes a renders del proyecto.', 'Pilar, Buenos Aires',
  'residencial', 'en-pozo', 'https://images.pexels.com/photos/31640055/pexels-photo-31640055.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/31640055/pexels-photo-31640055.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/31640048/pexels-photo-31640048.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/32220111/pexels-photo-32220111.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/33515015/pexels-photo-33515015.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie del predio","value":"18 ha"},{"label":"Lotes","value":"120 (600–900 m²)"},{"label":"Espacios verdes","value":"3 ha"},{"label":"Club house","value":"1.200 m²"}]'::jsonb, '[{"name":"Masterplan (PDF)","url":"/docs/barrio-los-nogales-planos.pdf","sizeLabel":"3,8 MB","kind":"planos"}]'::jsonb, '[{"stage":"planificacion","current":true,"startedAt":"2026-02-01","notes":"Factibilidades municipales en trámite"},{"stage":"diseno","current":false},{"stage":"construccion","current":false},{"stage":"entrega","current":false}]'::jsonb,
  -34.4587, -58.9142, false, true, true, '2026-02-01T12:00:00.000Z'
);

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'centro-logistico-ruta-8', 'Centro Logístico Ruta 8', 'Parque logístico de 3 naves AAA con altura libre de 12 m, pisos superplanos, 40 docks y playa de maniobras de hormigón. Obra de infraestructura vial de acceso incluida en el desarrollo.', 'Pilar, Buenos Aires',
  'infraestructura', 'en-obra', 'https://images.pexels.com/photos/2804929/pexels-photo-2804929.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/2804929/pexels-photo-2804929.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/35501715/pexels-photo-35501715.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/18078304/pexels-photo-18078304.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/33804931/pexels-photo-33804931.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie cubierta","value":"36.000 m²"},{"label":"Naves","value":"3"},{"label":"Altura libre","value":"12 m"},{"label":"Docks","value":"40"}]'::jsonb, '[{"name":"Ficha técnica (PDF)","url":"/docs/centro-logistico-ruta-8-otro.pdf","sizeLabel":"1,4 MB","kind":"otro"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2024-08-01","completedAt":"2025-01-31"},{"stage":"diseno","current":false,"startedAt":"2025-02-01","completedAt":"2025-07-15"},{"stage":"construccion","current":true,"startedAt":"2025-08-01","notes":"Nave 1 completa, nave 2 en montaje de estructura"},{"stage":"entrega","current":false}]'::jsonb,
  -34.4374, -58.9718, false, false, true, '2025-08-01T12:00:00.000Z'
);


-- --------------------------------------------------------- investments

insert into investments (
  slug, title, description, amount, currency, est_return, term_months, status,
  project_id, cover_image, docs, fiduciario, tipo_estructura, ticket_minimo,
  moneda, integracion, hitos_desembolso, salida, escribania, published, created_at
) values (
  'fideicomiso-torre-libertador', 'Fideicomiso Torre Libertador', 'Participación en fideicomiso al costo sobre unidades de 2 y 3 ambientes en Torre Libertador. Obra en ejecución con avance verificable mensualmente. Salida por venta de unidad terminada o cesión de posición.', 120000, 'USD',
  '14–18% anual estimado en USD', 30, 'activa',
  (select id from projects where slug = 'torre-libertador'), 'https://images.pexels.com/photos/35282689/pexels-photo-35282689.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', '[{"name":"Term sheet (PDF)","url":"/docs/fideicomiso-torre-libertador-term-sheet.pdf","sizeLabel":"620 KB","kind":"term-sheet"},{"name":"Contrato marco de fideicomiso (PDF)","url":"/docs/fideicomiso-torre-libertador-contrato.pdf","sizeLabel":"1,3 MB","kind":"contrato"}]'::jsonb, '{"nombre":"Fiduciaria Andes S.A.","tipo":"Fiduciario financiero registrado en CNV"}'::jsonb,
  'Fideicomiso al costo', 120000, 'USD',
  '[{"etapa":"Adhesión","porcentaje":30,"momento":"A la firma del boleto de fideicomiso"},{"etapa":"Aportes durante obra","porcentaje":50,"momento":"6 cuotas mensuales iguales, atadas al certificado de avance"},{"etapa":"Saldo final","porcentaje":20,"momento":"Contra escritura traslativa de dominio"}]'::jsonb, '[{"hito":"Estructura hasta piso 10","avanceObra":"45%","fecha":"2025-03-01"},{"hito":"Estructura completa (piso 22)","avanceObra":"70%","fecha":"2025-11-01"},{"hito":"Terminaciones y entrega","avanceObra":"100%","fecha":"2026-10-01"}]'::jsonb,
  'Venta de la unidad asignada al inversor una vez escriturada, o cesión de la posición fiduciaria a un tercero con conformidad del fiduciario, en cualquier momento posterior a la adhesión.', 'Escribanía Roca & Asociados', true, '2025-11-15T12:00:00.000Z'
);

insert into investments (
  slug, title, description, amount, currency, est_return, term_months, status,
  project_id, cover_image, docs, fiduciario, tipo_estructura, ticket_minimo,
  moneda, integracion, hitos_desembolso, salida, escribania, published, created_at
) values (
  'costa-tigre-etapa-1', 'Costa Tigre — Etapa 1', 'Inversión temprana en la primera torre del masterplan Costa Tigre, con ticket de ingreso en etapa de diseño y curva de valorización proyectada hasta la entrega. Estructura de fideicomiso al costo con auditoría externa.', 80000, 'USD',
  '20–25% total estimado a término, en USD', 48, 'activa',
  (select id from projects where slug = 'costa-tigre'), 'https://images.pexels.com/photos/29791458/pexels-photo-29791458.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', '[{"name":"Memorando de inversión (PDF)","url":"/docs/costa-tigre-etapa-1-memorando.pdf","sizeLabel":"1,9 MB","kind":"memorando"}]'::jsonb, '{"nombre":"BAP Fiduciaria S.A.","tipo":"Fiduciario financiero registrado en CNV"}'::jsonb,
  'Fideicomiso al costo', 80000, 'USD',
  '[{"etapa":"Reserva","porcentaje":15,"momento":"A la firma de la carta de reserva"},{"etapa":"Adhesión al fideicomiso","porcentaje":25,"momento":"A los 30 días de la reserva, contra firma del boleto"},{"etapa":"Aportes durante obra","porcentaje":45,"momento":"12 cuotas trimestrales, atadas al certificado de avance"},{"etapa":"Saldo final","porcentaje":15,"momento":"Contra escritura traslativa de dominio de la Torre 1"}]'::jsonb, '[{"hito":"Documentación ejecutiva y permisos","avanceObra":"0%","fecha":"2026-09-01"},{"hito":"Inicio de fundaciones Torre 1","avanceObra":"10%","fecha":"2027-02-01"},{"hito":"Estructura completa Torre 1","avanceObra":"55%","fecha":"2028-06-01"},{"hito":"Terminaciones y entrega Torre 1","avanceObra":"100%","fecha":"2029-08-01"}]'::jsonb,
  'Reventa de la posición fiduciaria en el mercado secundario habilitado por el fiduciario, o liquidación conjunta con la entrega de la Torre 1, estimada para agosto de 2029.', 'Escribanía Roca & Asociados', true, '2026-02-20T12:00:00.000Z'
);

insert into investments (
  slug, title, description, amount, currency, est_return, term_months, status,
  project_id, cover_image, docs, fiduciario, tipo_estructura, ticket_minimo,
  moneda, integracion, hitos_desembolso, salida, escribania, published, created_at
) values (
  'nave-3-centro-logistico', 'Nave 3 — Centro Logístico Ruta 8', 'Renta logística: participación sobre la nave 3 con contrato de alquiler corporativo pre-acordado a 5 años, ajuste semestral y salida por venta del activo estabilizado.', 150000, 'USD',
  '9–11% anual estimado en USD (renta) + upside de venta', 60, 'proximamente',
  (select id from projects where slug = 'centro-logistico-ruta-8'), 'https://images.pexels.com/photos/2804929/pexels-photo-2804929.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', '[{"name":"Teaser (PDF)","url":"/docs/nave-3-centro-logistico-otro.pdf","sizeLabel":"540 KB","kind":"otro"}]'::jsonb, '{"nombre":"Global Trust Fiduciaria S.A.","tipo":"Fiduciario financiero registrado en CNV"}'::jsonb,
  'Fideicomiso a valor fijo', 150000, 'USD',
  '[{"etapa":"Adhesión","porcentaje":40,"momento":"A la apertura del fideicomiso, prevista para el inicio de obra de nave 3"},{"etapa":"Aportes durante obra","porcentaje":40,"momento":"4 cuotas trimestrales, atadas al certificado de avance de nave 3"},{"etapa":"Saldo final","porcentaje":20,"momento":"Contra habilitación municipal y firma del contrato de alquiler"}]'::jsonb, '[{"hito":"Apertura del fideicomiso e inicio de obra nave 3","avanceObra":"0%","fecha":"2026-11-01"},{"hito":"Estructura y piso industrial de nave 3","avanceObra":"60%","fecha":"2027-06-01"},{"hito":"Habilitación y puesta en renta","avanceObra":"100%","fecha":"2027-11-01"}]'::jsonb,
  'Distribución de renta semestral durante el plazo del contrato de alquiler y venta del activo estabilizado al término de los 60 meses, con reparto proporcional a la posición fiduciaria.', 'Escribanía Núñez & Fresco', true, '2026-05-05T12:00:00.000Z'
);

insert into investments (
  slug, title, description, amount, currency, est_return, term_months, status,
  project_id, cover_image, docs, fiduciario, tipo_estructura, ticket_minimo,
  moneda, integracion, hitos_desembolso, salida, escribania, published, created_at
) values (
  'edificio-alamos-cierre', 'Edificio Álamos — Ciclo completo', 'Fideicomiso cerrado y liquidado. Caso testigo del ciclo completo de inversión Punto Cero: ingreso en pozo, obra en 27 meses y liquidación total dentro del plazo proyectado.', 60000, 'USD',
  '16,4% anual efectivo en USD (resultado final del ciclo)', 36, 'cerrada',
  (select id from projects where slug = 'edificio-alamos'), 'https://images.pexels.com/photos/13197873/pexels-photo-13197873.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', '[{"name":"Informe de cierre (PDF)","url":"/docs/edificio-alamos-cierre-otro.pdf","sizeLabel":"980 KB","kind":"otro"}]'::jsonb, '{"nombre":"Fiduciaria Andes S.A.","tipo":"Fiduciario financiero registrado en CNV"}'::jsonb,
  'Fideicomiso al costo', 60000, 'USD',
  '[{"etapa":"Adhesión","porcentaje":30,"momento":"A la firma del boleto de fideicomiso (febrero 2020)"},{"etapa":"Aportes durante obra","porcentaje":50,"momento":"8 cuotas trimestrales, integradas entre 2021 y 2023"},{"etapa":"Saldo final","porcentaje":20,"momento":"Contra escritura traslativa de dominio (noviembre 2023)"}]'::jsonb, '[{"hito":"Inicio de obra","avanceObra":"0%","fecha":"2021-03-15"},{"hito":"Estructura completa","avanceObra":"55%","fecha":"2022-05-01"},{"hito":"Terminaciones y entrega","avanceObra":"100%","fecha":"2023-11-30"},{"hito":"Liquidación del fideicomiso","avanceObra":"100%","fecha":"2024-01-31"}]'::jsonb,
  'Liquidado — el fiduciario distribuyó el resultado final del ciclo a los inversores en enero de 2024, tras la venta de la totalidad de las unidades asignadas al fideicomiso.', 'Escribanía Roca & Asociados', true, '2023-12-15T12:00:00.000Z'
);


-- ------------------------------------------------------------ services

insert into services (slug, title, description, image, sort_order) values ('desarrollo-inmobiliario', 'Desarrollo inmobiliario', 'Originamos y lideramos proyectos de principio a fin: detección de oportunidades, estructuración del negocio, gestión integral y comercialización.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/482e7b6a-168c-4d0d-b35d-0e2ff4014577_1600w.webp', 0);
insert into services (slug, title, description, image, sort_order) values ('arquitectura-y-diseno', 'Arquitectura y diseño', 'Proyectos con identidad: anteproyecto, documentación ejecutiva y dirección de diseño con foco en el valor de largo plazo.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0dccab47-16b0-4716-9e1a-b97f124e3031_1600w.webp', 1);
insert into services (slug, title, description, image, sort_order) values ('construccion-y-obra', 'Construcción y dirección de obra', 'Ejecución con equipos propios y contratistas calificados, dirección técnica, control de avance e infraestructura completa.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/952269bf-60f5-48dc-afce-13953bead1eb_1600w.webp', 2);
insert into services (slug, title, description, image, sort_order) values ('financiamiento-e-inversiones', 'Financiamiento e inversiones', 'Estructuración financiera y oportunidades de inversión: fideicomisos al costo, esquemas de aportes y seguimiento de cada etapa.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/aa5ed4de-1a7e-4bb7-b0ea-1a4c511663df_1600w.webp', 3);


-- -------------------------------------------------------- team_members

insert into team_members (name, role, photo, bio, sort_order) values ('Arq. Mariano Recalde', 'Socio fundador — Dirección de proyectos', 'https://images.pexels.com/photos/37605831/pexels-photo-37605831.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Arquitecto UBA con más de 20 años liderando desarrollos residenciales y corporativos en Buenos Aires.', 0);
insert into team_members (name, role, photo, bio, sort_order) values ('Ing. Carolina Bruzzone', 'Socia — Dirección de obra', 'https://images.pexels.com/photos/7937658/pexels-photo-7937658.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Ingeniera civil UTN, especialista en gestión de obra y estructuras de hormigón. Dirigió más de 150.000 m² construidos.', 1);
insert into team_members (name, role, photo, bio, sort_order) values ('Lic. Federico Anzorena', 'Director de inversiones', 'https://images.pexels.com/photos/7580766/pexels-photo-7580766.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Licenciado en finanzas, estructuró fideicomisos inmobiliarios por más de USD 40 millones en los últimos 10 años.', 2);
insert into team_members (name, role, photo, bio, sort_order) values ('Arq. Julieta Sansone', 'Directora de diseño', 'https://images.pexels.com/photos/36646353/pexels-photo-36646353.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Arquitecta UTDT. Lidera el estudio de diseño de Punto Cero con foco en arquitectura de líneas puras y eficiencia.', 3);

-- ------------------------------------------------------------ faq_items

insert into faq_items (question, answer, sort_order) values ('¿Qué es un fideicomiso al costo?', 'Es una estructura jurídica en la que los inversores aportan capital para desarrollar un proyecto y asumen el costo real de la obra, sin margen de desarrollador incorporado al precio. El fiduciario administra los fondos con un fin exclusivo: ejecutar el proyecto. El patrimonio del fideicomiso queda separado del de la desarrolladora y del de los propios inversores, lo que otorga una protección jurídica relevante.', 0);
insert into faq_items (question, answer, sort_order) values ('¿Qué riesgos tiene invertir en un desarrollo inmobiliario?', 'Como toda inversión, implica riesgos: variaciones en el costo de construcción, plazos de obra, condiciones del mercado inmobiliario y del contexto macroeconómico. Ninguna cifra de retorno constituye una garantía. Trabajamos para mitigarlos con presupuestos auditados, contratos de obra cerrados, seguimiento técnico permanente e información periódica al inversor, pero el riesgo nunca es cero y así lo comunicamos.', 1);
insert into faq_items (question, answer, sort_order) values ('¿Cómo se calculan los retornos estimados?', 'Surgen de la diferencia proyectada entre el costo total del desarrollo y el valor de venta estimado de las unidades, neta de gastos, honorarios e impuestos, distribuida en proporción a la participación de cada inversor. Son proyecciones basadas en valores de mercado al momento de la publicación: se actualizan durante la vida del proyecto y pueden variar.', 2);
insert into faq_items (question, answer, sort_order) values ('¿Cómo y cuándo se realizan los retornos?', 'Depende de la estructura de cada oportunidad. En general, el retorno se materializa con la venta de las unidades al finalizar la obra, o mediante la adjudicación de unidades al inversor, quien puede venderlas o rentarlas. Algunos proyectos de renta distribuyen ingresos periódicos. El detalle de cada esquema figura en la documentación de la oportunidad.', 3);
insert into faq_items (question, answer, sort_order) values ('¿Cuál es el proceso para invertir?', 'Primero coordinamos una reunión para entender su perfil y objetivos. Luego compartimos la documentación completa del proyecto: memoria técnica, flujo de fondos, contrato de fideicomiso y cronograma. Con la revisión hecha —recomendamos hacerlo con asesoramiento legal y contable propio— se firma la adhesión ante escribano y se integra el aporte según el plan acordado.', 4);
insert into faq_items (question, answer, sort_order) values ('¿Cuál es el monto mínimo y en qué moneda se invierte?', 'Cada oportunidad define su monto mínimo de participación, que publicamos en la ficha correspondiente. Los proyectos suelen estar nominados en dólares estadounidenses, con esquemas de integración en cuotas ajustadas al avance de obra según el caso.', 5);
insert into faq_items (question, answer, sort_order) values ('¿Qué información recibo durante la vida del proyecto?', 'Reportes periódicos de avance de obra con registro fotográfico, estado de aplicación de fondos y novedades relevantes del proyecto. Además, el inversor puede coordinar visitas a obra y consultas directas con nuestro equipo en cualquier etapa.', 6);
insert into faq_items (question, answer, sort_order) values ('¿Puedo salir de la inversión antes de la finalización?', 'Los proyectos inmobiliarios son inversiones de mediano plazo y la permanencia hasta el término es el escenario previsto. No obstante, los contratos suelen contemplar la cesión de la posición fiduciaria a un tercero, sujeta a las condiciones establecidas en cada fideicomiso. Lo analizamos caso por caso.', 7);


-- ------------------------------------------------------ métricas de demo

-- La migración deja las tres métricas en 0 a propósito: son un placeholder
-- explícito para que nadie publique cifras inventadas sin darse cuenta. Pero el
-- sitio OCULTA la sección entera cuando las tres valen cero —"0 años de
-- trayectoria" en la home de una desarrolladora comunica lo contrario de lo que
-- esa sección existe para comunicar—, así que con el seed de demostración
-- conviene darles valores para ver la home completa.
--
-- ⚠ Son de DEMOSTRACIÓN. Reemplazalos por los reales desde el panel, en
-- Configuración → Métricas, antes de mostrarle el sitio a alguien.
update page_config
set metrics_years = 18,
    metrics_m2 = 185000,
    metrics_projects = 42
where id = 1;

-- =====================================================================
-- ÚLTIMO PASO — el usuario del panel (a mano, dos clicks)
--
-- 1. Dashboard → Authentication → Users → "Add user" → "Create new user".
--    Email: equipo@puntocero.com
--    Password: la que elijas
--    ⚠ Tildar "Auto Confirm User" — sin eso queda pendiente de confirmación
--      y no puede entrar.
--
-- 2. Volver acá y ejecutar esto, que lo agrega a la allowlist. Estar
--    autenticado en Supabase NO alcanza para entrar al panel: quien decide es
--    esta tabla, la misma que consultan las políticas RLS vía is_admin().
-- =====================================================================

insert into admin_users (user_id, email, full_name)
select id, email, 'Equipo Punto Cero'
from auth.users
where email = 'equipo@puntocero.com'
on conflict (user_id) do nothing;

-- Verificación: tiene que devolver una fila.
select email, full_name from admin_users;

-- =====================================================================
-- Para borrar el contenido de demostración cuando cargues el real:
--
--   delete from investments;
--   delete from projects;
--   delete from services;
--   delete from team_members;
--   delete from faq_items;
-- =====================================================================
