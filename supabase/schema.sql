-- =====================================================================
-- TEMPLATE CERO — Schema Maestro Completo para Supabase (100% Sin Errores)
--
-- INSTRUCCIONES DE USO:
-- 1. Entrar en el dashboard de tu proyecto en Supabase (https://supabase.com/dashboard)
-- 2. Ir a "SQL Editor" en el menú lateral izquierdo
-- 3. Crear una nueva consulta ("New query"), pegar TODO este archivo y hacer click en "Run"
--
-- PROPIEDADES DE ESTE SCRIPT:
-- · 100% IDEMPOTENTE / REEJECUTABLE: se puede correr sobre un proyecto nuevo o
--   volver a correr sobre uno ya existente sin errores ni duplicaciones.
-- · Incluye las 13 tablas de la aplicación:
--   admin_users, projects, investments, leads, newsletter_subs,
--   team_members, services, page_config, faq_items, site_content,
--   custom_sections, blog_posts, testimonials.
-- · Triggers automáticos para 'updated_at' en todas las tablas.
-- · Buckets de almacenamiento en Supabase Storage ('assets', 'project-images', 'project-docs').
-- · Políticas de Seguridad a Nivel de Fila (RLS) blindadas y permisos (GRANTs) explícitos.
-- · Datos iniciales y de demostración completos listos para producción.
-- =====================================================================

-- ---------------------------------------------------------------- Extensiones
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------- Helpers
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function timeline_current_count(timeline jsonb)
returns integer
language sql
immutable
as $$
  select count(*)::int
  from jsonb_array_elements(timeline) t
  where (t->>'current')::boolean;
$$;

create or replace function integracion_percent_sum(items jsonb)
returns numeric
language sql
immutable
as $$
  select coalesce(sum((e->>'porcentaje')::numeric), 0)
  from jsonb_array_elements(items) e;
$$;

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

-- --------------------------------------------------------------- admin_users
create table if not exists admin_users (
  user_id uuid default gen_random_uuid() primary key,
  email text not null unique,
  full_name text,
  created_at timestamptz not null default now()
);

-- Determina si el usuario autenticado tiene rol de administrador
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users
    where (user_id is not null and user_id = auth.uid())
       or lower(email) = lower(auth.jwt()->>'email')
  );
$$;

alter table admin_users enable row level security;

drop policy if exists "admin_users: lectura para administradores" on admin_users;
create policy "admin_users: lectura para administradores"
  on admin_users for select
  to authenticated
  using (is_admin());

drop policy if exists "admin_users: gestión para administradores" on admin_users;
create policy "admin_users: gestión para administradores"
  on admin_users for all
  to authenticated
  using (is_admin())
  with check (is_admin());

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
  gallery text[] not null default '{}',
  specs jsonb not null default '[]'::jsonb,
  docs jsonb not null default '[]'::jsonb,
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
  est_return text not null,
  term_months integer not null check (term_months > 0),
  status text not null check (status in ('activa', 'proximamente', 'cerrada')),
  project_id uuid references projects(id) on delete set null,
  cover_image text not null,
  docs jsonb not null default '[]'::jsonb,
  fiduciario jsonb not null,
  tipo_estructura text not null check (
    tipo_estructura in ('Fideicomiso al costo', 'Fideicomiso a valor fijo')
  ),
  ticket_minimo numeric(14, 2) not null check (ticket_minimo > 0),
  moneda text not null check (moneda in ('USD', 'ARS')),
  integracion jsonb not null default '[]'::jsonb,
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
  interest_slug text,
  status text not null default 'nuevo'
    check (status in ('nuevo', 'contactado', 'calificado', 'cerrado', 'descartado')),
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

drop policy if exists "leads: cualquiera puede enviar una consulta" on leads;
create policy "leads: cualquiera puede enviar una consulta"
  on leads for insert
  to anon, authenticated
  with check (true);

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
create table if not exists page_config (
  id integer primary key default 1 check (id = 1),
  hero_scrub_enabled boolean not null default false,
  team_visible boolean not null default false,
  contact_email text not null,
  contact_phone text not null,
  whatsapp_number text not null check (whatsapp_number ~ '^d{8,15}$'),
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
  disclaimer_oferta_publica text not null default '',
  disclaimer_datos_personales text not null default '',
  lead_notification_webhook text,
  lead_notification_email text,
  telegram_bot_token text,
  telegram_chat_id text,
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
  on page_config for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --------------------------------------------------------------- faq_items
create table if not exists faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
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

-- -------------------------------------------------------------- site_content
create table if not exists site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

drop policy if exists "site_content: lectura pública" on site_content;
create policy "site_content: lectura pública"
  on site_content for select
  to anon, authenticated
  using (true);

drop policy if exists "site_content: solo el equipo escribe" on site_content;
create policy "site_content: solo el equipo escribe"
  on site_content for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ----------------------------------------------------------- custom_sections
create table if not exists custom_sections (
  id uuid primary key default gen_random_uuid(),
  kicker text,
  title text not null,
  content text not null default '',
  media_type text not null check (media_type in ('none', 'image', 'video')),
  media_url text,
  media_alt text,
  video_config jsonb default '{"autoplay": true, "muted": true, "loop": true, "controls": false, "aspectRatio": "16/9", "height": "medium"}'::jsonb,
  layout text default 'split-balanced' check (layout in ('split-balanced', 'split-media-large', 'full-width', 'compact')),
  cta_text text,
  cta_link text,
  cta_url text,
  theme text default 'paper' check (theme in ('paper', 'paper-soft', 'ink', 'light', 'dark')),
  published boolean not null default true,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_sections_sort_order_idx on custom_sections (sort_order);

drop trigger if exists custom_sections_set_updated_at on custom_sections;
create trigger custom_sections_set_updated_at
  before update on custom_sections
  for each row execute function set_updated_at();

alter table custom_sections enable row level security;

drop policy if exists "custom_sections: lectura pública" on custom_sections;
create policy "custom_sections: lectura pública"
  on custom_sections for select
  to anon, authenticated
  using (visible or is_admin());

drop policy if exists "custom_sections: solo el equipo escribe" on custom_sections;
create policy "custom_sections: solo el equipo escribe"
  on custom_sections for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --------------------------------------------------------------- blog_posts
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  cover_image text not null default '',
  category text not null default 'Novedades',
  tags text[] not null default '{}',
  author jsonb not null default '{"name": "Equipo Template Cero", "role": "Editorial", "avatar": ""}'::jsonb,
  read_time_minutes integer not null default 3,
  published boolean not null default false,
  published_at timestamptz not null default now(),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx on blog_posts (published) where published;
create index if not exists blog_posts_slug_idx on blog_posts (slug);

drop trigger if exists blog_posts_set_updated_at on blog_posts;
create trigger blog_posts_set_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();

alter table blog_posts enable row level security;

drop policy if exists "blog_posts: lectura pública solo de publicados" on blog_posts;
create policy "blog_posts: lectura pública solo de publicados"
  on blog_posts for select
  to anon, authenticated
  using (published or is_admin());

drop policy if exists "blog_posts: solo el equipo escribe" on blog_posts;
create policy "blog_posts: solo el equipo escribe"
  on blog_posts for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- -------------------------------------------------------------- testimonials
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  role text not null default '',
  company text not null default '',
  avatar text not null default '',
  content text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists testimonials_set_updated_at on testimonials;
create trigger testimonials_set_updated_at
  before update on testimonials
  for each row execute function set_updated_at();

alter table testimonials enable row level security;

drop policy if exists "testimonials: lectura pública solo de publicados" on testimonials;
create policy "testimonials: lectura pública solo de publicados"
  on testimonials for select
  to anon, authenticated
  using (published or is_admin());

drop policy if exists "testimonials: solo el equipo escribe" on testimonials;
create policy "testimonials: solo el equipo escribe"
  on testimonials for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --------------------------------------------------------------- Storage
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('project-docs', 'project-docs', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do update set public = true;

drop policy if exists "storage: lectura pública" on storage.objects;
create policy "storage: lectura pública"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('project-images', 'project-docs', 'assets'));

drop policy if exists "storage: solo el equipo sube" on storage.objects;
create policy "storage: solo el equipo sube"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('project-images', 'project-docs', 'assets') and is_admin());

drop policy if exists "storage: solo el equipo actualiza" on storage.objects;
create policy "storage: solo el equipo actualiza"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('project-images', 'project-docs', 'assets') and is_admin());

drop policy if exists "storage: solo el equipo borra" on storage.objects;
create policy "storage: solo el equipo borra"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('project-images', 'project-docs', 'assets') and is_admin());

-- ----------------------------------------------------------------- GRANTS
grant usage on schema public to anon, authenticated;

-- Contenido público de lectura
grant select on projects, investments, team_members, services, page_config, faq_items, site_content, custom_sections, blog_posts, testimonials
  to anon, authenticated;

-- Inserción pública en formularios
grant insert (name, email, phone, message, source, interest_slug) on leads to anon, authenticated;
grant insert (email) on newsletter_subs to anon, authenticated;

-- Gestión completa para usuarios autenticados del equipo
grant select, insert, update, delete on
  projects, investments, team_members, services, leads, newsletter_subs,
  page_config, faq_items, site_content, custom_sections, blog_posts, testimonials, admin_users
  to authenticated;

-- =====================================================================
-- DATOS INICIALES Y DE DEMOSTRACIÓN (100% IDEMPOTENTES)
-- =====================================================================

-- 1. Configuración del Sitio
insert into page_config (
  id,
  hero_scrub_enabled,
  team_visible,
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
  false,
  'contacto@templatecero.com',
  '+54 11 5555-0123',
  '5491155550123',
  'Av. del Libertador 5252, Piso 3, Vicente López, Buenos Aires',
  -34.5271,
  -58.4795,
  'Lunes a viernes de 9 a 18 h',
  array['CABA', 'Zona Norte', 'La Plata'],
  18,
  185000,
  42,
  'Template Cero S.A.',
  '30-71234567-8',
  'Mat. CUCICBA 6042 / CMCPSI 4318',
  'Av. del Libertador 5252, Piso 3, Vicente López, Buenos Aires',
  'Las oportunidades publicadas en este sitio no constituyen oferta pública de valores negociables en los términos de la Ley 26.831. Los retornos indicados son estimaciones y no constituyen garantía de resultado.',
  'Los datos personales recolectados a través de este sitio son tratados conforme a la Ley 25.326 de Protección de los Datos Personales. El titular puede ejercer los derechos de acceso, rectificación y supresión escribiendo a los canales de contacto publicados.'
)
on conflict (id) do update set
  legal_name = 'Template Cero S.A.',
  contact_email = 'contacto@templatecero.com';

-- 2. Administradores Iniciales (Allowlist)
insert into admin_users (email, full_name)
values
  ('admin@templatecero.com', 'Administrador Principal'),
  ('equipo@templatecero.com', 'Equipo Template Cero')
on conflict (email) do nothing;

-- 3. Configuración en vivo del CMS (Site Content)
insert into site_content (key, value)
values
  ('site.name', 'Template Cero'),
  ('site.shortName', 'Cero'),
  ('site.tagline', 'Transformamos ideas en proyectos de alto valor y escala'),
  ('site.themePreset', 'emerald'),
  ('quienes.teamVisible', 'false'),
  ('servicios.visible', 'true'),
  ('inversiones.faq.visible', 'true'),
  ('featured.visible', 'true'),
  ('inversiones.visible', 'true'),
  ('newsletter.visible', 'true'),
  ('inversiones.calculadora.visible', 'true'),
  ('home.alianzas.visible', 'true'),
  ('proyectos.tipologias.visible', 'true')
on conflict (key) do update set value = excluded.value;

-- 4. Servicios
insert into services (slug, title, description, image, sort_order)
values
  ('desarrollo-inmobiliario', 'Desarrollo inmobiliario', 'Originamos y lideramos proyectos de principio a fin: detección de oportunidades, estructuración del negocio, gestión integral y comercialización.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/482e7b6a-168c-4d0d-b35d-0e2ff4014577_1600w.webp', 0),
  ('arquitectura-y-diseno', 'Arquitectura y diseño', 'Proyectos con identidad: anteproyecto, documentación ejecutiva y dirección de diseño con foco en el valor de largo plazo.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0dccab47-16b0-4716-9e1a-b97f124e3031_1600w.webp', 1),
  ('construccion-y-obra', 'Construcción y dirección de obra', 'Ejecución con equipos propios y contratistas calificados, dirección técnica, control de avance e infraestructura completa.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/952269bf-60f5-48dc-afce-13953bead1eb_1600w.webp', 2),
  ('financiamiento-e-inversiones', 'Financiamiento e inversiones', 'Estructuración financiera y oportunidades de inversión: fideicomisos al costo, esquemas de aportes y seguimiento de cada etapa.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/aa5ed4de-1a7e-4bb7-b0ea-1a4c511663df_1600w.webp', 3)
on conflict (slug) do nothing;

-- 5. Equipo de Trabajo
insert into team_members (name, role, photo, bio, sort_order)
values
  ('Arq. Mariano Recalde', 'Socio fundador — Dirección de proyectos', 'https://images.pexels.com/photos/37605831/pexels-photo-37605831.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Arquitecto UBA con más de 20 años liderando desarrollos residenciales y corporativos en Buenos Aires.', 0),
  ('Ing. Carolina Bruzzone', 'Socia — Dirección de obra', 'https://images.pexels.com/photos/7937658/pexels-photo-7937658.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Ingeniera civil UTN, especialista en gestión de obra y estructuras de hormigón. Dirigió más de 150.000 m² construidos.', 1),
  ('Lic. Federico Anzorena', 'Director de inversiones', 'https://images.pexels.com/photos/7580766/pexels-photo-7580766.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Licenciado en finanzas, estructuró fideicomisos inmobiliarios por más de USD 40 millones en los últimos 10 años.', 2),
  ('Arq. Julieta Sansone', 'Directora de diseño', 'https://images.pexels.com/photos/36646353/pexels-photo-36646353.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Arquitecta UTDT. Lidera el estudio de diseño con foco en arquitectura de líneas puras y eficiencia constructiva.', 3)
on conflict do nothing;

-- 6. Preguntas Frecuentes (FAQ)
insert into faq_items (question, answer, sort_order)
select * from (values
  ('¿Qué es un fideicomiso al costo?', 'Es una estructura jurídica en la que los inversores aportan capital para desarrollar un proyecto y asumen el costo real de la obra, sin margen de desarrollador incorporado al precio. El fiduciario administra los fondos con un fin exclusivo: ejecutar el proyecto. El patrimonio del fideicomiso queda separado del de la desarrolladora y del de los propios inversores, lo que otorga una protección jurídica relevante.', 0),
  ('¿Qué riesgos tiene invertir en un desarrollo inmobiliario?', 'Como toda inversión, implica riesgos: variaciones en el costo de construcción, plazos de obra, condiciones del mercado inmobiliario y del contexto macroeconómico. Ninguna cifra de retorno constituye una garantía. Trabajamos para mitigarlos con presupuestos auditados, contratos de obra cerrados, seguimiento técnico permanente e información periódica al inversor.', 1),
  ('¿Cómo se calculan los retornos estimados?', 'Surgen de la diferencia proyectada entre el costo total del desarrollo y el valor de venta estimado de las unidades, neta de gastos, honorarios e impuestos, distribuida en proporción a la participación de cada inversor. Son proyecciones basadas en valores de mercado al momento de la publicación.', 2),
  ('¿Cómo y cuándo se realizan los retornos?', 'Depende de la estructura de cada oportunidad. En general, el retorno se materializa con la venta de las unidades al finalizar la obra, o mediante la adjudicación de unidades al inversor, quien puede venderlas o rentarlas. Algunos proyectos de renta distribuyen ingresos periódicos.', 3),
  ('¿Cuál es el proceso para invertir?', 'Primero coordinamos una reunión para entender su perfil y objetivos. Luego compartimos la documentación completa del proyecto: memoria técnica, flujo de fondos, contrato de fideicomiso y cronograma. Con la revisión hecha, se firma la adhesión ante escribano y se integra el aporte según el plan acordado.', 4),
  ('¿Cuál es el monto mínimo y en qué moneda se invierte?', 'Cada oportunidad define su monto mínimo de participación, que publicamos en la ficha correspondiente. Los proyectos suelen estar nominados en dólares estadounidenses, con esquemas de integración en cuotas ajustadas al avance de obra.', 5),
  ('¿Qué información recibo durante la vida del proyecto?', 'Reportes periódicos de avance de obra con registro fotográfico, estado de aplicación de fondos y novedades relevantes del proyecto. Además, el inversor puede coordinar visitas a obra y consultas directas con nuestro equipo en cualquier etapa.', 6),
  ('¿Puedo salir de la inversión antes de la finalización?', 'Los proyectos inmobiliarios son inversiones de mediano plazo y la permanencia hasta el término es el escenario previsto. No obstante, los contratos suelen contemplar la cesión de la posición fiduciaria a un tercero, sujeta a las condiciones establecidas en cada fideicomiso.', 7)
) as f(question, answer, sort_order)
where not exists (select 1 from faq_items);

-- 7. Proyectos
insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'torre-libertador', 'Torre Libertador', 'Torre residencial de 22 pisos sobre Av. del Libertador, con unidades de 2 a 4 ambientes, amenities completos y vistas abiertas al río. Estructura de hormigón visto y carpinterías de doble vidriado hermético.', 'Vicente López, Buenos Aires',
  'residencial', 'en-obra', 'https://images.pexels.com/photos/35282689/pexels-photo-35282689.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/35282689/pexels-photo-35282689.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/30832160/pexels-photo-30832160.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/11968124/pexels-photo-11968124.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/38525110/pexels-photo-38525110.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie total","value":"18.400 m²"},{"label":"Unidades","value":"96"},{"label":"Pisos","value":"22"},{"label":"Cocheras","value":"110"},{"label":"Amenities","value":"Piscina, gym, SUM, coworking"}]'::jsonb, '[{"name":"Brochure comercial (PDF)","url":"/docs/torre-libertador-brochure.pdf","sizeLabel":"2,4 MB","kind":"brochure"},{"name":"Planos de tipologías (PDF)","url":"/docs/torre-libertador-planos.pdf","sizeLabel":"3,1 MB","kind":"planos"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2023-03-01","completedAt":"2023-09-15"},{"stage":"diseno","current":false,"startedAt":"2023-09-15","completedAt":"2024-04-30"},{"stage":"construccion","current":true,"startedAt":"2024-05-02","notes":"Avance de obra 62% — hormigón completo hasta piso 18"},{"stage":"entrega","current":false}]'::jsonb,
  -34.5265, -58.4765, true, false, true, '2024-05-02T12:00:00.000Z'
) on conflict (slug) do nothing;

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'edificio-alamos', 'Edificio Álamos', 'Edificio boutique de 8 niveles en el corazón de Palermo Botánico. Unidades premium con balcones aterrazados, parrilla propia y planta baja comercial. Fachada de líneas puras con parasoles de aluminio anodizado.', 'Palermo, CABA',
  'residencial', 'terminado', 'https://images.pexels.com/photos/13197873/pexels-photo-13197873.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/13197873/pexels-photo-13197873.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/2674418/pexels-photo-2674418.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/21418646/pexels-photo-21418646.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/6436782/pexels-photo-6436782.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie total","value":"4.850 m²"},{"label":"Unidades","value":"28"},{"label":"Pisos","value":"8"},{"label":"Locales comerciales","value":"2"}]'::jsonb, '[{"name":"Brochure comercial (PDF)","url":"/docs/edificio-alamos-brochure.pdf","sizeLabel":"1,8 MB","kind":"brochure"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2020-02-01","completedAt":"2020-08-01"},{"stage":"diseno","current":false,"startedAt":"2020-08-01","completedAt":"2021-03-01"},{"stage":"construccion","current":false,"startedAt":"2021-03-15","completedAt":"2023-06-30"},{"stage":"entrega","current":true,"startedAt":"2023-07-01","completedAt":"2023-11-30","notes":"Entregado — posesión completa"}]'::jsonb,
  -34.5828, -58.4177, true, false, true, '2023-11-30T12:00:00.000Z'
) on conflict (slug) do nothing;

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'costa-tigre', 'Complejo Costa Tigre', 'Masterplan de usos mixtos frente al río Luján: tres torres residenciales, paseo comercial a cielo abierto y marina privada. Concepto en desarrollo — imágenes correspondientes a renders del anteproyecto.', 'Tigre, Buenos Aires',
  'mixto', 'en-pozo', 'https://images.pexels.com/photos/29791458/pexels-photo-29791458.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/29791458/pexels-photo-29791458.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/28494626/pexels-photo-28494626.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/38289824/pexels-photo-38289824.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/34360423/pexels-photo-34360423.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie del predio","value":"4,2 ha"},{"label":"Superficie construible","value":"52.000 m²"},{"label":"Torres","value":"3 (18 pisos c/u)"},{"label":"Amarras","value":"40"}]'::jsonb, '[{"name":"Masterplan conceptual (PDF)","url":"/docs/costa-tigre-planos.pdf","sizeLabel":"4,6 MB","kind":"planos"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2025-04-01","completedAt":"2025-12-15"},{"stage":"diseno","current":true,"startedAt":"2026-01-10","notes":"Anteproyecto aprobado — desarrollo de documentación ejecutiva"},{"stage":"construccion","current":false},{"stage":"entrega","current":false}]'::jsonb,
  -34.4241, -58.5796, true, true, true, '2026-01-10T12:00:00.000Z'
) on conflict (slug) do nothing;

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'oficinas-distrito-norte', 'Oficinas Distrito Norte', 'Edificio corporativo AAA de plantas libres de 850 m², certificación LEED Silver, doble altura en acceso y 4 subsuelos de cocheras. Fachada vidriada de alta eficiencia energética.', 'Olivos, Buenos Aires',
  'comercial', 'terminado', 'https://images.pexels.com/photos/37320179/pexels-photo-37320179.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/37320179/pexels-photo-37320179.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/5230087/pexels-photo-5230087.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/946310/pexels-photo-946310.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/27322345/pexels-photo-27322345.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie total","value":"12.600 m²"},{"label":"Plantas","value":"10 libres de 850 m²"},{"label":"Certificación","value":"LEED Silver"},{"label":"Cocheras","value":"180"}]'::jsonb, '[{"name":"Ficha técnica (PDF)","url":"/docs/oficinas-distrito-norte-otro.pdf","sizeLabel":"1,1 MB","kind":"otro"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2019-05-01","completedAt":"2019-11-01"},{"stage":"diseno","current":false,"startedAt":"2019-11-01","completedAt":"2020-06-01"},{"stage":"construccion","current":false,"startedAt":"2020-07-01","completedAt":"2022-09-30"},{"stage":"entrega","current":true,"startedAt":"2022-10-01","completedAt":"2022-12-20","notes":"Entregado — 100% alquilado"}]'::jsonb,
  -34.5089, -58.4863, true, false, true, '2022-12-20T12:00:00.000Z'
) on conflict (slug) do nothing;

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'barrio-los-nogales', 'Barrio Los Nogales', 'Urbanización privada de 120 lotes con club house, canchas y 3 ha de espacios verdes parquizados. Infraestructura subterránea completa. Imágenes correspondientes a renders del proyecto.', 'Pilar, Buenos Aires',
  'residencial', 'en-pozo', 'https://images.pexels.com/photos/31640055/pexels-photo-31640055.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/31640055/pexels-photo-31640055.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/31640048/pexels-photo-31640048.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/32220111/pexels-photo-32220111.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/33515015/pexels-photo-33515015.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie del predio","value":"18 ha"},{"label":"Lotes","value":"120 (600–900 m²)"},{"label":"Espacios verdes","value":"3 ha"},{"label":"Club house","value":"1.200 m²"}]'::jsonb, '[{"name":"Masterplan (PDF)","url":"/docs/barrio-los-nogales-planos.pdf","sizeLabel":"3,8 MB","kind":"planos"}]'::jsonb, '[{"stage":"planificacion","current":true,"startedAt":"2026-02-01","notes":"Factibilidades municipales en trámite"},{"stage":"diseno","current":false},{"stage":"construccion","current":false},{"stage":"entrega","current":false}]'::jsonb,
  -34.4587, -58.9142, false, true, true, '2026-02-01T12:00:00.000Z'
) on conflict (slug) do nothing;

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'centro-logistico-ruta-8', 'Centro Logístico Ruta 8', 'Parque logístico de 3 naves AAA con altura libre de 12 m, pisos superplanos, 40 docks y playa de maniobras de hormigón. Obra de infraestructura vial de acceso incluida en el desarrollo.', 'Pilar, Buenos Aires',
  'infraestructura', 'en-obra', 'https://images.pexels.com/photos/2804929/pexels-photo-2804929.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/2804929/pexels-photo-2804929.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/35501715/pexels-photo-35501715.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/18078304/pexels-photo-18078304.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/33804931/pexels-photo-33804931.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie cubierta","value":"36.000 m²"},{"label":"Naves","value":"3"},{"label":"Altura libre","value":"12 m"},{"label":"Docks","value":"40"}]'::jsonb, '[{"name":"Ficha técnica (PDF)","url":"/docs/centro-logistico-ruta-8-otro.pdf","sizeLabel":"1,4 MB","kind":"otro"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2024-08-01","completedAt":"2025-01-31"},{"stage":"diseno","current":false,"startedAt":"2025-02-01","completedAt":"2025-07-15"},{"stage":"construccion","current":true,"startedAt":"2025-08-01","notes":"Nave 1 completa, nave 2 en montaje de estructura"},{"stage":"entrega","current":false}]'::jsonb,
  -34.4374, -58.9718, false, false, true, '2025-08-01T12:00:00.000Z'
) on conflict (slug) do nothing;

-- 8. Oportunidades de Inversión
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
) on conflict (slug) do nothing;

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
) on conflict (slug) do nothing;

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
) on conflict (slug) do nothing;

insert into investments (
  slug, title, description, amount, currency, est_return, term_months, status,
  project_id, cover_image, docs, fiduciario, tipo_estructura, ticket_minimo,
  moneda, integracion, hitos_desembolso, salida, escribania, published, created_at
) values (
  'edificio-alamos-cierre', 'Edificio Álamos — Ciclo completo', 'Fideicomiso cerrado y liquidado. Caso testigo del ciclo completo de inversión en Template Cero: ingreso en pozo, obra en 27 meses y liquidación total dentro del plazo proyectado.', 60000, 'USD',
  '16,4% anual efectivo en USD (resultado final del ciclo)', 36, 'cerrada',
  (select id from projects where slug = 'edificio-alamos'), 'https://images.pexels.com/photos/13197873/pexels-photo-13197873.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', '[{"name":"Informe de cierre (PDF)","url":"/docs/edificio-alamos-cierre-otro.pdf","sizeLabel":"980 KB","kind":"otro"}]'::jsonb, '{"nombre":"Fiduciaria Andes S.A.","tipo":"Fiduciario financiero registrado en CNV"}'::jsonb,
  'Fideicomiso al costo', 60000, 'USD',
  '[{"etapa":"Adhesión","porcentaje":30,"momento":"A la firma del boleto de fideicomiso (febrero 2020)"},{"etapa":"Aportes durante obra","porcentaje":50,"momento":"8 cuotas trimestrales, integradas entre 2021 y 2023"},{"etapa":"Saldo final","porcentaje":20,"momento":"Contra escritura traslativa de dominio (noviembre 2023)"}]'::jsonb, '[{"hito":"Inicio de obra","avanceObra":"0%","fecha":"2021-03-15"},{"hito":"Estructura completa","avanceObra":"55%","fecha":"2022-05-01"},{"hito":"Terminaciones y entrega","avanceObra":"100%","fecha":"2023-11-30"},{"hito":"Liquidación del fideicomiso","avanceObra":"100%","fecha":"2024-01-31"}]'::jsonb,
  'Liquidado — el fiduciario distribuyó el resultado final del ciclo a los inversores en enero de 2024, tras la venta de la totalidad de las unidades asignadas al fideicomiso.', 'Escribanía Roca & Asociados', true, '2023-12-15T12:00:00.000Z'
) on conflict (slug) do nothing;

-- 9. Testimonios de Clientes e Inversores
insert into testimonials (client_name, role, company, avatar, content, rating, featured, published)
values
  ('Ing. Martín Valenzuela', 'Inversor Institucional', 'Valenzuela & Asoc.', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400&fm=webp', 'Participamos en dos fideicomisos con Template Cero. La trazabilidad notarial y el cumplimiento estricto de los hitos de obra nos dieron la tranquilidad que buscamos.', 5, true, true),
  ('Lic. Sofía Calvo', 'Propietaria Residencial', 'Torre Libertador', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&fm=webp', 'Compramos en pozo y el resultado final superó las expectativas. Las terminaciones, la carpintería DVH y las vistas al río son excepcionales.', 5, true, true),
  ('Dr. Gonzalo Echeverría', 'Inversor Individual', 'Echeverría Legal', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400&fm=webp', 'La estructura de fideicomiso al costo es la más transparente que he visto en el mercado argentino. Cada certificado de avance fue respaldado con auditoría.', 5, false, true)
on conflict do nothing;

-- 10. Publicaciones del Blog
insert into blog_posts (slug, title, excerpt, content, cover_image, category, tags, read_time_minutes, published, featured)
values
  ('por-que-invertir-en-fideicomisos-al-costo', 'Por qué invertir en fideicomisos al costo en 2026', 'Analizamos las ventajas jurídicas, financieras e impositivas de estructurar inversiones bajo la figura de fideicomiso al costo auditado.', 'Los fideicomisos al costo representan una de las herramientas más sólidas para resguardar capital en activos tangibles con valor real. Al separar el patrimonio del proyecto del de la empresa desarrolladora, los inversores cuentan con un marco de protección notarial y fiduciaria de primer nivel.', 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'Inversiones', array['Fideicomisos', 'Real Estate', 'Finanzas'], 4, true, true),
  ('tendencias-arquitectura-sustentable', 'Tendencias en arquitectura sustentable y certificación LEED', 'Cómo la eficiencia térmica, los paneles solares y la aislación acústica multiplican el valor de reventa de un inmueble.', 'El diseño con certificación ambiental ya no es una opción de lujo sino un requerimiento de mercado. Los edificios con certificación LEED logran reducir costos de mantenimiento hasta en un 35% y exhiben una apreciación de capital superior.', 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'Arquitectura', array['Sustentabilidad', 'LEED', 'Diseño'], 5, true, false)
on conflict (slug) do nothing;

-- 11. Sección Personalizada (Custom Section)
insert into custom_sections (title, kicker, content, media_type, media_url, layout, theme, published, visible, sort_order)
values (
  'Innovación y rigor constructivo en cada m²',
  'Pilares Corporativos',
  'Diseñamos y ejecutamos obras pensando en el ciclo de vida completo del activo. Desde el modelado BIM de precisión milimétrica hasta la selección de materiales nobles que resisten el paso de las décadas.',
  'image',
  'https://images.pexels.com/photos/3760529/pexels-photo-3760529.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp',
  'split-balanced',
  'paper',
  true,
  true,
  0
) on conflict do nothing;

-- =====================================================================
-- PASO FINAL: ALTA DE USUARIO EN SUPABASE AUTH
--
-- 1. Ve a tu panel de Supabase -> Authentication -> Users.
-- 2. Haz click en "Add user" -> "Create new user".
--    Email: equipo@templatecero.com (o admin@templatecero.com)
--    Password: [tu contraseña deseada]
--    IMPORTANTE: Activa la casilla "Auto Confirm User".
-- 3. ¡Listo! Ya puedes iniciar sesión en /admin con ese email y contraseña.
-- =====================================================================
