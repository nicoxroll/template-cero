# Guía de Configuración de Supabase — Template Cero 🗄️

Por defecto, **Template Cero** funciona de manera autónoma sin ninguna base de datos configurada (utilizando datos de demostración en `localStorage`).

Cuando desees persistencia real, autenticación multi-usuario protegida por RLS (Row Level Security), almacenamiento de archivos e integración de leads, sigue esta guía paso a paso.

---

## ⚡ Paso a Paso: Puesta en Marcha

### 1. Crear un proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta o inicia sesión.
2. Haz clic en **"New Project"**.
3. Elige un nombre para el proyecto y una contraseña segura para la base de datos.
4. Espera aproximadamente 1-2 minutos mientras Supabase aprovisiona tu instancia de PostgreSQL.

---

### 2. Ejecutar el Esquema SQL Unificado
1. En el panel izquierdo de Supabase, haz clic en **SQL Editor** (ícono de terminal `>_`).
2. Haz clic en **"New Query"**.
3. Abre en tu editor local el archivo [`supabase/schema-completo.sql`](supabase/schema-completo.sql).
4. Copia todo su contenido, pégalo en el editor de Supabase y presiona **"Run"** (Ctrl+Enter / Cmd+Enter).

> [!NOTE]
> Este script crea de forma automática:
> - Todas las tablas necesarias (`projects`, `investments`, `leads`, `newsletter`, `site_content`, `site_config`, `admin_users`, `team_members`, `services`, `faq_items`).
> - Índices de alto rendimiento para búsquedas y slugs.
> - Políticas RLS (lectura pública para elementos publicados, escritura restringida a administradores).
> - Buckets de Storage para imágenes y documentos PDF.

---

### 3. Cargar Datos de Demostración (Seed)
1. En el **SQL Editor** de Supabase, crea una nueva consulta.
2. Copia y pega el contenido del archivo [`supabase/seed.sql`](supabase/seed.sql).
3. Presiona **"Run"**. Tus tablas quedarán pobladas con la información inicial.

---

### 4. Configurar las Variables de Entorno en el Proyecto
1. En la raíz de tu proyecto local, crea un archivo `.env` (puedes duplicar `.env.example`).
2. En el panel de Supabase, ve a **Project Settings** (ícono de engranaje) → **API**.
3. Copia los valores y colócalos en tu archivo `.env`:

```env
# URL de la API de Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co

# Anon / Public Key (segura para exponer en el frontend gracias a RLS)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 5. Crear el Primer Usuario Administrador
El panel administrativo utiliza autenticación real mediante Supabase Auth combinada con una lista blanca (`admin_users`):

1. En Supabase, ve a **Authentication** → **Users**.
2. Haz clic en **"Add user"** → **"Create user"**.
3. Ingresa tu correo (ej. `admin@tuempresa.com`) y una contraseña segura.
4. Ve al **SQL Editor** y registra ese correo en la tabla de administradores autorizados:
   ```sql
   INSERT INTO admin_users (email, role) 
   VALUES ('admin@tuempresa.com', 'admin');
   ```

---

### 6. Verificar la Conexión
1. Inicia o reinicia el servidor local:
   ```bash
   npm run dev
   ```
2. Entra a `http://localhost:5173/admin`.
3. Inicia sesión con las credenciales que creaste en el paso 5.
4. En el menú lateral inferior del panel verás el indicador de estado:
   - 🟢 **Verde ("Conectado a Supabase")**: La conexión con PostgreSQL y Auth está 100% activa.
   - 🟡 **Ámbar ("Modo demostración")**: Falta alguna variable en el `.env` o la URL no es accesible.

---

## 🛡️ Tolerancia a Fallos: El Repositorio Resiliente

Template Cero implementa un patrón de **Fallback Resiliente** en [`src/data/resilientRepo.ts`](src/data/resilientRepo.ts):

- Si configuras Supabase pero en algún momento la base de datos se encuentra inaccesible, hay un corte de red o se agota la cuota gratuita, la aplicación **no arrojará errores de pantalla blanca** ni se romperá.
- Automáticamente degradará las lecturas hacia la caché de datos local de manera transparente para el visitante final.
- El panel administrativo informará al administrador cuando el sistema esté operando en modo degradado.
