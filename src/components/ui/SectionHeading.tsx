import SplitReveal from './SplitReveal';

interface SectionHeadingProps {
  /** Mini-etiqueta uppercase sobre el título (ej: "Nuestros proyectos") */
  kicker?: string;
  title: string;
  intro?: string;
  align?: 'left' | 'center';
  /** true cuando se renderiza sobre fondo oscuro */
  dark?: boolean;
  className?: string;
}

export default function SectionHeading({
  kicker,
  title,
  intro,
  align = 'left',
  dark = false,
  className = '',
}: SectionHeadingProps) {
  const alignCls = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`max-w-3xl ${alignCls} ${className}`}>
      {kicker && (
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-brand-500 md:text-sm">
          {kicker}
        </p>
      )}
      {/* El título entra palabra por palabra desde debajo de una máscara — es
          el gesto que le da peso editorial a cada sección. El resto del bloque
          no se anima: si el kicker, el título y la bajada entraran los tres
          por separado, la página se volvería inquieta. */}
      <SplitReveal
        as="h2"
        text={title}
        className={`text-3xl font-light uppercase tracking-wide md:text-4xl lg:text-5xl ${
          dark ? 'text-white' : 'text-ink'
        }`}
      />
      {intro && (
        <p
          className={`mt-6 text-lg font-light leading-relaxed ${
            dark ? 'text-white/80' : 'text-ink-soft'
          }`}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
