# Ciridae — Style Reference (ARCHIVADO)

> **⚠ Estado: archivado, no expuesto.** La portada del sitio pasó a ser una
> sola composición (ver `src/pages/Home.tsx`): el toggle del encabezado cambia
> únicamente el HERO —video scrubeado o imagen fija— y todas las secciones de
> abajo son las mismas en ambos modos. Ciridae dejó de ser el "modo NORMAL":
> su código sigue vivo en `src/components/home/ciridae/` pero no se monta desde
> ninguna ruta, con el mismo tratamiento que ya tenía Aker (ver
> `DESIGN-AKER.md`). Este documento queda como referencia del sistema por si se
> retoma; **no describe lo que el sitio muestra hoy**.


> **void chamber with ember pulse** — a near-black cathedral where the only warm note is a thin line of ember rust, and every surface is defined by hairline borders rather than shadow.

> **Adaptación a Punto Cero (regla que prevalece):** la estructura, tipografía, formas, espaciados y disciplina del sistema se aplican EXACTAS. El único cambio es el acento cromático: donde la referencia usa Ember Rust `#cc6437`, Punto Cero usa su **verde de marca** (`brand-500`) — mismo rol: hairline strokes y punctuation chica, **nunca como relleno**. Todo lo demás (void black, charcoal, bone, blancos, greys) va literal.

**Theme:** dark. Sistema que opera en el vacío: canvas `#0b0b0b`, controles pill fantasma, tipografía en MAYÚSCULAS condensadas a weight 400 — sin negritas, sin mixed case, sin decoración. Las superficies se definen por contraste tonal y hairlines de 1px, jamás por sombra. La fotografía llega desenfocada y atmosférica, a sangre, detrás del texto: ambiente, no ilustración.

## Colores

| Nombre | Valor | Rol |
|--------|-------|-----|
| **Acento (Punto Cero)** | `brand-500` (verde de marca; en la referencia era Ember Rust `#cc6437`) | Trazos hairline, linework de íconos, highlights chicos de texto — **único** color cromático, nunca relleno |
| Void Black | `#0b0b0b` | Canvas principal y fondos de sección |
| Charcoal Surface | `#272a2a` | Fondo de cards y paneles en secciones oscuras — un paso más claro que el canvas, separación sin sombra |
| Bone | `#edebe7` | Fondo de la sección clara (la única) |
| Bone Darker | `#dfddd9` | Variante de Bone para superficies claras superpuestas |
| Pure White | `#ffffff` | Todo el texto, bordes de botones fantasma, nav — 19.7:1 sobre Void Black |
| Abyss | `#050505` | Barra superior — un tono más oscuro que el canvas para empujarla al frente |
| Steel | `#484848` | Borde medio para botones sólidos secundarios |
| Ash | `#cecece` | Hairlines de badges y marcadores numerados |

## Tipografía

**Display/UI — condensada (sustituto: Oswald o Barlow Condensed)**: weight **400 únicamente**, MAYÚSCULAS, `letter-spacing -0.02em`. 14px body, 20px labels de sección, 32px wordmark. La rareza del sistema: body a 14px en caps condensadas se lee como tipografía arquitectónica, no como prosa.

**Body prosa (sustituto: Inter)**: 15-24px, weight 400, mixed case permitido — solo para pasajes largos (descripciones de card). El cambio de familia dice "leé esto como oración, no como etiqueta".

**System voice — Roboto Mono 11px** MAYÚSCULAS: solo para datos de sistema (ticker de la barra superior, metadata). Separadores con •. Registro de terminal/log.

**Nunca cruzar registros.** Un label de navegación en mono se siente roto; un anuncio en condensada se siente titular.

### Escala

| Rol | Size | Line height | Tracking |
|-----|------|-------------|----------|
| caption | 11px | 1.1 | -0.22px |
| body-sm | 14px | 1.43 | -0.28px |
| heading-sm | 20px | 1.0 | -0.4px |
| heading | 24px | 1.2 | -0.48px |
| heading-lg | 32px | 1.05 | -0.64px |

## Formas y espaciado

Densidad comfortable. Escala: 5, 7, 8, 10, 11, 16, 18, 20, 24, 30, 32, 40, 65, 80, 100, 122 px.
**Radios**: nav/badges/buttons **1440px** (pill, la forma firma) · cards **10px** · botón de la news bar **0px**.
Layout: max-width **1400px** · section gap **80px** · card padding **32px** · element gap 16-20px.

## Componentes

- **Ghost Pill Button** (control primario de todo el sitio): fondo transparente, borde 1px blanco, radio 1440px, padding 10px/18-20px, condensada 14px caps blanca. "Start Now", "Menu", toda navegación primaria.
- **News Bar Solid Button**: fondo Abyss, borde 1px blanco, **radio 0px** (esquinas vivas, contraste con los pills), padding 10px/20px. Exclusivo de la barra superior — la forma distinta señala otra zona funcional.
- **Pill Badge**: transparente, borde 1px Ash, radio 1440px, padding 5px/11px, 14px caps. Marcadores numerados ("01", "02") y labels chicos.
- **System Card**: fondo Charcoal `#272a2a`, radio 10px, **sin box-shadow**, padding 32px vertical / 0 horizontal (el contenido alinea al borde). Fotografía atmosférica a sangre detrás o dentro. El 10px es el único radio no-pill: pill = interactivo, rect redondeado = contenedor.
- **Top News Bar**: fondo Abyss, ancho completo, Roboto Mono 11px caps centrado con separadores •.
- **Hero**: canvas Void Black con fotografía atmosférica a sangre **muy desenfocada** (backdrop-blur ~50px). Marca centrada; micro-labels flanqueando a izquierda y derecha extremas. Composición triádica que llena el viewport sin amontonar.
- **Backers/Logos Strip**: fondo **Bone** — la única sección clara, quiebre tonal dramático usado UNA vez en la página.
- **Section Heading Block**: eyebrow condensada 14px caps + titular 32px caps, centrado sobre Void Black, con 40-60px de aire arriba y abajo.
- **Footer**: Void Black, condensada 14px caps, filas simples, sin adornos — el footer respeta el vacío.

## Do

- Radio 1440px en todo botón, badge, nav e ítem con forma de pill.
- Radio 10px **solo** en cards y contenedores de contenido.
- Todo el texto en MAYÚSCULAS, condensada weight 400 — nunca bold, nunca mixed case (salvo prosa larga en la familia de body).
- `-0.02em` de tracking arriba de 14px; `-0.01em` aceptable en body 15px.
- Superficies por shift tonal (`#0b0b0b` → `#272a2a` → `#edebe7`) y hairlines de 1px, **nunca** box-shadow.
- El acento (verde de marca) reservado a trazos hairline y highlights chicos — nunca relleno.
- Roboto Mono 11px exclusivamente para datos de sistema.

## Don't

- Sin pesos bold/semibold — el sistema entero opera en 400.
- Sin drop shadows, glows ni box-shadow de ningún tipo.
- Sin rellenos de color en botones — todos son fantasma con borde de 1px.
- Sin mixed case en labels, headings ni strings de UI.
- Sin acentos adicionales más allá del verde de marca.
- Sin radios intermedios (4px, 8px) en botones/badges/nav — el pill de 1440px es la firma.
- Sin gradientes — campos de color plano y fotografía desenfocada, no transiciones.

## Superficies y elevación

Void Canvas `#0b0b0b` (todas las secciones oscuras) → Abyss `#050505` (barra superior) → Charcoal `#272a2a` (cards, única superficie "elevada") → Bone `#edebe7` (la única sección clara). **El sistema rechaza deliberadamente las sombras**: las superficies se sienten prensadas contra la página, no flotando.

## Imagery

Fotografía atmosférica a sangre, **muy desenfocada** (blur 40-50px) y de alto contraste: mármol líquido, humo, siluetas de paisaje, texturas de fuego/brasa. Oscura, no high-key — vive en el mismo registro tonal que el canvas en vez de saltar contra él. Sin fotos de producto, sin gente, sin capturas de UI. Es atmósfera ambiental, no contenido ilustrativo: cada card se pareja con una escena distinta que funciona como identificador visual abstracto.

**Traducción a Punto Cero**: hormigón, vidrio, planos, texturas de obra y vistas urbanas nocturnas — desenfocadas y oscuras, en el mismo registro. Las fotos nítidas del catálogo viven en Proyectos, no en este hero.

## Layout

Modelo a sangre con contenido centrado en ~1400px. Hero de viewport completo con marca centrada y micro-labels flanqueantes. Las secciones alternan: hero oscuro → franja clara Bone → narrativa oscura → grilla de cards oscura → footer oscuro. **Una sola** sección clara como quiebre. La grilla de cards usa 4 columnas donde la primera es ~2× más ancha que las otras tres (layout asimétrico destacado). Aire vertical generoso entre secciones (80px+). Navegación mínima: barra de novedades arriba + un pill fantasma a la izquierda y otro ("Menú") a la derecha. Sin sidebar, sin mega-menú.

## Tailwind v4 — tokens (prefijo `cir-`)

```css
@theme {
  --color-cir-void: #0b0b0b;
  --color-cir-abyss: #050505;
  --color-cir-charcoal: #272a2a;
  --color-cir-bone: #edebe7;
  --color-cir-bone-dark: #dfddd9;
  --color-cir-white: #ffffff;
  --color-cir-steel: #484848;
  --color-cir-ash: #cecece;
  /* acento: usar brand-500 (verde Punto Cero), NO ember rust */

  --text-cir-caption: 11px;   --leading-cir-caption: 1.1;   --tracking-cir-caption: -0.22px;
  --text-cir-body: 14px;      --leading-cir-body: 1.43;     --tracking-cir-body: -0.28px;
  --text-cir-hsm: 20px;       --leading-cir-hsm: 1;         --tracking-cir-hsm: -0.4px;
  --text-cir-h: 24px;         --leading-cir-h: 1.2;         --tracking-cir-h: -0.48px;
  --text-cir-hlg: 32px;       --leading-cir-hlg: 1.05;      --tracking-cir-hlg: -0.64px;

  --radius-cir-card: 10px; --radius-cir-pill: 1440px; --radius-cir-sharp: 0px;
}
```

Referencia viva: https://www.ciridae.com/ · Marcas de calibración: Nothing, Linear, Vercel, Framework.
