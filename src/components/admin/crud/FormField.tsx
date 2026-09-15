// Primitivas de formulario del admin (ADMIN-01/02):
// input de línea fina, label uppercase, error accesible. Sin colores fuera de paleta
// salvo el rojo funcional de error (feedback de validación).

import type { ReactNode } from 'react';

export const INPUT_CLS =
  'focus-ring w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm font-light text-ink placeholder:text-ink-soft/50 transition-colors duration-300 focus:border-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-paper-soft disabled:text-ink-soft';

export const INPUT_ERROR_CLS = 'border-red-400 focus:border-red-500';

export function inputCls(hasError?: boolean): string {
  return `${INPUT_CLS} ${hasError ? INPUT_ERROR_CLS : ''}`;
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  /** id del control asociado (htmlFor) */
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

/** Label uppercase + control + hint/error. */
export function Field({ label, error, hint, htmlFor, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-soft"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-light text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs font-light text-ink-soft/70">{hint}</p>
      ) : null}
    </div>
  );
}

/** Separador de sección dentro del formulario. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-6">
      <legend className="pr-4 text-xs font-medium uppercase tracking-[0.3em] text-brand-500">
        {title}
      </legend>
      <div className="mt-4 space-y-4">{children}</div>
    </fieldset>
  );
}

/** Checkbox con label inline, estilo sobrio. */
export function CheckboxField({
  label,
  hint,
  error,
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-sm border-line accent-brand-900 dark:accent-brand-500"
        {...rest}
      />
      <span>
        <span className="block text-sm font-light text-ink">{label}</span>
        {hint && <span className="block text-xs font-light text-ink-soft/70">{hint}</span>}
        {error && (
          <span role="alert" className="block text-xs font-light text-red-600 dark:text-red-400">
            {error}
          </span>
        )}
      </span>
    </label>
  );
}
