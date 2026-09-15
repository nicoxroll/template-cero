# Guía de Despliegue a Producción — Template Cero 🚀

Esta guía detalla cómo compilar y desplegar **Template Cero** en las plataformas de hosting más populares (Vercel, Netlify, Cloudflare Pages o servidores estáticos con Nginx/Docker).

---

## 🏗️ Proceso de Compilación (Build)

Antes del despliegue, el comando de compilación realiza dos tareas:
1. **`vite build`**: Transpila TypeScript y genera el bundle minificado en la carpeta `dist/`.
2. **`node scripts/prerender-og.mjs`**: Genera páginas `.html` estáticas por cada ruta para asegurar que Google y los scrapers de redes sociales (WhatsApp, LinkedIn, Twitter/X) lean los títulos, descripciones y tarjetas Open Graph correspondientes sin necesidad de ejecutar JavaScript. Además, genera automáticamente `dist/sitemap.xml`.

```bash
npm run build
```

---

## ⚡ Despliegue en Vercel (Recomendado)

Template Cero incluye un archivo [`vercel.json`](vercel.json) preconfigurado que maneja:
- El ruteo de SPA (Single Page Application) sin romper el SEO estático.
- Cabeceras de caché inmutables para assets (`/assets/*`, `/hero-frames/*`).
- Revalidación inmediata para archivos `.html`.

### Pasos:
1. Sube tu código a GitHub, GitLab o Bitbucket.
2. En tu cuenta de [Vercel](https://vercel.com), haz clic en **"Add New Project"** e importa el repositorio.
3. Vercel detectará Vite automáticamente:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. *(Opcional)* En la sección **Environment Variables**, agrega las credenciales de Supabase si deseas usar la base de datos real:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GA4_ID` (si usas Google Analytics)
5. Haz clic en **Deploy**.

> [!IMPORTANT]
> **Variables en Vite durante el Build:**  
> Vite hornea las variables con prefijo `VITE_` en el bundle **durante el build**, no en tiempo de ejecución. Si agregas o cambias variables de entorno en Vercel, debes hacer un **Redeploy** para que surtan efecto.

---

## 🌐 Despliegue en Netlify

1. En [Netlify](https://netlify.com), selecciona **"Add new site"** → **"Import an existing project"**.
2. Configuración de build:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Si la navegación directa a subrutas (como `/admin` o `/proyectos`) da error 404, asegúrate de que exista un archivo `public/_redirects` con la siguiente línea:
   ```text
   /*    /index.html   200
   ```

---

## 🐳 Despliegue con Docker y Nginx

Si prefieres alojar la aplicación en tu propio servidor VPS (DigitalOcean, AWS EC2, Hetzner):

### Dockerfile de ejemplo (Multi-stage build):
```dockerfile
# Etapa 1: Compilación
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx liviano
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf correspondiente:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Caché para assets estáticos inmutables
    location ~* \.(?:css|js|woff2?|svg|webp|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔐 Acceso al Panel de Administración en Producción

- **URL:** `https://tudominio.com/admin`
- **Comportamiento según entorno:**
  - **Sin Supabase configurado:** El panel funciona en modo demostración. Cualquier email y clave permiten el ingreso (datos en el `localStorage` del visitante).
  - **Con Supabase configurado:** Requiere usuario creado en Supabase Auth y registrado en la tabla `admin_users`.

---

## 🔍 Verificación Post-Despliegue

1. Entra a `https://tudominio.com` y verifica que cargue fluidamente.
2. Navega directamente a `https://tudominio.com/proyectos` en una nueva pestaña (comprueba que no dé 404).
3. Abre las herramientas de desarrollo (F12) y comprueba que no existan errores de consola.
4. Comparte la URL en un validador Open Graph (como [opengraph.xyz](https://www.opengraph.xyz)) para confirmar que la imagen de previsualización y el título se muestren correctamente.
