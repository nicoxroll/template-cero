# CLAUDE.md — Template Cero Assistant Guide

## Project
**Template Cero** is a modular, production-ready corporate website and showcase template featuring:
- React 19, TypeScript 6, Vite 8, Tailwind CSS v4, GSAP animations, and Lenis smooth scrolling.
- Dual-mode data layer: runs in zero-config mock mode (persisting to `localStorage`) and seamlessly connects to Supabase when environment variables are supplied.
- Integrated `/admin` panel with mock login (`admin@templatecero.com` / `demo`) or real Supabase auth with RLS.
- Live in-context CMS editor.
- Automated SEO prerendering script producing static route HTML files and sitemaps.

## Build & Test Commands
- Dev server: `npm run dev`
- Production build: `npm run build`
- Type checking: `npm run typecheck`
- Linting: `npm run lint`
- Preview build: `npm run preview`
- Generate sample PDFs: `node scripts/gen-docs.mjs`

## Architecture & Code Guidelines

### 1. Data Architecture & Repositories
- All data access in components **must** go through `src/data` singletons (`projectRepo`, `investmentRepo`, `leadRepo`, etc.).
- Never import `fixtures.ts` or make direct Supabase queries inside React components.
- When changing domain types in `src/data/types.ts`, update `src/data/fixtures.ts`, `src/data/supabaseMappers.ts`, and `supabase/schema-completo.sql`.

### 2. Styling with Tailwind CSS v4
- Uses CSS-first configuration via `@theme` in `src/index.css`.
- No `tailwind.config.js` exists or should be added.
- Dark mode is activated via `.dark` class on the root `<html>`.

### 3. Routing
- Package is `react-router` v8. Do not import `react-router-dom`.
- New routes must be lazy-loaded in `src/App.tsx` and listed in `scripts/prerender-og.mjs` for SEO.

### 4. Animations
- Use `@gsap/react` hook `useGSAP` for all GSAP and ScrollTrigger animations to ensure proper cleanup.
- Support `prefersReducedMotion()`.

### 5. Site Configuration
- Use `src/config/site.ts` as the central reference for brand name, tagline, URLs, contact numbers, and navigation.
