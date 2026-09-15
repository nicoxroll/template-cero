// Primitivas del skin Ciridae (modo NORMAL) — DESIGN-CIRIDAE.md es LEY.
// Consumo por otros agentes:
//   import { GhostPill, SharpButton, PillBadge, SystemCard, SectionHeading, Hairline }
//     from 'src/components/home/ciridae/CiridaePrimitives';
//
// Reglas del sistema (no negociables, ver doc § Do/Don't):
//   · void black #0b0b0b, MAYÚSCULAS condensadas weight 400 SIEMPRE (Oswald,
//     font-cir-cond) — nunca bold, nunca mixed case en UI/labels.
//   · Radios: pill 1440px en TODO botón/badge/nav; 10px SOLO en SystemCard;
//     0px SOLO en SharpButton (news bar).
//   · CERO sombras, CERO gradientes, CERO rellenos de color en interactivos:
//     todos los botones son fantasma (fondo transparente u opaco void/abyss,
//     nunca un color de marca de fondo).
//   · El acento es brand-500 (verde Punto Cero, NO ember rust) — se usa
//     SOLO en hairlines y highlights chicos de texto, nunca como relleno.
//     Estas primitivas no aplican brand-500 por defecto: el consumidor lo
//     agrega vía className donde el doc lo pida (p. ej. un hairline de
//     sección o un ícono puntual).
//   · Roboto Mono 11px caps exclusivo de datos de sistema (ticker, metadata)
//     — no está expuesto acá como primitiva de botón/badge, solo como
//     utilidad de texto (font-cir-mono) para que el consumidor arme su
//     propio ticker/metadata row.
//
// Cada primitiva es tipada, sin sombras, sin fill de color interactivo.

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

const CIR_COND = 'font-cir-cond uppercase';

type CommonPillProps = {
  children: ReactNode;
  className?: string;
};

/** Ghost Pill — control primario de todo el sitio (nav, "Start Now", etc).
 * Fondo transparente, borde 1px blanco, radio 1440px, 14px caps condensada
 * blanca, tracking -0.02em. Renderiza <a> si recibe href, <button> si no. */
type GhostPillProps = CommonPillProps &
  (
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

export function GhostPill({ children, className = '', href, ...rest }: GhostPillProps) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-cir-pill border border-cir-white px-5 py-2.5 text-cir-body ${CIR_COND} text-cir-white tracking-[-0.02em] transition-colors duration-300 hover:bg-cir-white/10 ${className}`;

  if (href !== undefined) {
    return (
      <a href={href} className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}

/** Sharp Button — EXCLUSIVO de la news bar superior. Fondo Abyss, borde 1px
 * blanco, radio 0 (esquinas vivas — la forma distinta señala otra zona
 * funcional, ver doc § News Bar Solid Button). No usar fuera de la barra. */
type SharpButtonProps = CommonPillProps &
  (
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

export function SharpButton({ children, className = '', href, ...rest }: SharpButtonProps) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-cir-sharp border border-cir-white bg-cir-abyss px-5 py-2.5 text-cir-body ${CIR_COND} text-cir-white tracking-[-0.02em] transition-colors duration-300 hover:bg-cir-charcoal ${className}`;

  if (href !== undefined) {
    return (
      <a href={href} className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}

/** Pill Badge — marcadores numerados ("01", "02") y labels chicos.
 * Transparente, borde 1px Ash, radio 1440px, 14px caps condensada. */
export function PillBadge({ children, className = '' }: CommonPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-cir-pill border border-cir-ash px-[11px] py-[5px] text-cir-body ${CIR_COND} text-cir-white tracking-[-0.02em] ${className}`}
    >
      {children}
    </span>
  );
}

/** System Card — fondo Charcoal #272a2a, radio 10px, SIN box-shadow, padding
 * 32px vertical (horizontal 0: el contenido alinea al borde, doc § System
 * Card). Único radio no-pill del sistema: pill = interactivo, 10px =
 * contenedor. */
export function SystemCard({ children, className = '' }: CommonPillProps) {
  return (
    <div className={`rounded-cir-card bg-cir-charcoal py-8 shadow-none ${className}`}>
      {children}
    </div>
  );
}

/** Section Heading Block — eyebrow 14px caps condensada + titular 32px caps
 * condensada, centrado, 40-60px de aire arriba/abajo (doc § Section Heading
 * Block). Pensado sobre Void Black; pasar className para variantes sobre
 * Bone (texto oscuro) si la sección clara lo requiere. */
export function SectionHeading({
  eyebrow,
  title,
  dark = true,
  className = '',
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  /** true (default) = texto blanco sobre Void; false = texto void sobre Bone. */
  dark?: boolean;
  className?: string;
}) {
  const textColor = dark ? 'text-cir-white' : 'text-cir-void';
  return (
    <div className={`flex flex-col items-center gap-4 py-10 text-center sm:py-[60px] ${className}`}>
      <p className={`text-cir-body ${CIR_COND} tracking-[-0.02em] ${textColor} opacity-70`}>
        {eyebrow}
      </p>
      <h2 className={`text-cir-hlg ${CIR_COND} tracking-[-0.02em] ${textColor}`}>{title}</h2>
    </div>
  );
}

/** Hairline — línea de 1px, la unidad de separación del sistema (nunca
 * sombra). Default Ash sobre Void; pasar className (p. ej. bg-brand-500)
 * para el hairline de acento puntual que pide el doc. */
export function Hairline({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`h-px w-full bg-cir-ash/30 ${className}`} />;
}
