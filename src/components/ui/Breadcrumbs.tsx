import { Link } from 'react-router';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  dark?: boolean;
}

export default function Breadcrumbs({ items, className = '', dark = false }: BreadcrumbsProps) {
  const textColor = dark ? 'text-white/70' : 'text-ink-soft';
  const activeColor = dark ? 'text-white' : 'text-ink';
  const hoverColor = dark ? 'hover:text-brand-300' : 'hover:text-brand-700 dark:hover:text-brand-300';
  const sepColor = dark ? 'text-white/40' : 'text-ink-soft/40';

  // Schema.org JSON-LD para SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.to
        ? `https://www.puntocerodesarrollos.com.ar${item.to}`
        : undefined,
    })),
  };

  return (
    <nav aria-label="Miga de pan" className={`inline-block ${className}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol className={`flex items-center flex-wrap gap-1.5 text-xs font-light tracking-wide ${textColor}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="inline-flex items-center gap-1.5">
              {index === 0 && (
                <Home className="w-3 h-3 shrink-0 mr-0.5 opacity-75" aria-hidden="true" />
              )}
              {isLast || !item.to ? (
                <span
                  aria-current="page"
                  className={`font-normal truncate max-w-[200px] sm:max-w-xs ${activeColor}`}
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className={`transition-colors duration-200 ${hoverColor}`}
                >
                  {item.label}
                </Link>
              )}

              {!isLast && (
                <ChevronRight className={`w-3 h-3 shrink-0 ${sepColor}`} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
