// Datos institucionales de contacto (CONT-03): teléfono, email, dirección,
// WhatsApp y —en la variante completa— horario de atención y zonas de
// cobertura. Compartido por la página /contacto y el bloque de cierre de la
// home, que en la home se muestra en variante compacta.

import { Building2, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { PageConfig } from '../../data';
import { trackEvent } from '../../lib/analytics';
import { Skeleton } from '../ui/Skeleton';

const ICON_BOX =
  'flex h-10 w-10 shrink-0 items-center justify-center border border-hairline text-brand-500';
const LABEL = 'block text-xs font-medium uppercase tracking-widest text-ink-soft';
const VALUE = 'text-base font-light text-ink';
const VALUE_LINK = `${VALUE} transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-300`;

export function DatosContactoSkeleton({ full = true }: { full?: boolean }) {
  return (
    <div className="space-y-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      ))}
      {full && (
        <div className="space-y-3 border-t border-line pt-6">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
      )}
    </div>
  );
}

interface DatosContactoProps {
  config: PageConfig;
  /** false = solo los 4 canales directos (uso en la home). */
  full?: boolean;
  /** Origen para el evento de analytics del click a WhatsApp. */
  location?: string;
}

export default function DatosContacto({
  config,
  full = true,
  location = 'contacto',
}: DatosContactoProps) {
  return (
    <div className="space-y-6">
      <a
        href={`tel:${config.contactPhone.replace(/[^\d+]/g, '')}`}
        className="group flex items-center gap-4"
      >
        <span className={ICON_BOX}>
          <Phone size={18} strokeWidth={1.5} />
        </span>
        <span>
          <span className={LABEL}>Teléfono</span>
          <span className={VALUE_LINK}>{config.contactPhone}</span>
        </span>
      </a>

      <a href={`mailto:${config.contactEmail}`} className="group flex items-center gap-4">
        <span className={ICON_BOX}>
          <Mail size={18} strokeWidth={1.5} />
        </span>
        <span>
          <span className={LABEL}>Email</span>
          <span className={VALUE_LINK}>{config.contactEmail}</span>
        </span>
      </a>

      <div className="flex items-center gap-4">
        <span className={ICON_BOX}>
          <MapPin size={18} strokeWidth={1.5} />
        </span>
        <span>
          <span className={LABEL}>Dirección</span>
          <span className={VALUE}>{config.address}</span>
        </span>
      </div>

      <a
        href={`https://wa.me/${config.whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('whatsapp_click', { location })}
        className="group flex items-center gap-4"
      >
        <span className={ICON_BOX}>
          <MessageCircle size={18} strokeWidth={1.5} />
        </span>
        <span>
          <span className={LABEL}>WhatsApp</span>
          <span className={VALUE_LINK}>Escríbanos por WhatsApp</span>
        </span>
      </a>

      {full && (
        <div className="space-y-6 border-t border-line pt-6">
          <div className="flex items-center gap-4">
            <span className={ICON_BOX}>
              <Clock size={18} strokeWidth={1.5} />
            </span>
            <span>
              <span className={LABEL}>Horario de atención</span>
              <span className={VALUE}>{config.horarioAtencion}</span>
            </span>
          </div>
          <div className="flex items-start gap-4">
            <span className={ICON_BOX}>
              <Building2 size={18} strokeWidth={1.5} />
            </span>
            <span>
              <span className={LABEL}>Zonas de cobertura</span>
              <span className="mt-2 flex flex-wrap gap-2">
                {config.zonasCobertura.map((zona) => (
                  <span
                    key={zona}
                    className="border border-hairline px-2.5 py-1 text-xs font-light text-ink-soft"
                  >
                    {zona}
                  </span>
                ))}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
