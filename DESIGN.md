# DESIGN.md — Autoridad de diseño Punto Cero Desarrollos

Todo agente que construya UI en este repo OBEDECE este documento. Ante duda, minimalismo: menos elementos, más aire, tipografía fina.

## Identidad

Marca arquitectónica de línea fina, premium y sobria. Blanco dominante, tinta casi negra, verde bosque corporativo como único color. Nada de gradientes multicolor, sombras duras ni bordes redondeados grandes (`rounded-none` o `rounded-sm` por defecto; `rounded-md` máximo en admin).

## Paleta (tokens Tailwind — definidos en `src/index.css` `@theme`)

| Token | Hex | Uso |
|---|---|---|
| `paper` | `#FFFFFF` | Fondo base |
| `paper-soft` | `#F6F8F6` | Fondos alternos de sección, skeletons base |
| `ink` | `#101512` | Texto principal, fondos oscuros (footer/hero overlay) |
| `ink-soft` | `#4A544E` | Texto secundario |
| `brand-50` | `#F2F7F4` | Tints, hover suave |
| `brand-100` | `#E2EEE7` | Bordes tintados, badges |
| `brand-300` | `#9DBFAC` | Detalles decorativos sobre oscuro |
| `brand-500` | `#3E7A5A` | Acento verde claro: links, iconos, kickers |
| `brand-700` | `#1F4A35` | Hover de primario |
| `brand-900` | `#10281D` | **Primario**: botones, header scrolled accents, favicon |

Uso: `bg-brand-900`, `text-ink`, `border-brand-100`, etc. NUNCA hex hardcodeado en componentes.

## Tipografía — Montserrat (única familia, vía @fontsource; pesos 300/400/500/600)

- **Display (hero)**: `text-5xl md:text-6xl lg:text-7xl font-light tracking-wider` — blanco sobre imagen, o `text-ink`.
- **H2 sección**: `text-3xl md:text-4xl lg:text-5xl font-light tracking-wide uppercase`.
- **Kicker** (sobre cada H2): `text-xs md:text-sm font-medium tracking-[0.3em] uppercase text-brand-500`.
- **H3 / card title**: `text-xl md:text-2xl font-light tracking-wide`.
- **Body**: `text-base font-light leading-relaxed text-ink-soft` (`text-lg` en intros).
- **Label/meta**: `text-xs font-medium tracking-widest uppercase text-ink-soft`.
- Regla: headings SIEMPRE `font-light` + tracking amplio; el énfasis se logra con `font-medium` en spans puntuales, jamás `font-bold`.

## Espaciado y layout

- Contenedor: `<Container/>` = `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Secciones: `py-20 md:py-28 lg:py-32`. Entre kicker→H2: `mb-4`; H2→contenido: `mb-12 md:mb-16`.
- Grillas: `gap-6 md:gap-8`; cards de proyectos `grid md:grid-cols-2 lg:grid-cols-3`.
- Fondos alternados: `paper` / `paper-soft`; secciones oscuras (CTA, footer) `bg-brand-900 text-white`.
- **Fondos oscuros permanentes** (heros, canvas de video, placeholders de hero): `bg-ink-fixed`, nunca `bg-ink`. `ink` es un rol de TEXTO y se invierte con el tema — como fondo queda casi blanco en modo oscuro.
- **Separadores/hairlines**: `border-hairline` / `divide-hairline` (flippea con el tema). `brand-100` solo cuando el borde acompaña un fondo fijo `bg-brand-50`/`bg-brand-100` (chips).
- **Texto blanco sobre fondo verde** (footer, CTAs): mínimo `/60` para texto chico y `/70` para el bloque legal — por debajo no pasa WCAG AA.
- **Texto blanco sobre el hero de video**: agregar `hero-legible` (sombra en 3 capas, ver `src/index.css`). Los cuadros del video incluyen paredes blancas y cielo.

## Componentes idioma (usar los de `src/components/ui/` — no reinventar)

- **Button**: `<Button variant="primary|outline|ghost">`. Primary = `bg-brand-900 text-white hover:bg-brand-700`, uppercase `tracking-widest text-sm font-medium`, `px-8 py-3.5`, `rounded-none`, transición 300ms. Outline = borde 1px ink/white según fondo. Con `to=` navega (Link).
- **Card**: fondo `paper`, `border border-line`, sin sombra en reposo, `hover:shadow-xl hover:-translate-y-1 transition-all duration-500`. Imagen arriba `aspect-[4/3] object-cover` con zoom sutil al hover (`group-hover:scale-105 duration-700`).
- **SectionHeading**: kicker + título + intro opcional, `align="left|center"`.
- Imágenes hero/banda: fullscreen o `h-[60vh]`, `bg-cover bg-center`, overlay `bg-gradient-to-b from-black/50 via-black/30 to-black/70`, texto blanco centrado (idioma realstack).
- Header: flotante fijo; transparente con texto blanco arriba → `bg-white/90 backdrop-blur-md shadow-sm` con texto ink al scrollear (>10px).

## Animación (GSAP únicamente — helpers en `src/lib/gsapReveal.ts`)

- **Reveal estándar**: `opacity 0→1`, `y: 32→0`, `duration: 0.9`, `ease: 'power3.out'`, trigger `start: 'top 80%'`, una sola vez.
- **Stagger** en grillas/listas: `0.12` entre ítems (máx 0.15).
- **Micro** (hover ya lo cubre CSS): no usar GSAP para hovers.
- **Hero/scrub**: pin + `scrub: true`; solo el dueño de HomeStory instala ScrollTriggers de pin.
- **Reduced motion**: TODA animación GSAP pasa por `gsapReveal`/`useReducedMotion`; con `prefers-reduced-motion` se muestra el estado final sin animar. Sin excepciones.
- Nada de librerías extra de animación (no framer-motion, no AOS).

## Skeletons (`src/components/ui/Skeleton.tsx`)

- **Shape-matched**: el skeleton replica la geometría exacta del layout final (misma grilla, mismos aspect ratios) — cero CLS.
- Estética: base `bg-paper-soft` con shimmer (gradiente animado 1.6s, keyframe `shimmer` global).
- **Anti-flash**: usar `useMinVisible(loading, 400)` — si los datos llegan antes de 400ms el skeleton no aparece; si aparece, se sostiene mínimo 400ms.
- Aplica a TODA vista que lea de repositorios (público y admin).

## Datos

Componentes consumen SOLO repositorios de `src/data` (ver `src/data/README.md`). Jamás importar fixtures.

## Copy

Español rioplatense formal ("usted" implícito, sin voseo en copy institucional). Títulos cortos. Cifras de retorno SIEMPRE con "estimado" + disclaimer.
