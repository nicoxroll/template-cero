// INV-01: card premium de oportunidad — monto, retorno estimado, plazo, estado.
// Toda cifra de retorno va acompañada del disclaimer (INV-03).
// Soporta acceso rápido a edición para administradores.

import { Link } from 'react-router';
import { ArrowRight, Pencil } from 'lucide-react';
import {
  INVESTMENT_STATUS_LABELS,
  type Investment,
  type InvestmentStatus,
} from '../../data';
import Card from '../ui/Card';
import ReturnDisclaimer from './ReturnDisclaimer';
import { Photo } from '../ui/Skeleton';
import { useLiveCMS } from '../../lib/LiveCMSContext';

const STATUS_STYLES: Record<InvestmentStatus, string> = {
  activa: 'bg-brand-900 text-white',
  proximamente: 'bg-brand-100 text-brand-700',
  cerrada: 'bg-paper-soft text-ink-soft',
};

export function formatAmount(amount: number, currency: 'USD' | 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface InvestmentCardProps {
  investment: Investment;
}

export default function InvestmentCard({ investment }: InvestmentCardProps) {
  const { slug, title, description, amount, currency, estReturn, termMonths, status, coverImage } =
    investment;
  const { isEditMode } = useLiveCMS();

  return (
    <div className="relative h-full">
      <Link to={`/inversiones/${slug}`} className="block h-full">
        <Card interactive className="flex h-full flex-col">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Photo
              src={coverImage}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span
              className={`absolute left-4 top-4 px-3 py-1 text-xs font-medium uppercase tracking-widest ${STATUS_STYLES[status]}`}
            >
              {INVESTMENT_STATUS_LABELS[status]}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-6">
            <h3 className="text-xl font-light tracking-wide text-ink md:text-2xl">{title}</h3>
            <p className="mt-3 line-clamp-2 text-base font-light leading-relaxed text-ink-soft">
              {description}
            </p>

            <dl className="mt-6 space-y-3 border-t border-hairline pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-xs font-light uppercase tracking-widest text-ink-soft">
                  Ticket Mínimo
                </dt>
                <dd className="font-mono text-sm font-medium text-ink">
                  {formatAmount(amount, currency)}
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-xs font-light uppercase tracking-widest text-ink-soft">
                  Retorno Estimado
                </dt>
                <dd className="flex items-baseline gap-1 font-mono text-sm font-semibold text-brand-700 dark:text-brand-300">
                  <span>{estReturn}</span>
                  <ReturnDisclaimer />
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-xs font-light uppercase tracking-widest text-ink-soft">
                  Plazo Estimado
                </dt>
                <dd className="text-sm font-light text-ink">{termMonths} meses</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-hairline pt-6">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-700 transition-colors duration-300 group-hover:text-brand-900 dark:text-brand-300 dark:group-hover:text-brand-100">
                Ver detalle y documentos
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.5}
                />
              </span>
            </div>
          </div>
        </Card>
      </Link>

      {isEditMode && (
        <Link
          to={`/admin/inversiones`}
          className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 shadow-md rounded transition-colors"
          title="Editar oportunidad en Panel"
        >
          <Pencil className="w-3 h-3" />
          <span>Editar</span>
        </Link>
      )}
    </div>
  );
}
