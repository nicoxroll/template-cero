# Supabase — cómo conectar

El schema está escrito y **verificado corriéndolo de verdad** contra una
Postgres 17 local (`supabase start`): las dos migraciones aplican limpio, los
`CHECK` rechazan lo que tienen que rechazar y las políticas RLS se comportaron
como se esperaba con un visitante anónimo, un usuario logueado fuera de la
allowlist y un usuario del equipo. El detalle de esa verificación está más
abajo.

La app todavía corre sobre `LocalStorageRepo` (datos mock): falta el paso 3-7
de esta guía para enchufarla.

## Entorno local (funcionando)

```bash
npx supabase start     # necesita Docker Desktop abierto
npx supabase db reset  # reaplica migraciones desde cero
npx supabase stop      # apaga los contenedores
```

| Servicio | URL |
|---|---|
| API REST | `http://127.0.0.1:44321/rest/v1` |
| Studio | `http://127.0.0.1:44323` |
| Postgres | `127.0.0.1:44322` (`postgres` / `postgres`) |
| Mailpit (mails de auth) | `http://127.0.0.1:44324` |

> **Por qué los puertos son 443xx y no los 543xx de fábrica:** Windows reserva
> rangos TCP dinámicos para Hyper-V y ahí caen **todos** los defaults de
> Supabase. Con los originales, `supabase start` muere con
> `bind: An attempt was made to access a socket in a way forbidden by its
> access permissions`.
>
> Ya pasó dos veces: primero el rango `54248-54447` se comió los defaults, y
> después `55273-55372` se comió los 553xx elegidos para escapar del primero.
> Esa segunda vez fue peor porque no falló ruidosamente: los contenedores
> levantaban `healthy` pero **sin publicar los puertos**, así que Postgres
> aceptaba conexiones adentro del contenedor y nada llegaba desde el host.
>
> Por eso ahora son 443xx: **por debajo de 49152**, que es donde arranca el
> rango dinámico que Windows se reserva solo. Ahí no hay nada que se los pueda
> volver a comer. Para ver los rangos vedados en una máquina:
> `netsh interface ipv4 show excludedportrange protocol=tcp`.
>
> Están en `config.toml`; el `.env` local tiene que apuntar al mismo puerto.

### El seed de demostración

`seed.sql` lo aplican `supabase start` y `db reset` en local, y **nunca**
`db push` a producción, que solo corre `migrations/`. Por eso el contenido de
demo vive ahí y no en una migración: la base real la carga la empresa desde el
panel.

Existe porque, sin él, conectar el backend hacía que el sitio se viera **peor**
que con los datos mock: la home quedaba sin proyectos destacados ni
oportunidades, con headings sobre grillas vacías. Ahora local y mock muestran lo
mismo — 6 proyectos (4 destacados, todos con coordenadas para el mapa), 4
oportunidades, 4 servicios, 4 integrantes y 8 preguntas frecuentes.

Ese inventario es el checklist con el que se verifica que el seed corrió
completo, así que tiene que coincidir con `src/data/fixtures.ts` exactamente. Si
dice de más, quien lo siga va a concluir que el seed corrió a medias.

Está **generado desde `src/data/fixtures.ts`**, no escrito a mano: transcribir
seis proyectos con jsonb anidado y cuatro fideicomisos con cronogramas de
aportes es garantía de erratas, y de que el seed se desincronice del mock en
cuanto alguien toque los fixtures. Si cambian los fixtures, se regenera.

### Servicios apagados (y por qué)

El stack de fábrica levanta 12 contenedores; este proyecto usa 8 (~750 MiB).
En `config.toml` están en `enabled = false`:

| Servicio | Motivo |
|---|---|
| `realtime` | No hay suscripciones en vivo — ni `.channel()` ni `.subscribe()` en `src/`. |
| `edge_runtime` | No hay Edge Functions. Su runtime de Deno es de los contenedores más pesados. |
| `analytics` (+ `vector`) | Solo alimenta la pestaña Logs de Studio, y arrastra dos contenedores. En Windows `supabase_vector` entra en **crashloop** (`Restarting (0)` cada 15 s) por permisos del socket de Docker. |

Los logs siguen disponibles con `docker logs supabase_<servicio>_punto-cero`.
Si más adelante hace falta alguno (p. ej. `edge_runtime` para la notificación
de leads por email), se vuelve a poner en `true` y `supabase start` lo levanta.

## Archivos

| Archivo | Qué es |
|---|---|
| `migrations/20260809000001_initial_schema.sql` | Tablas, índices, triggers, RLS y buckets de Storage |
| `migrations/20260809000002_seed.sql` | Solo la fila de `page_config` (el resto lo carga la empresa desde el panel) |
| `seed.sql` | Contenido de **demostración, solo local** — ver abajo |
| `../src/data/supabaseClient.ts` | Cliente, comentado hasta que existan las variables de entorno |
| `../src/data/supabaseMappers.ts` | Traducción fila snake_case ↔ tipo de dominio camelCase |
| `../src/data/repositories.ts` | El contrato que ambas implementaciones cumplen |

## Estado de la integración

La app **ya está conectada**: `src/data/index.ts` elige la implementación sola.

| | |
|---|---|
| Con `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | `Supabase*Repository` (datos reales) |
| Sin ellas | `LocalStorage*Repository` (mock, sin backend) |

Es automático y no un flag para que el repo se pueda clonar y correr con
`npm run dev` sin configurar nada, y el mismo build apunte a la base real
apenas exista el `.env`.

El login del panel también es real: `supabase.auth.signInWithPassword` + la
allowlist de `admin_users`. Estar autenticado **no alcanza** — quien decide es
la misma tabla que consultan las políticas RLS vía `is_admin()`.

### Verificación de los repositorios

Los 7 repositorios y el login se ejercitaron contra la Postgres local
bundleando los módulos reales de `src/data` con esbuild y corriéndolos en Node
(no una reimplementación de las queries): **56 checks, 0 fallas**. Cubre el
mapeo de jsonb anidado y `text[]`, el join `projectSlug ↔ project_id` en ambas
direcciones (incluido desvincular con `null`), que los `update` parciales no
pisen columnas ausentes, que `listPublished`/`getBySlug` no filtren borradores,
que `ON DELETE SET NULL` deje la inversión desvinculada en vez de borrarla,
que suscribirse dos veces al newsletter no duplique, y que sin sesión no se
pueda escribir.

### Usuario de prueba del entorno local

```
equipo@puntocero.com / Prueba1234!
```

**`supabase db reset` lo borra.** `seed.sql` no lo recrea a propósito: los
usuarios viven en el esquema `auth` con la contraseña hasheada, y escribir ahí a
mano depende de la versión interna de GoTrue. Para volver a crearlo:

```bash
SERVICE=$(npx supabase status -o env | grep -oP "(?<=^SECRET_KEY=).*")
curl -s -X POST "http://127.0.0.1:44321/auth/v1/admin/users" \
  -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" -H "Content-Type: application/json" \
  -d '{"email":"equipo@puntocero.com","password":"Prueba1234!","email_confirm":true}'

# y darlo de alta en la allowlist (sin esto entra a Supabase pero no al panel)
docker exec -i supabase_db_punto-cero psql -U postgres -d postgres -c \
  "insert into admin_users (user_id, email, full_name)
   select id, email, 'Equipo Punto Cero' from auth.users where email='equipo@puntocero.com'
   on conflict (user_id) do nothing;"
```

## Pasos para pasar a producción

Los pasos de código ya están hechos (cliente instalado, repositorios escritos,
auth real). Queda solo lo de infraestructura:

1. **Crear el proyecto** en supabase.com y anotar `Project URL` y `anon public key`
   (Settings → API).

2. **Correr las migraciones**, en orden. Con el CLI:

   ```bash
   npx supabase link --project-ref <ref> --agent no
   npx supabase db push --agent no
   ```

   O pegando cada `.sql` en el SQL Editor del dashboard, primero el schema y
   después el seed.

   > El `--agent no` es obligatorio en la terminal integrada de VS Code: el CLI
   > detecta las variables de Claude Code y se pone en modo JSON no-interactivo,
   > donde cualquier comando que pregunte algo falla con `NonInteractiveError`.

3. **Apuntar `.env` al proyecto hosted** (hoy apunta al local):

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

   La anon key es pública por diseño — quien protege los datos es RLS, no la
   clave. `.env` está en `.gitignore` igual.

4. **Dar de alta al equipo.** Crear los usuarios en Authentication → Users y
   después agregarlos a la allowlist; estar autenticado no alcanza para entrar
   al panel:

   ```sql
   insert into admin_users (user_id, email, full_name)
   values ('<uuid del usuario>', 'nombre@puntocero.com', 'Nombre Apellido');
   ```

5. **Cargar el contenido inicial desde el panel.** El seed solo crea la fila de
   `page_config`: proyectos, inversiones, equipo y servicios los carga la
   empresa. Los fixtures de `src/data/fixtures.ts` son contenido de
   demostración del modo mock y no se migran.

## Qué se verificó (y qué encontró la verificación)

Correr el schema de verdad encontró **tres bugs que en papel no se veían**:

1. **`is_admin()` declarada antes de `admin_users`.** En una función
   `language sql` el cuerpo se valida al crearla (a diferencia de `plpgsql`,
   que lo difiere): fallaba con `relation "admin_users" does not exist`.
   Corregido moviendo la función después de la tabla.

2. **Subqueries en `CHECK`.** Postgres los prohíbe
   (`cannot use subquery in check constraint`), y los dos invariantes de
   dominio los usaban. Extraídos a las funciones `IMMUTABLE`
   `timeline_current_count()` e `integracion_percent_sum()`.

3. **RLS sin `GRANT` = sitio roto.** Son dos capas independientes: sin los
   privilegios SQL de tabla, PostgREST corta con
   `42501 permission denied for table …` **antes** de evaluar las políticas.
   Con las policies perfectas, todas las consultas públicas fallaban. Agregada
   la sección `GRANTS` al final de la migración.

Comportamiento confirmado end-to-end contra la API REST local:

| Actor | Acción | Resultado |
|---|---|---|
| Anónimo | `GET /projects` | Solo los publicados |
| Anónimo | `GET /projects?slug=eq.<borrador>` | `[]` — adivinar el slug no sirve |
| Anónimo | `POST /leads` | `201` — el formulario público escribe |
| Anónimo | `GET /leads` | Denegado — datos de terceros (Ley 25.326) |
| Anónimo | `PATCH /projects` | `401` |
| Logueado, fuera de allowlist | `POST /projects` | `403` |
| Logueado, fuera de allowlist | `GET /leads` | `[]` |
| Equipo (en `admin_users`) | `POST /projects` | `201` |
| Equipo | `GET /leads` | Los ve, con `status` en `nuevo` |
| Equipo | `PATCH` publicar / editar config | `204` |

Constraints probados uno por uno: dos etapas `current` → rechazado; una →
aceptado; slug con mayúsculas → rechazado; latitud fuera de rango → rechazado;
integración que no suma 100% → rechazada; `fiduciario` sin `nombre` → rechazado;
WhatsApp con espacios → rechazado; trigger de `updated_at` → dispara.

## Decisiones del schema

- **`slug` es la clave de negocio, `id uuid` la técnica.** La app navega por
  slug (`/proyectos/:slug`); las FK y Storage usan el uuid.

- **jsonb para los objetos de valor anidados** (specs, docs, timeline,
  integración, hitos, fiduciario). Son listas cortas que siempre se leen
  completas con su fila padre y nunca se filtran por sus campos internos;
  normalizarlas serían 6 tablas satélite y 6 joins para pintar una card. Cada
  columna lleva un `CHECK` de forma para que un insert malformado falle en la
  DB, no en el render.

- **Invariantes de dominio replicados en la DB**: exactamente una etapa
  `current` por proyecto, y los porcentajes de integración sumando 100. Ya los
  sostienen los formularios; el `CHECK` cubre cualquier otro cliente (script de
  carga, SQL a mano).

- **`published` gobierna la visibilidad.** Las políticas de lectura anónima
  filtran por `published = true`: un borrador es invisible aunque alguien
  adivine su slug.

- **Leads: insert anónimo, lectura solo del equipo.** El formulario público
  escribe sin sesión, pero nadie sin sesión puede listar datos personales de
  terceros (Ley 25.326). Sin política de `select` para `anon`, la tabla es
  opaca.

## Lo que queda pendiente

- **Subida de archivos.** Los buckets `project-images` y `project-docs` ya
  existen con sus políticas de RLS; falta el componente de upload que reemplace
  los campos de URL de `ProjectForm` / `InvestmentForm` y de las fotos del
  equipo.
- **`id` de leads y suscripciones recién creados.** El visitante anónimo tiene
  `INSERT` pero no `SELECT` (a propósito: Ley 25.326), así que
  `leadRepo.create()` y `newsletterRepo.subscribe()` no pueden leer la fila que
  acaban de escribir y devuelven `id: ''`. Hoy no molesta porque los
  formularios públicos solo muestran un mensaje de éxito. Si alguna vista
  necesitara el id real, la salida es una función `SECURITY DEFINER` que
  inserte y devuelva solo el id.
- **Notificación de leads por email.** Database Webhook → Edge Function →
  Resend, si el equipo prefiere el aviso al mail antes que revisar el panel.
