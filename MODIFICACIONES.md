# Guía Maestra de Modificaciones — Template Cero 🛠️

Esta guía proporciona instrucciones detalladas paso a paso para realizar cualquier cambio o extensión en **Template Cero**, incorporando **alertas de seguridad y recomendaciones** para evitar errores arquitectónicos, así como la documentación del **sistema de alertas y notificaciones** integrado en la plantilla.

---

## 🔔 Sistema de Alertas y Notificaciones del Proyecto

Template Cero incluye un sistema multicapa de alertas y notificaciones tanto para el usuario final como para el administrador:

### 1. Notificaciones de Leads (Webhooks, WhatsApp y Email)
* **Ubicación:** [`src/lib/leadNotifications.ts`](src/lib/leadNotifications.ts) y [`src/pages/admin/AdminConfiguracion.tsx`](src/pages/admin/AdminConfiguracion.tsx).
* **Cómo funciona:** Cuando un visitante envía un formulario de contacto o se suscribe a una inversión/newsletter:
  1. El lead se almacena en la base de datos o en `localStorage`.
  2. Se despacha automáticamente un webhook HTTP POST al endpoint configurado en el panel administrativo (ej. n8n, Make, Zapier, Slack o Discord).
  3. Se genera un enlace directo a WhatsApp preformateado con los datos del visitante.

> [!TIP]
> **Configuración de Notificaciones por Webhook:**  
> Ingresa al panel en `/admin/configuracion` y pega la URL de tu webhook en **"Webhook de Notificación de Leads"**. Cada nuevo contacto enviará un JSON estructurado con `nombre`, `email`, `teléfono`, `origen` y `timestamp`.

> [!WARNING]
> **Formato del número de WhatsApp:**  
> El teléfono para recibir alertas y atender por WhatsApp debe escribirse en formato internacional estricto **solo dígitos** (ej: `5491112345678`), sin símbolos `+`, paréntesis o guiones, para garantizar la compatibilidad con `https://wa.me/`.

---

### 2. Alertas Flotantes del Sistema (Toasts en UI)
* **Ubicación:** [`src/components/admin/crud/Toast.tsx`](src/components/admin/crud/Toast.tsx).
* **Cómo usarlas en cualquier componente:**
```tsx
import { showToast } from '../components/admin/crud/Toast';

// Éxito
showToast('success', 'Proyecto guardado correctamente');

// Error
showToast('error', 'Ocurrió un error al procesar la solicitud');

// Información
showToast('info', 'Los cambios se reflejarán al recargar');
```

---

### 3. Alertas de Estado del Backend (Resilient Fallback)
* **Ubicación:** [`src/components/admin/shell/AdminShell.tsx`](src/components/admin/shell/AdminShell.tsx) y [`src/data/resilientRepo.ts`](src/data/resilientRepo.ts).
* **Cómo funciona:**
  - Si Supabase está configurado pero el servidor no responde o se cae la red, el sistema emite una notificación de advertencia en el panel administrativo:
  > ⚠️ *"Modo degradado: La base de datos no responde. Mostrando datos de respaldo locales."*
  - La web pública **nunca muestra pantalla blanca** ni se rompe ante caídas de la base de datos.

---

### 4. Modales de Confirmación
* **Ubicación:** [`src/components/admin/crud/ConfirmDialog.tsx`](src/components/admin/crud/ConfirmDialog.tsx).
* Utilízalos siempre antes de acciones destructivas (como eliminar un proyecto, borrar un lead o restablecer la configuración).

---

## 🎨 Modificación 1: Personalización de Marca y Colores

### Opción A: Vía Asistente Interactivo (Recomendada)
Ejecuta en la terminal:
```bash
npm run setup
```
Responde las preguntas interactivas y se actualizará automáticamente:
- Nombre y eslogan en [`src/config/site.ts`](src/config/site.ts)
- Etiquetas `<title>`, `<meta>` y OpenGraph en [`index.html`](index.html)
- Paleta de color seleccionada

---

### Opción B: Cambio Manual de Paleta en Tailwind v4
En [`src/config/site.ts`](src/config/site.ts), modifica el campo `theme.preset`:
```ts
theme: {
  preset: 'indigo', // Opciones: 'emerald' | 'indigo' | 'slate' | 'amber'
}
```

> [!NOTE]
> **Paletas Disponibles:**
> - 🟢 **`emerald`**: Verde corporativo, alta gama, real estate, finanzas.
> - 🔷 **`indigo`**: Azul tecnológico, plataformas SaaS, startups digitales.
> - ⬛ **`slate`**: Monocromo elegante, fotografía, estudios de arquitectura.
> - 🟧 **`amber`**: Cálido y dinámico, agencias creativas, eventos.

> [!IMPORTANT]
> **Crear un Color Personalizado:**  
> Si requieres un color HEX específico que no está en los presets, edita directamente en [`src/index.css`](src/index.css) las variables `--brand-accent` y `--brand-700` dentro de `:root` y `.dark`.

---

## 📄 Modificación 2: Añadir o Eliminar Páginas

Si deseas crear una nueva página (por ejemplo, `/nosotros` o `/faq`):

### Paso 1: Crear el componente de página
Crea el archivo `src/pages/Nosotros.tsx`:
```tsx
import Container from '../components/ui/Container';
import { usePageMeta } from '../lib/usePageMeta';

export default function Nosotros() {
  usePageMeta({
    title: 'Sobre Nosotros',
    description: 'Conoce la historia, el equipo y la visión de nuestra empresa.',
  });

  return (
    <Container className="py-24">
      <h1 className="text-4xl font-light text-ink">Sobre Nosotros</h1>
      <p className="mt-4 text-ink-soft">Contenido de la página...</p>
    </Container>
  );
}
```

### Paso 2: Registrar la ruta en [`src/App.tsx`](src/App.tsx)
1. Importa la página de manera diferida (*lazy*):
   ```tsx
   const Nosotros = lazy(() => import('./pages/Nosotros'));
   ```
2. Agrega la ruta dentro del bloque `<Route element={<PublicLayout />}>`:
   ```tsx
   <Route path="nosotros" element={<Nosotros />} />
   ```

### Paso 3: Añadir el enlace a la barra de navegación
En [`src/config/site.ts`](src/config/site.ts), dentro de `navigation`:
```ts
navigation: [
  { label: 'Inicio', href: '/' },
  { label: 'Nosotros', href: '/nosotros' },
  // ...
]
```

> [!CAUTION]
> **¡Paso Crítico para SEO!:**  
> Debes registrar la nueva ruta en [`scripts/prerender-og.mjs`](scripts/prerender-og.mjs) dentro del array `staticPages`:
> ```js
> {
>   urlPath: '/nosotros',
>   title: 'Sobre Nosotros',
>   description: 'Conoce nuestra historia y equipo.',
> }
> ```
> De lo contrario, los scrapers de redes sociales y Google compartirán el título y la vista previa genérica de la portada.

---

## 🧩 Modificación 3: Gestión de Secciones Dinámicas

Template Cero cuenta con un motor de bloques dinámicos gestionable desde `/admin/contenido`:

- Puedes añadir secciones de tipo **Imagen**, **Video** o **Texto Puro**.
- Puedes definir títulos, bajadas, texto del botón CTA, enlace de destino y color de fondo.
- Puedes reordenar las secciones arrastrándolas o cambiar su visibilidad con un solo clic.

> [!TIP]
> **Activar o Desactivar Secciones en Portada:**  
> Si no deseas usar secciones personalizadas en un proyecto, apágalas desde [`src/config/site.ts`](src/config/site.ts) con:
> ```ts
> features: {
>   enableCustomSections: false,
> }
> ```

---

## 🗃️ Modificación 4: Añadir o Modificar Campos en la Base de Datos

Si necesitas agregar un campo a una entidad existente (por ejemplo, agregar `subtitulo` o `cliente` a un proyecto):

> [!WARNING]
> **Regla de Oro de los Datos:**  
> Los componentes visuales **nunca** importan `fixtures.ts` ni llaman a Supabase directamente. Siempre deben consultar `projectRepo`, `leadRepo`, etc. desde `src/data`.

Sigue este orden estricto de 5 pasos:

1. **Tipos de Dominio:** Agrega la propiedad en [`src/data/types.ts`](src/data/types.ts):
   ```ts
   export interface Project {
     // ...
     cliente?: string;
   }
   ```
2. **Fixtures Mock:** Agrega valores de prueba en [`src/data/fixtures.ts`](src/data/fixtures.ts) para cada proyecto de muestra.
3. **Mappers de Supabase:** En [`src/data/supabaseMappers.ts`](src/data/supabaseMappers.ts), incluye `cliente: row.client_name` en `mapProjectFromDb` y `client_name: p.cliente` en `mapProjectToDb`.
4. **Esquema SQL:** En [`supabase/schema-completo.sql`](supabase/schema-completo.sql), documenta la columna en la tabla `projects`:
   ```sql
   ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name text;
   ```
5. **Formulario de Admin:** En [`src/components/admin/crud/ProjectForm.tsx`](src/components/admin/crud/ProjectForm.tsx), añade el campo de formulario con su validación Zod.

> [!CAUTION]
> **Namespace de LocalStorage:**  
> Si cambias campos obligatorios en una entidad, los navegadores que tengan guardados datos antiguos en `localStorage` podrían experimentar inconsistencias. Si esto ocurre, incrementa el namespace en [`src/data/localStorageRepo.ts`](src/data/localStorageRepo.ts) (ej: cambiar `templatecero:v1:` a `templatecero:v2:`).

---

## 🎬 Modificación 5: Animaciones GSAP y ScrollTriggers

Toda animación con GSAP debe cumplir las siguientes directivas:

> [!IMPORTANT]
> 1. **Uso obligatorio de `useGSAP`:** Siempre importa `useGSAP` desde `@gsap/react` para que los triggers se limpien automáticamente al desmontar el componente.
> 2. **Respetar Reduced Motion:** Antes de animar, verifica la función `useReducedMotion()`. Si el usuario tiene desactivadas las animaciones en su sistema operativo, muestra el elemento estático sin transiciones.
> 3. **Cuidado con los Pins de Scroll:** Si un componente hace `pin` en el scroll, recuerda que altera la altura total del documento. Ejecuta `ScrollTrigger.refresh()` tras cargar imágenes o cambiar tamaños dinámicos.

---

## ✅ Checklist de Validación antes de Desplegar

Antes de hacer `git push` o enviar a producción, ejecuta siempre en la terminal:

```bash
# 1. Validar tipos de TypeScript
npm run typecheck

# 2. Validar reglas de estilo y buenas prácticas
npm run lint

# 3. Compilar bundle y generar HTMLs estáticos para SEO
npm run build
```

Si los tres comandos finalizan con código `0`, ¡tu proyecto está 100% listo para producción!
