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
