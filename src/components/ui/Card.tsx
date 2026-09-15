import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  /** true agrega hover premium (elevación + sombra). Usar en cards clickeables. */
  interactive?: boolean;
  className?: string;
}

/**
 * Card idioma Punto Cero: blanca, borde fino, sin sombra en reposo.
 * Para imagen con zoom al hover, envolver la card en `group` y usar
 * `group-hover:scale-105 transition-transform duration-700` en la <img>.
 */
export default function Card({ children, interactive = false, className = '' }: CardProps) {
  return (
    <div
      className={`group overflow-hidden border border-line bg-paper ${
        interactive
          ? 'transition-all duration-500 hover:-translate-y-1 hover:shadow-xl'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
