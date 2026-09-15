// Isotipo Punto Cero: skyline de línea — dos casas a los costados y dos torres
// al centro, una con mástil. Reconstruido como vector (no es un trazado
// automático del PNG): así queda nítido en cualquier tamaño, pesa ~1 kB y puede
// heredar el color del contexto.
//
// El color se controla desde afuera con `className`:
//   · `gradient` (default) usa el degradado verde de marca, como el original;
//   · `currentColor` lo pinta del color del texto que lo rodea — necesario en
//     el header transparente sobre el video, donde el logo va en blanco.

interface LogoMarkProps {
  className?: string;
  /** 'gradient' = verde de marca | 'current' = hereda color del contexto */
  tone?: 'gradient' | 'current';
  /** id único del gradiente: dos instancias en la misma página lo comparten. */
  gradientId?: string;
}

export default function LogoMark({
  className = 'h-8 w-auto',
  tone = 'gradient',
  gradientId = 'pc-logo-gradient',
}: LogoMarkProps) {
  const stroke = tone === 'gradient' ? `url(#${gradientId})` : 'currentColor';

  return (
    <svg
      viewBox="0 0 132 88"
      fill="none"
      role="img"
      aria-label="Punto Cero Desarrollos"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {tone === 'gradient' && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="132" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4E7C5C" />
            <stop offset="0.55" stopColor="#2C5741" />
            <stop offset="1" stopColor="#16351F" />
          </linearGradient>
        </defs>
      )}

      <g
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Casa izquierda: techo a dos aguas + cuerpo abierto hacia la base */}
        <path d="M10 47 L30 30 L50 47" />
        <path d="M14 44 V78" />
        <path d="M50 47 V78" />
        {/* Ventana chica de la casa izquierda */}
        <path d="M27 55 h9 v9 h-9 z" />

        {/* Torre central alta, con mástil */}
        <path d="M58 78 V16 h14 v62" />
        <path d="M65 16 V4" />

        {/* Segunda torre, más baja y angosta */}
        <path d="M80 78 V26 h10" />

        {/* Casa derecha: techo a dos aguas más chico */}
        <path d="M92 47 L106 34 L120 47" />
        <path d="M96 45 V78" />
        <path d="M120 47 V78" />
        {/* Ventana chica de la casa derecha */}
        <path d="M103 57 h7 v7 h-7 z" />

        {/* Línea de base: apoya todo el conjunto */}
        <path d="M6 80 H126" />
      </g>
    </svg>
  );
}
