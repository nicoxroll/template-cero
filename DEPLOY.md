# Guía de Despliegue en Vercel y Configuración de Dominio Propio 🚀

Esta guía detalla paso a paso cómo desplegar **Template Cero** en Vercel, configurar variables de entorno, conectar Supabase y vincular tu propio dominio personalizado con HTTPS automático.

---

## 📋 Índice
1. [Requisitos Previos](#1-requisitos-previos)
2. [Paso 1: Despliegue en Vercel](#paso-1-despliegue-en-vercel)
3. [Paso 2: Variables de Entorno en Vercel](#paso-2-variables-de-entorno-en-vercel)
4. [Paso 3: Configuración de Dominio Personalizado](#paso-3-configuración-de-dominio-personalizado)
5. [Paso 4: Conexión con Supabase (Base de Datos Real)](#paso-4-conexión-con-supabase-base-de-datos-real)
6. [Credenciales de Acceso al Panel de Administración](#credenciales-de-acceso-al-panel-de-administración)

---

## 1. Requisitos Previos

- Una cuenta en [GitHub](https://github.com) con el repositorio subido (ej: `nicoxroll/template-cero`).
- Una cuenta gratuita en [Vercel](https://vercel.com) (puedes iniciar sesión con tu cuenta de GitHub).
- Un dominio registrado en cualquier registrador (DonWeb, Nic.ar, GoDaddy, Namecheap, Cloudflare, Hostinger, etc.).

---

## Paso 1: Despliegue en Vercel

1. Inicia sesión en [Vercel](https://vercel.com).
2. En el panel principal (Dashboard), haz clic en el botón azul **"Add New..."** -> **"Project"**.
3. En la lista **"Import Git Repository"**, busca y selecciona tu repositorio: `template-cero`. Haz clic en **"Import"**.
4. En la pantalla de configuración del proyecto:
   - **Project Name:** Puedes dejar `template-cero` o el nombre de tu cliente.
   - **Framework Preset:** Vercel detectará automáticamente **Vite**.
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Haz clic en el botón **"Deploy"**.
6. En aproximadamente 60 segundos, Vercel compilará la aplicación y te entregará una URL pública gratuita con terminación `.vercel.app` (por ejemplo: `https://template-cero.vercel.app`).

> [!NOTE]
> El proyecto ya incluye un archivo [`vercel.json`](vercel.json) configurado que garantiza el correcto funcionamiento del ruteo SPA en todas las páginas (`/proyectos`, `/inversiones`, `/admin`, etc.) sin errores 404 al recargar la página.

---

## Paso 2: Variables de Entorno en Vercel

Si deseas conectar la base de datos real de Supabase o Google Analytics:

1. En tu proyecto de Vercel, ve a la pestaña **Settings** (arriba) -> **Environment Variables** (menú izquierdo).
2. Agrega las siguientes variables:
   - `VITE_SUPABASE_URL`: `https://tu-proyecto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `tu-clave-anonima-publica`
   - `VITE_GA4_ID`: *(Opcional)* tu identificador de Google Analytics (ej: `G-XXXXXXXXXX`).
3. Haz clic en **Save**.

> [!IMPORTANT]
> **Vite hornea las variables durante el Build:**  
> Cada vez que agregues o modifiques variables de entorno en Vercel, debes ir a la pestaña **Deployments**, hacer clic en los tres puntos `...` del último despliegue y seleccionar **Redeploy** para que los cambios surtan efecto en el código empaquetado.

---

## Paso 3: Configuración de Dominio Personalizado

Para que tu sitio web abra con tu propio dominio (ej: `tuempresa.com` o `www.tuempresa.com`):

### 1. Agregar el dominio en Vercel:
1. En tu proyecto de Vercel, ve a **Settings** -> **Domains**.
2. Escribe tu dominio en el campo de texto (ejemplo: `tuempresa.com`) y haz clic en **Add**.
3. Vercel te preguntará si deseas redirigir `tuempresa.com` a `www.tuempresa.com` (recomendado) o viceversa. Selecciona la opción recomendada.

### 2. Configurar los registros DNS en tu proveedor de dominio:
Ingresa al panel de control donde compraste el dominio (Cloudflare, GoDaddy, DonWeb, Hostinger, etc.) y ve a la sección de **Gestión de DNS** o **Zona DNS**:

| Tipo de Registro | Nombre / Host | Valor / Destino | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` (o déjalo en blanco según el proveedor) | `76.76.21.21` | Automático / 3600 |
| **CNAME** | `www` | `cname.vercel-dns.com` | Automático / 3600 |

### 3. Verificación y Certificado SSL (HTTPS):
- Una vez guardados los registros DNS, Vercel verificará la conexión automáticamente en pocos minutos (la propagación DNS puede tomar entre 5 minutos y 2 horas).
- Vercel emitirá automáticamente un certificado SSL gratuito mediante Let's Encrypt. Cuando veas el tilde verde **Valid Configuration**, tu sitio ya estará en vivo y seguro con `https://`.

---

## Paso 4: Conexión con Supabase (Base de Datos Real)

Si vas a usar Supabase como backend:

1. Crea un proyecto nuevo en [Supabase](https://supabase.com).
2. En el panel lateral, ve a **SQL Editor** -> **New query**.
3. Abre el archivo [`supabase/schema.sql`](supabase/schema.sql) de este repositorio, copia **todo el contenido** y pégalo en el editor de Supabase.
4. Haz clic en **Run**. El script creará automáticamente:
   - Todas las 13 tablas necesarias (`projects`, `investments`, `leads`, `team_members`, etc.).
   - Triggers y políticas RLS seguras.
   - Buckets de Supabase Storage para fotos y documentos (`assets`, `project-images`, `project-docs`).
   - Datos iniciales completos.
5. Copia tu URL y clave anónima desde **Project Settings** -> **API** y colócalas en las variables de entorno de Vercel (o en tu archivo `.env` local).

---

## 🔐 Credenciales de Acceso al Panel de Administración

Para probar el panel de administración y editar el sitio:

- **Ruta de acceso:** `https://tudominio.com/admin` (o `/admin` en tu entorno local).

### Modo 1: Sin Supabase (Modo Demostración Local)
Si no configuraste variables de entorno de Supabase, la plantilla funciona al 100% de manera autónoma en modo mock:
- **Email de prueba:** `admin@templatecero.com` (o cualquier email válido)
- **Contraseña:** `admin123` (o cualquier contraseña)
- *Todos los cambios se guardan en el almacenamiento local de tu navegador y puedes probar la edición en vivo al instante.*

### Modo 2: Con Supabase Conectado
Si conectaste Supabase, la tabla `admin_users` ya incluye pre-autorizados los emails:
- `admin@templatecero.com`
- `equipo@templatecero.com`

**Para crear tu usuario en Supabase:**
1. En tu dashboard de Supabase, ve a **Authentication** -> **Users**.
2. Haz clic en **Add user** -> **Create new user**.
3. Ingresa `admin@templatecero.com` (o `equipo@templatecero.com`) y escribe la contraseña que elijas.
4. **IMPORTANTE:** Marca la casilla **"Auto Confirm User"** para que el usuario pueda ingresar de inmediato sin esperar confirmación por correo.
5. ¡Listo! Ya puedes iniciar sesión en `/admin`.

---

## 🛠️ Herramientas de Personalización en Vivo (CMS Live)

Una vez que inicias sesión en el panel y regresas al sitio web principal:
- Verás la barra flotante **CMS Live** en la esquina inferior izquierda.
- Puedes hacer clic en **"Editar Página"** para activar los lápices de edición sobre cualquier sección de la página y cambiar textos e imágenes in-situ.
- Puedes hacer clic en **"Personalizar Plantilla"** para cambiar el nombre de la empresa, slogan y la paleta de colores (`Esmeralda`, `Índigo`, `Pizarra`, `Ámbar`) con un solo clic en tiempo real.
