import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';

type Variant = 'primary' | 'outline' | 'ghost';

const BASE =
  'focus-ring inline-flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-widest transition-all duration-300 rounded-none px-8 py-3.5 min-h-[44px] disabled:opacity-50 disabled:pointer-events-none';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-900 text-white hover:bg-brand-700',
  outline:
    'border border-ink text-ink hover:bg-ink hover:text-paper data-[dark]:border-white data-[dark]:text-white data-[dark]:hover:bg-white data-[dark]:hover:text-brand-900',
  ghost: 'text-brand-700 hover:text-brand-900 px-2 py-2 dark:text-brand-300 dark:hover:text-brand-100',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Si se pasa, renderiza un <Link> de react-router con estilo de botón */
  to?: string;
  /** Variante outline/ghost sobre fondo oscuro */
  dark?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  to,
  dark,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cls = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls} data-dark={dark ? '' : undefined}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} data-dark={dark ? '' : undefined} {...rest}>
      {children}
    </button>
  );
}
