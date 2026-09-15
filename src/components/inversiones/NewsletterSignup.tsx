import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Upload, Eye, EyeOff } from 'lucide-react';
import { newsletterRepo } from '../../data';
import { trackEvent } from '../../lib/analytics';
import { gsapReveal } from '../../lib/gsapReveal';
import { useParallax } from '../../lib/useParallax';
import { IMAGERY } from '../../lib/siteImagery';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { useLiveSection } from '../../lib/useLiveSection';
import { EditableSectionWrapper, EditableText } from '../ui/InlineEditOverlay';
import { uploadImage } from '../../data/storage';

const schema = z.object({
  email: z.string().email('Ingrese un email válido'),
  consent: z.boolean().refine((v) => v === true, 'Debe aceptar los términos para continuar'),
});

type FormValues = z.infer<typeof schema>;

interface NewsletterSignupProps {
  /** Origen para analytics: la sección se monta en /inversiones y en la home. */
  location?: string;
}

export default function NewsletterSignup({ location = 'inversiones' }: NewsletterSignupProps) {
  const [subscribed, setSubscribed] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLElement>(null);
  const photoRef = useParallax<HTMLDivElement>({ amount: 18, triggerRef: outerRef });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: newsletterData,
    update: updateNewsletter,
    save: handleSave,
    cancel: handleCancel,
  } = useLiveSection({
    kicker: { key: 'newsletter.kicker', default: 'Newsletter de inversores' },
    title: { key: 'newsletter.title', default: 'Avisarme de nuevas oportunidades' },
    description: {
      key: 'newsletter.description',
      default:
        'Deje su email y reciba cada nueva oportunidad de inversión antes de su publicación general.',
    },
    photo: { key: 'newsletter.photo', default: IMAGERY.newsletter },
    sectionVisible: { key: 'newsletter.visible', default: 'true' },
  });

  const isVisible = newsletterData.sectionVisible !== 'false';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      updateNewsletter('photo', url);
    } catch (err) {
      console.error(err);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', consent: false },
  });

  useEffect(() => {
    if (!sectionRef.current) return;
    return gsapReveal(sectionRef.current);
  }, []);

  const onSubmit = async ({ email }: FormValues) => {
    setSubmitError(false);
    try {
      await newsletterRepo.subscribe(email);
      trackEvent('newsletter_signup', { location });
      setSubscribed(true);
    } catch {
      setSubmitError(true);
    }
  };

  return (
    <EditableSectionWrapper
      sectionId="newsletter-strip"
      sectionLabel="Newsletter"
      onSave={handleSave}
      onCancel={handleCancel}
      pencilPosition="top-8 right-8"
    >
      {(isEditing) => {
        if (!isVisible && !isEditing) return null;
        return (
          <section
            ref={outerRef}
            className="relative overflow-hidden bg-brand-900 py-20 text-white md:py-28 lg:py-32"
          >
            {/* Input oculto para cambiar foto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="focus-ring absolute top-6 left-6 z-40 flex items-center gap-2 bg-ink-fixed/90 text-white border border-brand-400/70 px-4 py-2 rounded text-xs uppercase tracking-wider hover:bg-brand-500 hover:text-white transition-all cursor-pointer shadow-xl font-mono"
              >
                <Upload className="w-3.5 h-3.5" /> Cambiar Fondo
              </button>
            )}

            {/* Foto entera y a opacidad plena, con velo NEGRO moderado */}
            <div
              ref={photoRef}
              aria-hidden
              className="absolute -inset-y-[12%] inset-x-0 bg-cover bg-center transition-all duration-500"
              style={{ backgroundImage: `url(${newsletterData.photo})` }}
            />
            <div aria-hidden className="absolute inset-0 bg-black/60" />
            <div aria-hidden className="absolute inset-0 bg-brand-900/25" />
            <Container className="relative z-10">
              {isEditing && (
                <div className="mb-8 p-4 bg-black/60 border border-white/20 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs max-w-2xl mx-auto">
                  <div className="flex items-center gap-2">
                    {isVisible ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                        <Eye className="w-4 h-4" /> La sección está <strong>visible</strong> para los visitantes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-400">
                        <EyeOff className="w-4 h-4" /> La sección está <strong>oculta</strong> para los visitantes
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateNewsletter('sectionVisible', isVisible ? 'false' : 'true')}
                    className={`px-3 py-1.5 font-medium tracking-wide uppercase transition-colors rounded ${
                      isVisible
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                        : 'bg-brand-500 hover:bg-brand-600 text-white'
                    }`}
                  >
                    {isVisible ? 'Ocultar sección' : 'Hacer visible'}
                  </button>
                </div>
              )}

              <div ref={sectionRef} className="mx-auto max-w-2xl text-center">
              {subscribed ? (
                <div role="status">
                  <CheckCircle2 aria-hidden className="mx-auto h-10 w-10 text-brand-300" />
                  <h2 className="mt-6 text-3xl font-light uppercase tracking-wide md:text-4xl">
                    Suscripción confirmada
                  </h2>
                  <p className="mt-4 text-base font-light leading-relaxed text-white/80">
                    Le avisaremos por email cuando publiquemos una nueva oportunidad de inversión.
                    Sin frecuencia fija, sin promociones: solo novedades relevantes.
                  </p>
                </div>
              ) : (
                <>
                  <EditableText
                    as="p"
                    value={newsletterData.kicker}
                    isEditing={isEditing}
                    onChange={(val) => updateNewsletter('kicker', val)}
                    className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-brand-300 md:text-sm block"
                  />
                  <EditableText
                    as="h2"
                    value={newsletterData.title}
                    isEditing={isEditing}
                    onChange={(val) => updateNewsletter('title', val)}
                    className="text-3xl font-light uppercase tracking-wide md:text-4xl text-white block"
                  />
                  <EditableText
                    as="p"
                    value={newsletterData.description}
                    isEditing={isEditing}
                    multiline
                    onChange={(val) => updateNewsletter('description', val)}
                    className="mt-4 text-base font-light leading-relaxed text-white/80 block"
                  />

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="mt-10 text-left"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="flex-1">
                        <label htmlFor="newsletter-email" className="sr-only">
                          Email
                        </label>
                        <input
                          id="newsletter-email"
                          type="email"
                          autoComplete="email"
                          placeholder="Su email"
                          aria-invalid={errors.email ? true : undefined}
                          className="w-full rounded-none border border-white/30 bg-transparent px-5 py-3.5 text-base font-light text-white placeholder:text-white/50 focus:border-brand-300 focus:outline-none"
                          {...register('email')}
                        />
                      </div>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Enviando…' : 'Suscribirme'}
                      </Button>
                    </div>
                    {errors.email && (
                      <p role="alert" className="mt-2 text-sm font-light text-brand-300">
                        {errors.email.message}
                      </p>
                    )}

                    <label className="mt-6 flex items-start gap-3 text-sm font-light leading-relaxed text-white/70">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded-none accent-brand-500"
                        {...register('consent')}
                      />
                      <span>
                        Acepto que Punto Cero Desarrollos utilice mi email para enviarme información
                        sobre nuevas oportunidades de inversión, conforme a la Ley 25.326 de
                        Protección de Datos Personales. Puedo solicitar la baja en cualquier momento.
                      </span>
                    </label>
                    {errors.consent && (
                      <p role="alert" className="mt-2 text-sm font-light text-brand-300">
                        {errors.consent.message}
                      </p>
                    )}
                    {submitError && (
                      <p role="alert" className="mt-4 text-sm font-light text-brand-300">
                        No pudimos registrar su suscripción. Intente nuevamente en unos minutos.
                      </p>
                    )}
                  </form>
                </>
              )}
            </div>
          </Container>
        </section>
        );
      }}
    </EditableSectionWrapper>
  );
}
