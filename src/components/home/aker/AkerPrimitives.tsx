// Primitivas compartidas del skin Aker — DESIGN-AKER.md es ley:
// · Section Label: 12px w400 Smoke, ls 0.12px.
// · Section Heading: w300, 62px desktop, lh 1.1, ls -0.025em (= -1.55px @62).
// · Text-Arrow Button (ghost): label 13-15px w400 + flecha 16px que desliza
//   4px en hover — el botón primario por defecto de TODO el skin.
// · Pill Button (filled Char / outline énfasis): radio 80px, padding 19px
//   vertical / 16px horizontal, texto 13px w500.
// · Pill Badge/Tag: radio 1584px, 6px/14px padding, 12px w500.

import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

export function AkerContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto max-w-[1200px] px-6 lg:px-10 ${className}`}>{children}</div>;
}

/** Section Label (overline): 12px w400 Smoke, ls 0.12px, left-aligned. */
export function AkerOverline({
  children,
  dark = false,
  className = '',
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`text-[12px] font-normal tracking-[0.12px] uppercase ${
        dark ? 'text-aker-paper/60' : 'text-aker-smoke'
      } ${className}`}
    >
      {children}
    </p>
  );
}

/** Section Heading: Montserrat 300, 36→62px, lh 1.1, ls -0.025em (-1.55px @62). */
export function AkerHeading({
  children,
  as: Tag = 'h2',
  dark = false,
  className = '',
}: {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  dark?: boolean;
  className?: string;
}) {
  return (
    <Tag
      className={`text-[clamp(36px,4.5vw,62px)] leading-[1.1] font-light tracking-[-0.025em] ${
        dark ? 'text-aker-paper' : 'text-aker-ink'
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Links externos (wa.me) van por <a>; Link solo rutas internas. */
function SmartLink({
  to,
  className,
  children,
}: {
  to: string;
  className: string;
  children: ReactNode;
}) {
  if (/^https?:\/\//.test(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

/** Text-Arrow Button (ghost) — DESIGN-AKER.md: sin fill ni borde, label
 * 13-15px w400 + → 16px; en hover la flecha desliza 4px y el link toma el
 * acento de marca. El botón primario por defecto en todo el skin. */
export function AkerTextArrow({
  to,
  children,
  dark = false,
  className = '',
}: {
  to: string;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <SmartLink
      to={to}
      className={`group inline-flex items-center gap-2 text-[15px] font-normal tracking-[0.15px] transition-colors duration-300 ${
        dark ? 'text-aker-paper hover:text-brand-300' : 'text-aker-ink hover:text-brand-500'
      } ${className}`}
    >
      {children}
      <ArrowRight
        aria-hidden
        strokeWidth={1.5}
        className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
      />
    </SmartLink>
  );
}

/** Pill Button — radio firma 80px, padding 19px vertical / 16px horizontal,
 * label 13px w500 (DESIGN-AKER.md § Filled Dark Button / Text-Arrow Button
 * variante enfatizada). variant='filled': Char + Paper (alta jerarquía, se
 * usa poco). variant='outline': pill delineada sin fill — el énfasis por
 * defecto sobre foto y superficies claras. */
export function AkerPillButton({
  to,
  children,
  variant = 'filled',
  dark = false,
  className = '',
}: {
  to: string;
  children: ReactNode;
  variant?: 'filled' | 'outline';
  /** outline sobre foto/superficie oscura: trazo y texto Paper. */
  dark?: boolean;
  className?: string;
}) {
  const variantClass =
    variant === 'filled'
      ? 'bg-aker-char text-aker-paper hover:bg-black'
      : dark
        ? 'border border-aker-paper/50 text-aker-paper hover:border-aker-paper hover:bg-white/5'
        : 'border border-aker-ink/30 text-aker-ink hover:border-aker-ink hover:bg-aker-ink/5';

  return (
    <SmartLink
      to={to}
      className={`group inline-flex items-center justify-center gap-2 rounded-aker-button px-4 py-[19px] text-[13px] leading-none font-medium tracking-[0.15px] transition-colors duration-300 ${variantClass} ${className}`}
    >
      {children}
      <ArrowRight
        aria-hidden
        strokeWidth={1.5}
        className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
      />
    </SmartLink>
  );
}

/** Pill Badge/Tag — radio 1584px, 6px/14px padding, 12px w500. Mist + Ink en
 * claro; transparente + Paper delineado en oscuro (DESIGN-AKER.md). */
export function AkerTagChip({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-aker-pill px-3.5 py-1.5 text-[12px] font-medium ${
        dark ? 'border border-aker-paper/40 text-aker-paper' : 'bg-aker-mist text-aker-ink'
      }`}
    >
      {children}
    </span>
  );
}

/** Hairline divider 1px Mist — disciplina de líneas del skin. */
export function AkerHairline({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`h-px w-full bg-aker-mist ${className}`} />;
}
