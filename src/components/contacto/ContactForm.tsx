// Formulario de contacto (CONT-01, CONT-04): RHF + zod → leadRepo.
// Extraído de src/pages/Contacto.tsx para que la home pueda cerrar con un
// bloque de contacto real —el ritmo de realstack, que remata la portada con el
// formulario— sin duplicar validación, texto legal ni el mapeo a `Lead`.
// `location` solo viaja a analytics: la atribución del lead sigue siendo
// source: 'contacto' en ambos montajes.

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { leadRepo } from '../../data';
import { trackEvent } from '../../lib/analytics';
import { dispatchLeadNotification } from '../../lib/leadNotifications';
import Button from '../ui/Button';
import PrivacyModal from './PrivacyModal';


const contactSchema = z.object({
  name: z.string().min(2, 'Ingrese su nombre completo.'),
  email: z.string().email('Ingrese un email válido.'),
  phone: z
    .string()
    .min(6, 'Ingrese un teléfono de contacto.')
    .regex(/^[\d\s()+-]+$/, 'El teléfono solo puede contener números, espacios y + ( ) -.'),
  message: z.string().min(10, 'Cuéntenos brevemente su consulta (mínimo 10 caracteres).'),
  privacy: z.boolean().refine((v) => v === true, {
    message: 'Debe aceptar la política de privacidad para enviar el formulario.',
  }),
});

type ContactFormData = z.infer<typeof contactSchema>;

const INPUT_CLS =
  'w-full rounded-none border border-line bg-paper px-4 py-3 text-base font-light text-ink placeholder:text-ink-soft/50 transition-colors duration-300 focus:border-brand-500 focus:outline-none';

const LABEL_CLS = 'mb-2 block text-xs font-medium uppercase tracking-widest text-ink-soft';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-sm font-light text-red-700 dark:text-red-400">
      {message}
    </p>
  );
}

interface ContactFormProps {
  /** Etiqueta de origen para analytics ('contacto' | 'home'). No cambia el lead. */
  location?: string;
  /** Prefijo de los `id` de los campos: dos montajes en la misma página
   * romperían la asociación label↔input si compartieran ids. */
  idPrefix?: string;
  /** Mensaje de éxito más corto cuando el formulario cierra la home. */
  compact?: boolean;
}

export default function ContactForm({
  location = 'contacto',
  idPrefix = 'contact',
  compact = false,
}: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', message: '', privacy: false },
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitError(false);
    try {
      const created = await leadRepo.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        source: 'contacto',
      });
      void dispatchLeadNotification(created);
      trackEvent('form_submit', { form: 'contacto', location });
      setSubmitted(true);
      reset();
    } catch {
      setSubmitError(true);
    }
  };


  if (submitted) {
    return (
      <div
        className={`flex h-full flex-col items-start justify-center border border-hairline bg-brand-50 dark:bg-brand-900/25 ${
          compact ? 'p-8' : 'p-8 md:p-12'
        }`}
      >
        <CheckCircle2 size={40} strokeWidth={1.25} className="text-brand-500" />
        <h3 className="mt-6 text-xl font-light tracking-wide text-ink md:text-2xl">
          Mensaje enviado
        </h3>
        <p className="mt-4 text-base font-light leading-relaxed text-ink-soft">
          Gracias por escribirnos. Un miembro de nuestro equipo se pondrá en contacto a la
          brevedad.
        </p>
        <Button variant="ghost" type="button" className="mt-8" onClick={() => setSubmitted(false)}>
          Enviar otra consulta
        </Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-name`} className={LABEL_CLS}>
              Nombre
            </label>
            <input
              id={`${idPrefix}-name`}
              type="text"
              autoComplete="name"
              placeholder="Su nombre completo"
              className={INPUT_CLS}
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-phone`} className={LABEL_CLS}>
              Teléfono
            </label>
            <input
              id={`${idPrefix}-phone`}
              type="tel"
              autoComplete="tel"
              placeholder="+54 11 5555 0123"
              className={INPUT_CLS}
              aria-invalid={!!errors.phone}
              {...register('phone')}
            />
            <FieldError message={errors.phone?.message} />
          </div>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className={LABEL_CLS}>
            Email
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            autoComplete="email"
            placeholder="nombre@empresa.com"
            className={INPUT_CLS}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-message`} className={LABEL_CLS}>
            Mensaje
          </label>
          <textarea
            id={`${idPrefix}-message`}
            rows={compact ? 4 : 5}
            placeholder="Cuéntenos sobre su proyecto o consulta"
            className={`${INPUT_CLS} resize-y`}
            aria-invalid={!!errors.message}
            {...register('message')}
          />
          <FieldError message={errors.message?.message} />
        </div>

        {/* Aviso de privacidad — Ley 25.326 (CONT-04) */}
        <div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded-none border-line accent-brand-900 dark:accent-brand-500"
              aria-invalid={!!errors.privacy}
              {...register('privacy')}
            />
            <span className="text-sm font-light leading-relaxed text-ink-soft">
              He leído y acepto la{' '}
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="font-medium text-brand-500 underline underline-offset-2 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
              >
                política de privacidad
              </button>{' '}
              y presto consentimiento para el tratamiento de mis datos personales conforme a la Ley
              25.326.
            </span>
          </label>
          <FieldError message={errors.privacy?.message} />
        </div>

        {submitError && (
          <p role="alert" className="text-sm font-light text-red-700 dark:text-red-400">
            No pudimos enviar su consulta. Intente nuevamente en unos minutos o escríbanos por
            WhatsApp.
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Enviar consulta'}
        </Button>
      </form>

      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </>
  );
}
