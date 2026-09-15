# Template Cero ⚡

> **Plantilla corporativa universal de alto impacto y arquitectura de grado de producción.**  
> Construida con **React 19**, **TypeScript 6**, **Vite 8**, **Tailwind CSS v4**, **GSAP**, **Supabase (con fallback resiliente)**, **Panel de Administración propio** y **CMS en vivo**.

---

## 📋 Índice
1. [¿Qué es Template Cero?](#-qué-es-template-cero)
2. [Puesta en Marcha en 30 Segundos](#-puesta-en-marcha-en-30-segundos)
3. [Panel de Administración y Acceso Demo](#-panel-de-administración-y-acceso-demo)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Scripts Disponibles](#-scripts-disponibles)
6. [Cómo Personalizar la Plantilla](#-cómo-personalizar-la-plantilla)
7. [Arquitectura de Datos Resiliente (Mock ↔ Supabase)](#-arquitectura-de-datos-resiliente)
8. [Despliegue a Producción](#-despliegue-a-producción)
9. [Uso con Asistentes y Agentes de IA](#-uso-con-asistentes-y-agentes-de-ia)

---

## 💡 ¿Qué es Template Cero?

**Template Cero** es una base de código moderna, performante y lista para desplegar, diseñada para empresas, agencias, firmas de arquitectura, estudios de diseño, startups o proyectos que requieran:
- **Estética premium y micro-interacciones**: Animaciones fluidas con GSAP, scroll suave con Lenis, galería interactiva y transiciones cuidadas.
- **Doble motor de datos (Zero-Backend ready)**: Funciona desde el primer minuto con datos de demostración en `localStorage`, y se conecta automáticamente a Supabase cuando se definen dos variables de entorno.
- **Panel Administrativo completo (`/admin`)**: Sin depender de servicios externos para gestionar proyectos, oportunidades/planes, leads recibidos, contenidos del sitio y configuración.
- **Editor CMS en vivo**: Permite a los administradores editar textos e imágenes directamente sobre la interfaz pública en tiempo real.
- **Optimización para SEO y Redes Sociales**: Pre-renderizado estático de rutas con Open Graph, Twitter Cards y generación automática de `sitemap.xml`.
- **Diseñado para Agentes de IA**: Cuenta con un manual de arquitectura (`AI_INSTRUCTIONS.md`) y reglas para Cursor/Claude para que cualquier modelo pueda iterar y extender la app sin romper convenciones.

---

## 🚀 Puesta en Marcha en 30 Segundos

### Requisitos previos
- **Node.js**: Versión `>= 20.0.0` (recomendado `>= 22.0.0`).
- **npm** (o pnpm / bun).

### Paso 1: Clonar o posicionarse en el proyecto
```bash
cd template-cero
```

### Paso 2: Instalar dependencias
```bash
npm install
```

### Paso 3: (Opcional) Configurar tu marca con el asistente interactivo
```bash
npm run setup
```
Este asistente te preguntará el nombre de tu empresa, eslogan, paleta de color (Emerald, Indigo, Slate o Amber) y datos de contacto, y actualizará todo automáticamente en 5 segundos.

### Paso 4: Iniciar el servidor local
```bash
npm run dev
```

El sitio estará disponible inmediatamente en:
👉 **`http://localhost:5173`**

> [!NOTE]
> **No necesitas configurar ninguna base de datos ni variable de entorno para comenzar.**  
> El proyecto arranca de manera autónoma con datos mock interactivos. Cualquier cambio que hagas en el panel administrativo persistirá en tu navegador (`localStorage`).

---

## 🔐 Panel de Administración y Acceso Demo

Template Cero incluye un panel administrativo completo integrado en la SPA.

- **URL de acceso:** `http://localhost:5173/admin`
- **Modo Demostración (sin Supabase):**
  - **Email:** Cualquier email (ej. `admin@templatecero.com`)
  - **Contraseña:** Cualquier contraseña no vacía (ej. `demo`)
- **Secciones del panel:**
  - 📊 **Panel / Dashboard:** Métricas clave del sitio, accesos rápidos y estado del backend.
  - 📂 **Catálogo / Proyectos:** Alta, baja, modificación, ordenación, subida de galerías y especificaciones técnicas.
  - 💼 **Oportunidades / Planes:** Gestión de paquetes, servicios destacados o estructuras de inversión.
  - 📥 **Bandeja de Leads:** Contactos recibidos desde los formularios del sitio, con estados (*Nuevo*, *Contactado*, *Calificado*, *Archivado*) y exportación a CSV.
  - ✍️ **Contenido (CMS):** Edición de textos de portada, valores corporativos, preguntas frecuentes (FAQs).
  - ⚙️ **Configuración:** Datos de contacto, WhatsApp, redes sociales y selector de skins de diseño.

---

## 📁 Estructura del Proyecto

```text
template-cero/
├── AI_INSTRUCTIONS.md        # Manual exhaustivo para agentes de IA (Cursor, Claude, Copilot)
├── DEPLOY.md                 # Guía de despliegue a Vercel, Netlify o Docker
├── SUPABASE.md               # Guía de conexión y migraciones de base de datos
├── README.md                 # Este documento
├── .cursorrules              # Reglas de contexto para el editor Cursor
├── .claude/CLAUDE.md         # Reglas de contexto para Claude Code
├── .env.example              # Variables de entorno opcionales
├── package.json              # Dependencias y scripts
├── vite.config.ts            # Configuración de Vite 8 + Tailwind v4
├── index.html                # Plantilla HTML con script anti-flash de tema
├── public/                   # Archivos estáticos y documentos de muestra
│   ├── docs/                 # PDFs de muestra descargables
│   ├── hero-frames/          # Cuadros WebP para el hero interactivo
│   ├── favicon.svg
│   └── robots.txt
├── scripts/
│   ├── gen-docs.mjs          # Genera PDFs de muestra en memoria
│   └── prerender-og.mjs      # Genera HTML estático con meta tags para SEO
├── supabase/                 # Esquemas SQL, migraciones y seed data
│   ├── schema-completo.sql   # DDL completo con políticas RLS y Storage
│   └── seed.sql              # Datos iniciales para poblar Supabase
└── src/
    ├── config/
    │   └── site.ts           # 🌟 Configuración central de marca, textos y contacto
    ├── data/                 # 💾 Capa de datos desacoplada (repositorios)
    │   ├── types.ts          # Tipos e interfaces de dominio
    │   ├── fixtures.ts       # Datos de muestra para modo local
    │   ├── repositories.ts   # Contratos de los repositorios
    │   ├── localStorageRepo.ts # Implementación local (localStorage + latencia mock)
    │   ├── supabaseRepo.ts   # Implementación real de Supabase
    │   ├── resilientRepo.ts  # Fallback automático ante fallos de conexión
    │   └── index.ts          # Singletons exportados para los componentes
    ├── components/           # Componentes visuales organizados por dominio
    │   ├── layout/           # Header, Footer, Navegación
    │   ├── ui/               # Botones, Skeletons, Badges, Modales
    │   ├── admin/            # Formularios y tablas del panel de control
    │   └── home/             # Secciones de la portada
    ├── lib/                  # Utilidades (GSAP, Lenis, temas, optimización de imágenes)
    └── pages/                # Páginas públicas y rutas administrativas
```

---

## 🛠️ Scripts Disponibles

En la raíz del proyecto puedes ejecutar:

| Comando | Acción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo en `localhost:5173`. |
| `npm run setup` | Asistente interactivo en terminal para configurar marca, paleta y contacto. |
| `npm run build` | Compila TypeScript, arma el bundle optimizado y ejecuta el prerenderizador SEO. |
| `npm run preview` | Sirve localmente la carpeta `dist/` resultante del build. |
| `npm run typecheck` | Ejecuta `tsc --noEmit` para verificar tipos sin compilar. |
| `npm run lint` | Ejecuta ESLint 9 para asegurar el estándar de código. |
| `node scripts/gen-docs.mjs` | Genera los archivos PDF de demostración en `public/docs/`. |

---

## 🎨 Cómo Personalizar la Plantilla

### 1. Asistente Rápido en Terminal (Recomendado)
Ejecuta:
```bash
npm run setup
```
Y responde las preguntas para personalizar todo el sitio automáticamente.

### 2. Configuración Manual y Feature Flags ([`src/config/site.ts`](src/config/site.ts))
Puedes editar directamente `src/config/site.ts` para cambiar datos y alternar funcionalidades:
```ts
export const siteConfig: SiteConfig = {
  name: 'Mi Empresa',
  theme: {
    preset: 'indigo', // 'emerald' | 'indigo' | 'slate' | 'amber'
  },
  features: {
    enableCustomSections: true, // Gestor de bloques dinámicos desde /admin
    enableShowcase: true,       // Catálogo / Proyectos
    enableOfferings: true,      // Planes / Oportunidades
    enableChatWidget: true,     // Widget de chat interactivo
    enableHeroScrub: false,     // Activar hero cinemático scrubeado
    enableNewsletter: true,     // Captura de leads
  }
};
```

### 3. Presets de Paletas de Color (Tailwind CSS v4)
La plantilla incluye 4 paletas prediseñadas listas para usar con 1 solo click en `siteConfig.theme.preset`:
- 🟢 **`emerald`**: Verde de alta gama (ideal finanzas, sustentabilidad, real estate, corporativo).
- 🔷 **`indigo`**: Azul moderno (ideal SaaS, tecnología, plataformas, startups).
- ⬛ **`slate`**: Escala de grises minimalista (ideal arquitectura, estudios de diseño, fotografía, marcas de lujo).
- 🟧 **`amber`**: Cálido y enérgico (ideal gastronomía, estudios creativos, agencias).

### 4. Contenido de Demostración
Modifica los datos iniciales en [`src/data/fixtures.ts`](src/data/fixtures.ts) para cambiar los proyectos, servicios, miembros del equipo o preguntas frecuentes de ejemplo.

---

## 🛡️ Arquitectura de Datos Resiliente

La capa de datos sigue el **Patrón Repositorio**:
- Los componentes de React **nunca** consumen `fixtures.ts` ni llaman al cliente de Supabase directamente.
- Siempre importan desde `src/data`:
  ```tsx
  import { projectRepo, type Project } from '../data';

  const projects = await projectRepo.list();
  ```
- **Conmutación transparente:**
  - Sin variables de entorno → Utiliza `LocalStorageRepo` con latencia simulada para apreciar los skeletons.
  - Con variables de entorno de Supabase → Utiliza `SupabaseRepo`.
  - Si Supabase se cae o da error de red → `resilientRepo` conmuta automáticamente a los datos locales sin romper la experiencia del usuario.

Para configurar la base de datos real, consulta la guía [SUPABASE.md](SUPABASE.md).

---

## 🚢 Despliegue a Producción

La plantilla está lista para ser desplegada en **Vercel**, **Netlify** o cualquier servidor web estático:
- Incluye `vercel.json` con soporte para rutas SPA y caché inmutable de assets.
- El build genera 13+ archivos HTML estáticos para indexación inmediata en Google.

Consulta todos los detalles en la guía de despliegue [DEPLOY.md](DEPLOY.md).

---

## 🤖 Uso con Asistentes y Agentes de IA

Este proyecto fue optimizado especialmente para flujos de trabajo asistidos por IA (como Cursor, Claude Code, Antigravity o GitHub Copilot).

- Consulta **[`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md)** para conocer:
  - Las **reglas de oro** que la IA no debe romper (invariantes de arquitectura).
  - Recetas paso a paso para añadir nuevas páginas, modelos de datos o cambiar de nicho comercial.
  - El checklist de validación previa a cada entrega de código.
