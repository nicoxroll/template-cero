# AI_INSTRUCTIONS.md — Manual de Operaciones para Agentes de IA 🤖

Este documento es el **manual maestro de instrucciones** para cualquier agente de Inteligencia Artificial (Claude, Cursor, Antigravity, GitHub Copilot, ChatGPT, etc.) que trabaje sobre el repositorio **Template Cero**.

---

## 🎯 Rol y Filosofía del Agente

Cuando trabajes en este repositorio, asume el rol de **Arquitecto de Software Fullstack Senior**. Tus intervenciones deben cumplir los siguientes principios:

1. **Arquitectura Limpia y Desacoplada**: La interfaz de usuario nunca debe acoplarse a detalles de infraestructura.
2. **Cero Fricción para Nuevos Desarrolladores**: El proyecto siempre debe poder ejecutarse con `npm run dev` sin requerir bases de datos ni archivos `.env`.
3. **Resiliencia Extrema**: Si un backend falla, la aplicación debe degradarse elegantemente sin crashear.
4. **Excelencia Visual y Accesibilidad**: Mantener micro-interacciones suaves, respeto a `prefers-reduced-motion` y tipografías consistentes.
5. **TypeScript Estricto**: Cero uso de `any` injustificado.

---

## 🗺️ Mapa de Arquitectura del Proyecto

```
src/
├── config/site.ts        → ÚNICA fuente de verdad para datos de marca, contacto y feature flags.
├── data/                 → Capa de datos desacoplada (Patrón Repositorio).
│   ├── types.ts          → Interfaces de dominio compartidas (público + admin).
│   ├── fixtures.ts       → Datos mock tipados para desarrollo local.
│   ├── repositories.ts   → Contratos/Interfaces abstractas de cada entidad.
│   ├── localStorageRepo.ts → Persistencia en navegador con simulación de latencia (400-700ms).
│   ├── supabaseRepo.ts   → Implementación real para Supabase (PostgreSQL + RLS).
│   ├── resilientRepo.ts  → Proxy que conmuta automáticamente entre Supabase y localStorage.
│   └── index.ts          → Punto de exportación único: expone singletons a los componentes.
├── lib/                  → Utilidades de infraestructura (GSAP, Lenis, theme, LiveCMSContext).
├── components/           → Componentes de UI modulares (layout, ui, admin, showcase).
└── pages/                → Vistas lazy-loaded (públicas y panel administrativo).
```

---

## 📜 Las 6 Reglas de Oro (Invariantes Inviolables)

### Regla 1: Contrato Estricto de la Capa de Datos
> ⚠️ **PROHIBIDO:** Nunca importes `fixtures.ts` ni llames a `supabaseClient` directamente desde componentes React.
> 
> ✅ **PERMITIDO:** Los componentes **SOLO** importan singletons desde `src/data`:
```tsx
// ❌ INCORRECTO:
import { PROJECTS_FIXTURE } from '../data/fixtures';
import { supabase } from '../data/supabaseClient';

// ✅ CORRECTO:
import { projectRepo, type Project } from '../data';

const projects = await projectRepo.list();
```

### Regla 2: Mantener la Dualidad LocalStorage ↔ Supabase
Si agregas un nuevo campo a una entidad (por ejemplo en `Project`):
1. Agrégalo en `src/data/types.ts`.
2. Agrégalo en `src/data/fixtures.ts`.
3. Agrégalo en `src/data/supabaseMappers.ts`.
4. Agrégalo en `supabase/schema-completo.sql`.
5. Si amerita, actualiza el namespace de versión en `localStorageRepo.ts` para evitar incompatibilidades con datos viejos guardados en el navegador.

### Regla 3: Ciclo de Vida de GSAP y Animaciones
- Toda animación de GSAP que interactúe con el DOM debe ejecutarse dentro del hook `useGSAP` de `@gsap/react`.
- Todo `ScrollTrigger` creado debe destruirse automáticamente al desmontar el componente.
- Siempre respetar la preferencia del usuario sobre animaciones mediante `prefersReducedMotion()`.

### Regla 4: Estándar Tailwind CSS v4 (No v3)
- Este proyecto utiliza **Tailwind CSS v4** mediante `@tailwindcss/vite`.
- **NO crees** archivos `tailwind.config.js` ni `postcss.config.js`.
- La configuración de temas y tokens vive exclusivamente en [`src/index.css`](src/index.css) bajo la directiva `@theme`.

### Regla 5: React 19 y React Router v8
- El paquete de ruteo es **`react-router`** (versión 8+). **NO importes** desde `react-router-dom` (fue absorbido en v8).
- Utiliza `useLocation`, `useParams`, `useNavigate` desde `react-router`.

### Regla 6: Pre-renderizado SEO y Rutas Estáticas
- Si creas una nueva página pública con URL propia (ej. `/nosotros`), debes registrarla tanto en `src/App.tsx` como en la lista de rutas de [`scripts/prerender-og.mjs`](scripts/prerender-og.mjs) para que se genere su HTML estático durante el build.

---

## 🍳 Recetario Paso a Paso para la IA (Playbooks)

### 📘 Receta A: Adaptar la plantilla a un cliente o rubro nuevo
Si el usuario te pide: *"Adapta este template para una clínica médica / estudio contable / agencia de diseño"*:

1. **Configurar datos corporativos:** Ejecuta `npm run setup` para responder interactivamente o edita directamente [`src/config/site.ts`](src/config/site.ts) con el nuevo nombre, eslogan, datos de contacto, links de redes y número de WhatsApp.
2. **Seleccionar preset de color:** En `src/config/site.ts`, fija `theme.preset` en `'emerald'`, `'indigo'`, `'slate'` o `'amber'` para cambiar toda la identidad cromática al instante. También puedes ajustar variables específicas en [`src/index.css`](src/index.css).
3. **Configurar feature flags:** En `src/config/site.ts`, activa o desactiva secciones según la necesidad del cliente (`enableShowcase`, `enableOfferings`, `enableCustomSections`, `enableChatWidget`, `enableHeroScrub`, etc.).
4. **Poblar datos de muestra iniciales:** Adapta [`src/data/fixtures.ts`](src/data/fixtures.ts) con ejemplos pertinentes al rubro (reemplazar por casos de estudio, productos o servicios del cliente).
5. **Verificar compilación:** Ejecuta `npm run typecheck` y `npm run build`.

---

### 📘 Receta B: Añadir una nueva página pública con ruta y SEO
Si el usuario te pide: *"Agrega una página de Preguntas Frecuentes (/faq)"*:

1. **Crear la vista:** Crea `src/pages/Faq.tsx` exportando un componente React por defecto. Utiliza skeletons y estados de carga acordes al resto de las páginas.
2. **Registrar la ruta (Lazy):** En [`src/App.tsx`](src/App.tsx):
   ```tsx
   const Faq = lazy(() => import('./pages/Faq'));
   // ... en el árbol de Routes:
   <Route path="/faq" element={<Faq />} />
   ```
3. **Añadir al prerenderizador:** En [`scripts/prerender-og.mjs`](scripts/prerender-og.mjs), añade `/faq` al array de rutas prerenderizadas con su `title` y `description`.
4. **Enlazar en navegación:** Agrega el link al menú en `src/config/site.ts` (`navigation`).

---

### 📘 Receta C: Agregar un nuevo campo a una entidad existente
Si el usuario te pide: *"Agrega un campo 'cliente' (clientName) a los Proyectos"*:

1. **Definición de Tipo:** En [`src/data/types.ts`](src/data/types.ts), agrega `clientName?: string;` a la interfaz `Project`.
2. **Fixtures:** En [`src/data/fixtures.ts`](src/data/fixtures.ts), incluye valores de muestra para `clientName` en `PROJECTS_FIXTURE`.
3. **Mappers Supabase:** En [`src/data/supabaseMappers.ts`](src/data/supabaseMappers.ts), actualiza las funciones de mapeo `mapProjectFromDb` y `mapProjectToDb` para incluir `client_name`.
4. **SQL:** En [`supabase/schema-completo.sql`](supabase/schema-completo.sql), documenta o añade la columna:
   ```sql
   ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name text;
   ```
5. **Formulario de Admin:** En [`src/pages/admin/AdminProyectos.tsx`](src/pages/admin/AdminProyectos.tsx), añade el input correspondiente en el modal de edición/creación.
6. **Vista Pública:** En [`src/pages/ProyectoDetalle.tsx`](src/pages/ProyectoDetalle.tsx), renderiza el nuevo campo con formato limpio.

---

### 📘 Receta D: Conectar Supabase en Producción
Si el usuario pregunta o necesita conectar la base de datos real:

1. Instruye la creación de un proyecto en [supabase.com](https://supabase.com).
2. Ejecuta el script SQL [`supabase/schema-completo.sql`](supabase/schema-completo.sql) en el SQL Editor de Supabase.
3. Ejecuta [`supabase/seed.sql`](supabase/seed.sql) para cargar datos de prueba iniciales.
4. Crea el archivo `.env` en la raíz basado en `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```
5. En Supabase Auth, crea un usuario con email y contraseña, e inserta su email en la tabla `admin_users`.
6. Reinicia el servidor dev (`npm run dev`). La aplicación detectará automáticamente las credenciales y el panel mostrará el badge verde: **"Conectado a Supabase"**.

---

## ✅ Checklist de Verificación para la IA

Antes de dar por finalizada cualquier tarea o proponer cambios al usuario, **ejecuta y valida**:

- [ ] `npm run typecheck` → 0 errores de TypeScript.
- [ ] `npm run lint` → 0 errores de linting.
- [ ] `npm run build` → Build de Vite y prerenderizador de OG exitosos sin advertencias graves.
- [ ] La aplicación corre en modo sin backend (localStorage) sin lanzar excepciones en consola.
- [ ] No se modificaron rutas o APIs públicas sin actualizar la documentación correspondiente.
