// INV-03: disclaimer obligatorio junto a TODA cifra de retorno (listado y detalle).

interface ReturnDisclaimerProps {
  className?: string;
}

export const RETURN_DISCLAIMER_TEXT =
  '* Retorno estimado. No constituye garantía de rentabilidad ni oferta pública de valores.';

export default function ReturnDisclaimer({ className = '' }: ReturnDisclaimerProps) {
  return (
    <p className={`text-xs font-light leading-relaxed text-ink-soft ${className}`}>
      {RETURN_DISCLAIMER_TEXT}
    </p>
  );
}
