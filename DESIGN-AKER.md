# Aker — Style Reference (COMPLETO, verbatim del usuario)

> **Mapeo de colores Punto Cero (instrucción del usuario, prevalece sobre la paleta original):** la estructura, tipografía, espaciado, radios y componentes se implementan EXACTOS como esta referencia; los colores se mapean a la marca Punto Cero: Ember (#b75928) → verde marca `brand-500` (único acento cromático); Pine/Tide → `brand-900`/`brand-700` (superficies verdes); Cedar/Coral no se usan; neutros (Ink/Paper/Char/Midnight/Iron/Mist/Smoke/Pewter/Primary Action Fill) quedan como están. Todo lo demás de este documento aplica sin cambios.

> darkroom gallery wall
Monumental type floats over muted landscape photography like exhibit labels in a high-end architectural gallery — white walls, warm terracotta spotlights, everything else recedes.

**Theme:** light

Aker speaks in the visual vocabulary of a premium real-estate developer: dramatic full-bleed photography anchoring each section, a single warm terracotta accent cutting through near-monochrome layouts, and typography that oscillates between whisper-light and monumental. The interface trusts white space and dark imagery to do the heavy lifting — chrome is minimal, borders are hairlines, and interactive elements are reduced to text-and-arrow pairs or subtly filled dark pills. The single most distinctive choice is the contrast between the 168px Proxima Nova at weight 300 for the brand mark and the 15–18px body copy at the same family — the same typeface carries both the shouting and the whispering, which makes the voice feel unified rather than hybrid.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Ink | `#000000` | `--color-ink` | Primary text, hairline borders, icon strokes, link text on light surfaces |
| Paper | `#ffffff` | `--color-paper` | Page canvas, card surfaces, text on dark photography and dark surfaces |
| Char | `#1c1c1c` | `--color-char` | Dark surface panels, navigation pill background, elevated dark cards |
| Midnight | `#070707` | `--color-midnight` | Deepest surface for dark feature cards and modal backgrounds |
| Iron | `#262626` | `--color-iron` | Mid-dark panel surface, secondary dark backgrounds behind photography |
| Slate | `#38464a` | `--color-slate` | Cool-tinted dark surface, used for subtle contrast against warmer darks |
| Mist | `#e5e4e4` | `--color-mist` | Light card surfaces, hairline borders on white, image overlay tints |
| Smoke | `#8d8d8d` | `--color-smoke` | Muted helper text, secondary borders, inactive metadata |
| Pewter | `#666666` | `--color-pewter` | Secondary body text, body-emphasis borders |
| Ember | `#b75928` | `--color-ember` | Link text, brand accent, warm highlight on muted cards — single chromatic accent (→ **mapear a brand-500**) |
| Pine | `#193f32` | `--color-pine` | Dark green surface for feature cards and link backgrounds on light (→ **brand-900**) |
| Tide | `#002934` | `--color-tide` | Deep teal-dark surface (→ **brand-700**) |
| Driftwood | `#537179` | `--color-driftwood` | Decorative stroke and fill for illustrations and icon-line work |
| Cedar | `#776157` | `--color-cedar` | (no usar — fuera del mapeo Punto Cero) |
| Coral | `#df6a6b` | `--color-coral` | (no usar — fuera del mapeo Punto Cero) |
| Primary Action Fill | `#494949` | `--color-primary-action-fill` | Neutral button treatment for secondary actions and selected controls |

## Tokens — Typography

### Proxima Nova (sustituto: Montserrat) — Primary typeface across all UI
- **Weights:** 300, 400, 500, 600
- **Sizes:** 8, 12, 13, 14, 15, 16, 18, 20, 22, 30, 36, 62, 80, 168
- **Line height:** 0.80–1.50
- **Letter spacing:** -0.0250em at display (168px, 80px, 62px), -0.0200em at mid headings (36–22px), 0.0100em at body and small text
- Weight 300 carries the brand wordmark at 168px and large section headings (62–80px) — whisper-weight at display sizes. Weight 400–500 handles body, labels, and UI. Weight 600 only for emphasis labels. 21:1 ratio = museum-label-to-billboard scale.

### Lora — Serif accent for body passages and editorial copy
- **Weights:** 400 · **Sizes:** 15, 18 · **Line height:** 1.35–1.50 · **Letter spacing:** 0.0110em
- Used sparingly — a single serif paragraph next to the sans body creates an editorial-press feel. Never above 18px, never in headings.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| body | 15px | 1.5 | 0.15px | `--text-body` |
| subheading | 18px | 1.5 | 0.18px | `--text-subheading` |
| heading-sm | 22px | 1.25 | -0.44px | `--text-heading-sm` |
| heading | 36px | 1.2 | -0.72px | `--text-heading` |
| heading-lg | 62px | 1.1 | -1.55px | `--text-heading-lg` |
| display | 168px | 0.8 | -4.2px | `--text-display` |

## Tokens — Spacing & Shapes

**Density:** comfortable
**Spacing scale:** 4, 5, 6, 8, 10, 12, 13, 14, 16, 19, 20, 22, 24, 32, 48, 64 px

### Border Radius

| Element | Value |
|---------|-------|
| cards | 8px |
| small | 3.2px |
| badges | 1584px |
| images | 8px |
| buttons | 80px |

### Layout
- **Page max-width:** 1200px · **Section gap:** 80px · **Card padding:** 16px · **Element gap:** 16px

## Components

### Brand Wordmark
Weight 300 at 168px, line-height 0.80, letter-spacing -4.2px (-0.0250em). Paper on dark photography, Ink on light sections. The page's hero anchor — 21:1 size ratio vs 15px body is THE signature choice.

### Navigation Pill
Char background, fully rounded (1584px), ~13px vertical padding, brand label + hamburger icon in Paper. Width fits content, height ~32px. Floating top-right over light and dark photography.

### Navigation Card (menu abierto desde la pill)
Char background, 8px radius, 4:3 image LEFT + text block RIGHT. Title 15px w400 Paper, description 12px w400 Mist, right-arrow 14px Paper. **Two cards per row in the open nav state.**

### Text-Arrow Button
Ghost: no fill, no border. Label 13–15px w400 + trailing → at 16px. Paper on dark / Ink on light. Emphasized variant: 80px-radius pill outline, 19px vertical / 16px horizontal padding.

### Filled Dark Button
Char fill, 80px radius, Paper text 13px w500, 19px/16px padding. Used sparingly.

### Section Label
12px w400, Smoke or Pewter, letter-spacing 0.12px, above the heading with 6–8px gap, left-aligned.

### Section Heading
Weight 300 or 400, 36–62px, lh 1.10–1.20, ls -0.0200em. Ink on light / Paper on dark. **Weight 300 at 62px is the recurring signature.**

### Two-Column Feature Card
2 equal cards. Left: Mist bg, 8px radius, overline + heading w300 36–48px + bottom-left text-arrow + bottom-right decorative brand mark. Right: full-bleed photo, 8px radius, overline + heading in Paper overlaid.

### Full-Bleed Hero Section
100vw photography, no radius, full viewport height. Wordmark Paper bottom-left, intro paragraph (15px, Paper, 6–8 lines max) top-left, nav pill top-right. Dark filter implied by subject, not explicit overlay.

### Body Text Block
15–18px w400, lh 1.50, Ink. Max-width ~600px, LEFT-aligned. Brand statement uses Lora 15–18px.

### Numbered List Item
Two-digit number (01, 02) Smoke 12px + label 18px w400 Ink, 6px row gap, 1px Mist hairline above each item.

### Pill Badge / Tag
1584px radius, 6–8px vertical / 14px horizontal padding. Mist bg + Ink text, or transparent + Paper on dark. 12px w500.

### Image Thumbnail Card
8px radius, 4:3, dark overlay. Title 15px Paper, subtitle 12px Mist. Visual menu item — each section represented by its hero photograph.

## Do's

- Weight 300 at 62px+ for premium section headings — the system's voice.
- Text-arrow buttons default for ALL primary actions; filled dark only for high emphasis.
- 80px radius on every button/pill container — the signature curve.
- Every section opener anchored by 100vw full-bleed photograph → white canvas below.
- Single accent (mapeado a brand-500): link text, ONE warm highlight per section max.
- Display ls -0.0250em; body ls 0.0100em. The -4.2px at 168px makes the wordmark feel carved.
- 8px radius on all cards and image containers.

## Don'ts

- No weight 600/700 at display sizes — speaks at 300 even when shouting.
- No accent hues beyond the single accent; green surfaces are for cards, not text/buttons.
- No drop shadows — depth from photography and surface contrast only.
- No centered body paragraphs — strictly left-aligned ~600px.
- No gradients — flat by design.
- 1584px radius ONLY on nav pills/badges/tags.
- Lora never above 18px, never with headings.

## Surfaces (elevación por capas, sin sombras)

Paper #ffffff (canvas) → Mist #e5e4e4 (light card) → brand-900 (green feature card) → brand-700 (deep card) → Char #1c1c1c (nav pill/modals) → Midnight #070707 (photo overlays/premium dark). Dark cards on white, white cards on dark photography, Mist on white = depth.

## Imagery

Photography dominant (50–70% of viewport in openers): muted, slightly desaturated landscape/cityscape — mountains, coastal, aerial city, residential community. Full-bleed 100vw no-radius in heros; 8px in cards. Cool and desaturated treatment. No illustrations, no abstract graphics, no 3D renders.

## Layout

Max-width 1200px centered; full-bleed 100vw at section transitions. Hero: full-viewport photo + 168px wordmark bottom-left + small intro top-left. Rhythm: alternating full-bleed dark photo bands ↔ max-width white canvas, ~80px gaps. 2-column feature grids for CTAs; single-column left-aligned text ≤600px; no centered stacks. Navigation: single dark pill top-right → 2-column card menu with photographic thumbnails.

## Quick Start — Tailwind v4 (@theme; prefijo aker- para no chocar con tokens del sitio)

```css
@theme {
  --color-aker-ink: #000000;
  --color-aker-paper: #ffffff;
  --color-aker-char: #1c1c1c;
  --color-aker-midnight: #070707;
  --color-aker-iron: #262626;
  --color-aker-slate: #38464a;
  --color-aker-mist: #e5e4e4;
  --color-aker-smoke: #8d8d8d;
  --color-aker-pewter: #666666;
  --color-aker-action: #494949;
  /* acento y superficies verdes: usar brand-500 / brand-700 / brand-900 existentes */

  --text-aker-body: 15px;      --leading-aker-body: 1.5;    --tracking-aker-body: 0.15px;
  --text-aker-sub: 18px;       --leading-aker-sub: 1.5;     --tracking-aker-sub: 0.18px;
  --text-aker-hsm: 22px;       --leading-aker-hsm: 1.25;    --tracking-aker-hsm: -0.44px;
  --text-aker-h: 36px;         --leading-aker-h: 1.2;       --tracking-aker-h: -0.72px;
  --text-aker-hlg: 62px;       --leading-aker-hlg: 1.1;     --tracking-aker-hlg: -1.55px;
  --text-aker-display: 168px;  --leading-aker-display: 0.8; --tracking-aker-display: -4.2px;

  --radius-aker-card: 8px; --radius-aker-small: 3.2px; --radius-aker-btn: 80px; --radius-aker-pill: 1584px;
}
```

Marcas de calibración: Aman Resorts, Vipp, Taschen, Patagonia Worn Wear, Heatherwick Studio.
