// Configuración del sitio (HERO-05 lado config + datos de contacto y métricas)
// sobre configRepo. Incluye el switch "Modo cinemático (scroll video)".

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Check,
  Send,
  Trash2,
  UserPlus,
  Shield,
  Loader2,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  adminUserRepo,
  configRepo,
  siteContentRepo,
  SITE_CONTENT_UPDATED_EVENT,
  type AdminUser,
} from '../../data';
import { usePageMeta } from '../../lib/usePageMeta';
import { invalidateHeroScrubCache } from '../../lib/useHeroScrubEnabled';
import { Skeleton, useMinVisible } from '../../components/ui/Skeleton';
import AdminShell from '../../components/admin/shell/AdminShell';
import { getSession } from '../../components/admin/shell/adminAuth';
import { testWebhook } from '../../lib/leadNotifications';
import ConfirmDialog from '../../components/admin/crud/ConfirmDialog';
import Button from '../../components/ui/Button';

const int = (msg: string) =>
  z.number({ message: 'Ingrese un número' }).int('Debe ser un entero').min(0, msg);

const configSchema = z.object({
  heroScrubEnabled: z.boolean(),
  contactEmail: z.string().min(1, 'Ingrese el email de contacto').email('Ingrese un email válido'),
  contactPhone: z.string().min(6, 'Ingrese un teléfono válido'),
  whatsappNumber: z
    .string()
    .regex(/^\d{8,15}$/, 'Solo dígitos con código de país, sin espacios (ej: 5491155550123)'),
  address: z.string().min(5, 'Ingrese la dirección'),
  officeCoords: z.object({
    lat: z
      .number({ message: 'Ingrese un número' })
      .refine((v) => Math.abs(v) <= 90, 'Latitud fuera de rango (−90 a 90)'),
    lng: z
      .number({ message: 'Ingrese un número' })
      .refine((v) => Math.abs(v) <= 180, 'Longitud fuera de rango (−180 a 180)'),
  }),
  horarioAtencion: z.string().min(3, 'Ingrese el horario de atención'),
  zonasCobertura: z.string().min(1, 'Ingrese al menos una zona'),
  metrics: z.object({
    years: int('No puede ser negativo'),
    m2: int('No puede ser negativo'),
    projects: int('No puede ser negativo'),
  }),
  legalName: z.string().min(3, 'Ingrese la razón social'),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d$/, 'Formato XX-XXXXXXXX-X'),
  matricula: z.string().min(3, 'Ingrese la matrícula'),
  domicilioLegal: z.string().min(5, 'Ingrese el domicilio legal'),
  disclaimers: z.object({
    ofertaPublica: z.string().min(20, 'El texto de Ley 26.831 no puede quedar vacío'),
    datosPersonales: z.string().min(20, 'El texto de Ley 25.326 no puede quedar vacío'),
  }),
  leadNotificationWebhook: z.string().optional(),
  leadNotificationEmail: z.string().optional(),
});

type ConfigForm = z.infer<typeof configSchema>;

const FIELD_CLS =
  'w-full border border-line bg-paper px-4 py-3 text-sm font-light text-ink outline-none transition-colors duration-300 placeholder:text-ink-soft/50 focus:border-brand-500';
const LABEL_CLS = 'mb-2 block text-xs font-medium uppercase tracking-widest text-ink-soft';
const ERROR_CLS = 'mt-2 text-xs font-light text-red-700 dark:text-red-400';

type TabKey =
  | 'portada'
  | 'contacto'
  | 'notificaciones'
  | 'usuarios'
  | 'metricas'
  | 'societarios'
  | 'legales';

const TABS: { key: TabKey; label: string; campos: string[] }[] = [
  { key: 'portada', label: 'Portada', campos: ['heroScrubEnabled'] },
  {
    key: 'contacto',
    label: 'Contacto',
    campos: [
      'contactEmail',
      'contactPhone',
      'whatsappNumber',
      'address',
      'officeCoords',
      'horarioAtencion',
      'zonasCobertura',
    ],
  },
  {
    key: 'notificaciones',
    label: 'Notificaciones',
    campos: ['leadNotificationWebhook', 'leadNotificationEmail'],
  },
  { key: 'usuarios', label: 'Usuarios y Permisos', campos: [] },
  { key: 'metricas', label: 'Métricas', campos: ['metrics'] },
  {
    key: 'societarios',
    label: 'Datos societarios',
    campos: ['legalName', 'cuit', 'matricula', 'domicilioLegal'],
  },
  { key: 'legales', label: 'Avisos legales', campos: ['disclaimers'] },
];


function SectionCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-line bg-paper p-6 md:p-8">
      <h2 className="text-xl font-light tracking-wide text-ink">{title}</h2>
      {intro && <p className="mt-2 text-sm font-light leading-relaxed text-ink-soft">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ConfigSkeleton() {
  return (
    <div aria-hidden className="max-w-3xl space-y-8">
      {[3, 4, 3].map((rows, i) => (
        <div key={i} className="border border-line bg-paper p-6 md:p-8">
          <Skeleton className="h-6 w-2/5" />
          <div className="mt-6 space-y-5">
            {Array.from({ length: rows }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-11 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Skeleton className="h-12 w-48" />
    </div>
  );
}

export default function AdminConfiguracion() {
  usePageMeta({ title: 'Admin — Configuración' });

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<TabKey>('portada');
  const showSkeleton = useMinVisible(loading);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const [teamVisible, setTeamVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['quienes.teamVisible'] === 'true';
  });
  const [serviciosVisible, setServiciosVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['servicios.visible'] !== 'false';
  });
  const [featuredVisible, setFeaturedVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['featured.visible'] !== 'false';
  });
  const [inversionesVisible, setInversionesVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['inversiones.visible'] !== 'false';
  });
  const [newsletterVisible, setNewsletterVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['newsletter.visible'] !== 'false';
  });
  const [faqVisible, setFaqVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['inversiones.faq.visible'] !== 'false';
  });
  const [calculadoraVisible, setCalculadoraVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['inversiones.calculadora.visible'] !== 'false';
  });
  const [alianzasVisible, setAlianzasVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['home.alianzas.visible'] !== 'false';
  });
  const [tipologiasVisible, setTipologiasVisible] = useState<boolean>(() => {
    return siteContentRepo.getSync()['proyectos.tipologias.visible'] !== 'false';
  });

  useEffect(() => {
    const onUpdate = () => {
      const sync = siteContentRepo.getSync();
      setTeamVisible(sync['quienes.teamVisible'] === 'true');
      setServiciosVisible(sync['servicios.visible'] !== 'false');
      setFeaturedVisible(sync['featured.visible'] !== 'false');
      setInversionesVisible(sync['inversiones.visible'] !== 'false');
      setNewsletterVisible(sync['newsletter.visible'] !== 'false');
      setFaqVisible(sync['inversiones.faq.visible'] !== 'false');
      setCalculadoraVisible(sync['inversiones.calculadora.visible'] !== 'false');
      setAlianzasVisible(sync['home.alianzas.visible'] !== 'false');
      setTipologiasVisible(sync['proyectos.tipologias.visible'] !== 'false');
    };
    window.addEventListener(SITE_CONTENT_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(SITE_CONTENT_UPDATED_EVENT, onUpdate);
  }, []);

  const toggleSection = async (key: string, current: boolean, setter: (v: boolean) => void) => {
    const next = !current;
    setter(next);
    await siteContentRepo.updateMany({ [key]: String(next) });
  };

  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const currentSession = getSession();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ConfigForm>({ resolver: zodResolver(configSchema) });

  const webhookValue = watch('leadNotificationWebhook');

  useEffect(() => {
    let cancelled = false;
    configRepo
      .get()
      .then((config) => {
        if (!cancelled) reset({ ...config, zonasCobertura: config.zonasCobertura.join('\n') });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const loadAdminUsers = () => {
    setLoadingUsers(true);
    adminUserRepo
      .list()
      .then((users) => setAdminUsers(users))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const onSubmit = async (data: ConfigForm) => {
    const zonas = data.zonasCobertura
      .split('\n')
      .map((z) => z.trim())
      .filter(Boolean);
    const updated = await configRepo.update({ ...data, zonasCobertura: zonas });
    invalidateHeroScrubCache();
    reset({ ...updated, zonasCobertura: updated.zonasCobertura.join('\n') });
    setSaved(true);
  };

  const handleTestWebhook = async () => {
    if (!webhookValue?.trim()) {
      setWebhookTestResult({ ok: false, message: 'Ingresá una URL de Webhook para probar.' });
      return;
    }
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await testWebhook(webhookValue.trim());
      if (res.ok) {
        setWebhookTestResult({
          ok: true,
          message: `Webhook verificado con éxito (Respuesta HTTP ${res.status ?? 200}).`,
        });
      } else {
        setWebhookTestResult({
          ok: false,
          message: res.error || `Error al contactar el webhook (${res.status}).`,
        });
      }
    } catch {
      setWebhookTestResult({ ok: false, message: 'Error de red al probar el webhook.' });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    setSavingUser(true);
    setUserError(null);
    setUserSuccess(null);
    try {
      await adminUserRepo.create({
        email: newUserEmail.trim(),
        fullName: newUserName.trim(),
      });
      setUserSuccess(`El usuario ${newUserEmail} fue autorizado exitosamente.`);
      setNewUserEmail('');
      setNewUserName('');
      loadAdminUsers();
      setTimeout(() => setUserSuccess(null), 4000);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : 'No se pudo agregar el usuario.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      await adminUserRepo.delete(userToDelete.id);
      setUserToDelete(null);
      loadAdminUsers();
    } catch (err) {
      setUserError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario.');
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <AdminShell
      title="Configuración"
      subtitle="Datos de contacto, usuarios administradores, notificaciones y comportamiento del sitio."
    >
      {showSkeleton ? (
        <ConfigSkeleton />
      ) : loading ? null : (
        <div className="max-w-3xl space-y-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
            <div
              role="tablist"
              aria-label="Secciones de configuración"
              className="flex flex-wrap border-b border-line"
            >
              {TABS.map(({ key, label, campos }) => {
                const conError = campos.some((c) => c in errors);
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium uppercase tracking-widest transition-colors duration-300 ${
                      tab === key
                        ? 'border-brand-900 text-ink dark:border-brand-500'
                        : 'border-transparent text-ink-soft hover:text-ink'
                    }`}
                  >
                    {label}
                    {conError && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                        title="Hay campos con errores en esta sección"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div hidden={tab !== 'portada'}>
              <SectionCard
                title="Portada del sitio"
                intro="Define cómo se presenta la home a los visitantes."
              >
                <Controller
                  control={control}
                  name="heroScrubEnabled"
                  render={({ field }) => (
                    <div className="flex items-start justify-between gap-6 border border-hairline bg-brand-50/50 p-5 dark:border-brand-700/40 dark:bg-brand-900/25">
                      <div>
                        <p className="text-sm font-medium text-ink">Tour en video disponible</p>
                        <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-ink-soft">
                          La portada siempre abre con el hero de imagen fija. Activado: además
                          aparece el control en el encabezado para que el visitante active el
                          tour —el vuelo de cámara que avanza cuadro a cuadro con el scroll—.
                          Desactivado: el control desaparece y el sitio queda solo con la imagen.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.value}
                        aria-label="Modo cinemático (scroll video)"
                        onClick={() => field.onChange(!field.value)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          field.value ? 'bg-brand-900 dark:bg-brand-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            field.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                />

                <div className="mt-8 pt-6 border-t border-line">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-ink mb-1">
                    Visibilidad de Secciones del Sitio
                  </h3>
                  <p className="text-xs font-light text-ink-soft mb-5">
                    Activá o desactivá bloques enteros del sitio según la etapa o requerimiento comercial.
                  </p>

                  <div className="space-y-4">
                    {/* Equipo */}
                    <div className="flex items-start justify-between gap-6 border border-hairline bg-paper-soft p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">Sección de Equipo ("Quiénes somos")</p>
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                              teamVisible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {teamVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                        <p className="mt-1 max-w-md text-xs font-light leading-relaxed text-ink-soft">
                          Grilla de integrantes ("Las personas detrás de cada proyecto") en la portada.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={teamVisible}
                        aria-label="Visibilidad de la sección de equipo"
                        onClick={() => void toggleSection('quienes.teamVisible', teamVisible, setTeamVisible)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          teamVisible ? 'bg-brand-900 dark:bg-brand-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            teamVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Servicios */}
                    <div className="flex items-start justify-between gap-6 border border-hairline bg-paper-soft p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">Sección de Servicios</p>
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                              serviciosVisible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {serviciosVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                        <p className="mt-1 max-w-md text-xs font-light leading-relaxed text-ink-soft">
                          Mazo interactivo de servicios y soluciones en la portada.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={serviciosVisible}
                        aria-label="Visibilidad de la sección de servicios"
                        onClick={() => void toggleSection('servicios.visible', serviciosVisible, setServiciosVisible)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          serviciosVisible ? 'bg-brand-900 dark:bg-brand-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            serviciosVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Proyectos Destacados */}
                    <div className="flex items-start justify-between gap-6 border border-hairline bg-paper-soft p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">Proyectos Destacados</p>
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                              featuredVisible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {featuredVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                        <p className="mt-1 max-w-md text-xs font-light leading-relaxed text-ink-soft">
                          Paneles expansivos con las obras y desarrollos más relevantes en la portada.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={featuredVisible}
                        aria-label="Visibilidad de proyectos destacados"
                        onClick={() => void toggleSection('featured.visible', featuredVisible, setFeaturedVisible)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          featuredVisible ? 'bg-brand-900 dark:bg-brand-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            featuredVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Inversiones */}
                    <div className="flex items-start justify-between gap-6 border border-hairline bg-paper-soft p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">Inversiones Abiertas</p>
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                              inversionesVisible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {inversionesVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                        <p className="mt-1 max-w-md text-xs font-light leading-relaxed text-ink-soft">
                          Tarjetas de oportunidades de inversión y fideicomisos en la portada.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={inversionesVisible}
                        aria-label="Visibilidad de inversiones abiertas"
                        onClick={() => void toggleSection('inversiones.visible', inversionesVisible, setInversionesVisible)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          inversionesVisible ? 'bg-brand-900 dark:bg-brand-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            inversionesVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Newsletter */}
                    <div className="flex items-start justify-between gap-6 border border-hairline bg-paper-soft p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">Newsletter de Inversores</p>
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                              newsletterVisible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {newsletterVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                        <p className="mt-1 max-w-md text-xs font-light leading-relaxed text-ink-soft">
                          Bloque de suscripción anticipada a oportunidades de inversión.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={newsletterVisible}
                        aria-label="Visibilidad del newsletter"
                        onClick={() => void toggleSection('newsletter.visible', newsletterVisible, setNewsletterVisible)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          newsletterVisible ? 'bg-brand-900 dark:bg-brand-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            newsletterVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* FAQ */}
                    <div className="flex items-start justify-between gap-6 border border-hairline bg-paper-soft p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">Preguntas Frecuentes (FAQ)</p>
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                              faqVisible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {faqVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                        <p className="mt-1 max-w-md text-xs font-light leading-relaxed text-ink-soft">
                          Acordeón de preguntas y respuestas en la página de Inversiones.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={faqVisible}
                        aria-label="Visibilidad de preguntas frecuentes"
                        onClick={() => void toggleSection('inversiones.faq.visible', faqVisible, setFaqVisible)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          faqVisible ? 'bg-brand-900 dark:bg-brand-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            faqVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Calculadora de Inversión */}
                    <div className="flex items-start justify-between gap-6 border border-hairline bg-paper-soft p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">Calculadora de Inversión y Cuotas</p>
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                              calculadoraVisible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {calculadoraVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                        <p className="mt-1 max-w-md text-xs font-light leading-relaxed text-ink-soft">
                          Simulador financiero interactivo con cálculo de anticipo, cuotas CAC/USD, m² y retorno proyectado.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={calculadoraVisible}
                        aria-label="Visibilidad de la calculadora de inversión"
                        onClick={() => void toggleSection('inversiones.calculadora.visible', calculadoraVisible, setCalculadoraVisible)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          calculadoraVisible ? 'bg-brand-900 dark:bg-brand-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            calculadoraVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Alianzas Institucionales */}
                    <div className="flex items-start justify-between gap-6 border border-hairline bg-paper-soft p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">Alianzas y Respaldo Institucional</p>
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                              alianzasVisible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {alianzasVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                        <p className="mt-1 max-w-md text-xs font-light leading-relaxed text-ink-soft">
                          Tira de escribanías, bancos fiduciarios y garantías fiduciarias de trayectoria en la portada.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={alianzasVisible}
                        aria-label="Visibilidad de alianzas y respaldo"
                        onClick={() => void toggleSection('home.alianzas.visible', alianzasVisible, setAlianzasVisible)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          alianzasVisible ? 'bg-brand-900 dark:bg-brand-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            alianzasVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Tipologías y Planos */}
                    <div className="flex items-start justify-between gap-6 border border-hairline bg-paper-soft p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">Visor de Tipologías y Planos</p>
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${
                              tipologiasVisible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {tipologiasVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                        <p className="mt-1 max-w-md text-xs font-light leading-relaxed text-ink-soft">
                          Pestañas de tipologías de departamentos y planos de planta arquitectónicos en las fichas de proyectos.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={tipologiasVisible}
                        aria-label="Visibilidad de tipologías y planos"
                        onClick={() => void toggleSection('proyectos.tipologias.visible', tipologiasVisible, setTipologiasVisible)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          tipologiasVisible ? 'bg-brand-900 dark:bg-brand-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            tipologiasVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div hidden={tab !== 'contacto'}>
              <SectionCard
                title="Datos de contacto y atención"
                intro="Se muestran en la sección de contacto, el pie institucional y el widget de WhatsApp."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cfg-email" className={LABEL_CLS}>
                      Email de contacto
                    </label>
                    <input
                      id="cfg-email"
                      type="email"
                      className={FIELD_CLS}
                      {...register('contactEmail')}
                    />
                    {errors.contactEmail && (
                      <p className={ERROR_CLS}>{errors.contactEmail.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="cfg-phone" className={LABEL_CLS}>
                      Teléfono
                    </label>
                    <input
                      id="cfg-phone"
                      type="text"
                      className={FIELD_CLS}
                      {...register('contactPhone')}
                    />
                    {errors.contactPhone && (
                      <p className={ERROR_CLS}>{errors.contactPhone.message}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="cfg-whatsapp" className={LABEL_CLS}>
                      WhatsApp (código de país + número, sin espacios ni +)
                    </label>
                    <input
                      id="cfg-whatsapp"
                      type="text"
                      placeholder="5491155550123"
                      className={FIELD_CLS}
                      {...register('whatsappNumber')}
                    />
                    {errors.whatsappNumber && (
                      <p className={ERROR_CLS}>{errors.whatsappNumber.message}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="cfg-address" className={LABEL_CLS}>
                      Dirección de oficinas
                    </label>
                    <input
                      id="cfg-address"
                      type="text"
                      className={FIELD_CLS}
                      {...register('address')}
                    />
                    {errors.address && <p className={ERROR_CLS}>{errors.address.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="cfg-lat" className={LABEL_CLS}>
                      Latitud (oficina)
                    </label>
                    <input
                      id="cfg-lat"
                      type="number"
                      step="any"
                      className={FIELD_CLS}
                      {...register('officeCoords.lat', { valueAsNumber: true })}
                    />
                    {errors.officeCoords?.lat && (
                      <p className={ERROR_CLS}>{errors.officeCoords.lat.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="cfg-lng" className={LABEL_CLS}>
                      Longitud (oficina)
                    </label>
                    <input
                      id="cfg-lng"
                      type="number"
                      step="any"
                      className={FIELD_CLS}
                      {...register('officeCoords.lng', { valueAsNumber: true })}
                    />
                    {errors.officeCoords?.lng && (
                      <p className={ERROR_CLS}>{errors.officeCoords.lng.message}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="cfg-horario" className={LABEL_CLS}>
                      Horario de atención
                    </label>
                    <input
                      id="cfg-horario"
                      type="text"
                      placeholder="Lunes a viernes de 9 a 18 h"
                      className={FIELD_CLS}
                      {...register('horarioAtencion')}
                    />
                    {errors.horarioAtencion && (
                      <p className={ERROR_CLS}>{errors.horarioAtencion.message}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="cfg-zonas" className={LABEL_CLS}>
                      Zonas de cobertura (una por línea)
                    </label>
                    <textarea
                      id="cfg-zonas"
                      rows={3}
                      className={`${FIELD_CLS} resize-y font-mono text-xs`}
                      {...register('zonasCobertura')}
                    />
                    {errors.zonasCobertura && (
                      <p className={ERROR_CLS}>{errors.zonasCobertura.message}</p>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div hidden={tab !== 'notificaciones'}>
              <SectionCard
                title="Notificaciones en tiempo real y Webhooks"
                intro="Conectá el sitio con Slack, Discord, Telegram o Zapier/Make para recibir alertas comerciales inmediatas cada vez que un cliente consulta."
              >
                <div className="space-y-6">
                  <div>
                    <label htmlFor="cfg-webhook" className={LABEL_CLS}>
                      URL de Webhook (POST JSON)
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        id="cfg-webhook"
                        type="url"
                        placeholder="https://hook.eu1.make.com/... o https://hooks.zapier.com/..."
                        className={`${FIELD_CLS} flex-1`}
                        {...register('leadNotificationWebhook')}
                      />
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={testingWebhook || !webhookValue?.trim()}
                        className="inline-flex items-center justify-center gap-2 border border-ink bg-ink px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper transition-colors hover:bg-ink-soft disabled:opacity-40"
                      >
                        {testingWebhook ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        <span>Probar webhook</span>
                      </button>
                    </div>
                    {webhookTestResult && (
                      <div
                        className={`mt-3 flex items-center gap-2 border px-3 py-2 text-xs font-light ${
                          webhookTestResult.ok
                            ? 'border-brand-500/40 bg-brand-50 text-brand-900 dark:bg-brand-950/40 dark:text-brand-300'
                            : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
                        }`}
                      >
                        {webhookTestResult.ok ? (
                          <Check size={14} className="text-brand-500" />
                        ) : (
                          <AlertCircle size={14} className="text-red-600" />
                        )}
                        <span>{webhookTestResult.message}</span>
                      </div>
                    )}
                    <p className="mt-2 text-xs font-light text-ink-soft">
                      Al recibir una consulta desde la web, enviaremos un payload JSON estructurado con
                      datos del cliente, consulta, origen y fecha.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="cfg-notif-email" className={LABEL_CLS}>
                      Email adicional de alerta comercial (Opcional)
                    </label>
                    <input
                      id="cfg-notif-email"
                      type="email"
                      placeholder="comercial@puntocero.com"
                      className={FIELD_CLS}
                      {...register('leadNotificationEmail')}
                    />
                  </div>

                  <div className="border border-hairline bg-paper-soft p-4 text-xs font-light leading-relaxed text-ink-soft">
                    <div className="flex items-center gap-2 font-medium text-ink">
                      <Sparkles size={15} className="text-brand-500" />
                      <span>Cómo integrar en 2 minutos:</span>
                    </div>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>
                        <strong>Slack / Discord:</strong> Crear un Webhook entrante en el canal
                        comercial y pegar la URL arriba.
                      </li>
                      <li>
                        <strong>Telegram:</strong> Usar un bot de Telegram con un webhook en Make /
                        Zapier.
                      </li>
                      <li>
                        <strong>CRM / Google Sheets:</strong> Usar un trigger &quot;Catch
                        Hook&quot; de Zapier o Make para enviar el lead a tu planilla de
                        seguimiento.
                      </li>
                    </ul>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div hidden={tab !== 'usuarios'}>
              <SectionCard
                title="Equipo y Permisos de Acceso al Panel"
                intro="Administrá quiénes tienen acceso al panel de administración de Punto Cero. Los emails autorizados aquí podrán iniciar sesión con sus credenciales de Supabase."
              >
                <div className="space-y-8">
                  <div className="border border-hairline bg-paper-soft p-5">
                    <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink">
                      <UserPlus size={16} className="text-brand-500" />
                      <span>Autorizar nuevo administrador</span>
                    </h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="new-user-email" className={LABEL_CLS}>
                          Email del integrante
                        </label>
                        <input
                          id="new-user-email"
                          type="email"
                          placeholder="nombre@puntocero.com"
                          value={newUserEmail}
                          onChange={(e) => {
                            setNewUserEmail(e.target.value);
                            setUserError(null);
                          }}
                          className={FIELD_CLS}
                        />
                      </div>
                      <div>
                        <label htmlFor="new-user-name" className={LABEL_CLS}>
                          Nombre completo
                        </label>
                        <input
                          id="new-user-name"
                          type="text"
                          placeholder="Juan Pérez"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className={FIELD_CLS}
                        />
                      </div>
                    </div>

                    {userError && (
                      <div className="mt-3 flex items-center gap-2 border border-red-200 bg-red-50 p-2 text-xs font-light text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                        <AlertCircle size={14} />
                        <span>{userError}</span>
                      </div>
                    )}
                    {userSuccess && (
                      <div className="mt-3 flex items-center gap-2 border border-brand-500/40 bg-brand-50 p-2 text-xs font-light text-brand-900 dark:bg-brand-950/30 dark:text-brand-200">
                        <Check size={14} className="text-brand-500" />
                        <span>{userSuccess}</span>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddUser}
                        disabled={savingUser || !newUserEmail.trim()}
                        className="inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2 text-xs font-medium uppercase tracking-widest text-paper transition-colors hover:bg-ink-soft disabled:opacity-40"
                      >
                        {savingUser ? <Loader2 size={14} className="animate-spin" /> : null}
                        <span>Autorizar acceso</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-ink-soft">
                      Administradores autorizados ({adminUsers.length})
                    </h3>

                    {loadingUsers ? (
                      <div className="space-y-2">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                      </div>
                    ) : adminUsers.length === 0 ? (
                      <p className="text-xs font-light text-ink-soft">
                        No hay administradores registrados en la lista.
                      </p>
                    ) : (
                      <div className="divide-y divide-line border border-line bg-paper">
                        {adminUsers.map((user) => {
                          const isSelf =
                            currentSession?.email &&
                            user.email.toLowerCase() === currentSession.email.toLowerCase();

                          return (
                            <div
                              key={user.id || user.email}
                              className="flex items-center justify-between p-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center bg-brand-100 text-xs font-medium uppercase text-brand-900 dark:bg-brand-900/60 dark:text-brand-300">
                                  {user.fullName ? user.fullName[0] : user.email[0]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-ink">
                                      {user.fullName || user.email.split('@')[0]}
                                    </span>
                                    {isSelf && (
                                      <span className="border border-brand-500/40 bg-brand-50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-brand-900 dark:bg-brand-900/40 dark:text-brand-300">
                                        Tu cuenta
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-light text-ink-soft">{user.email}</p>
                                </div>
                              </div>

                              <div>
                                {isSelf ? (
                                  <span
                                    title="No podés eliminar tu propia cuenta mientras estás logueado"
                                    className="p-2 text-ink-soft/40 cursor-not-allowed"
                                  >
                                    <Shield size={16} />
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setUserToDelete(user)}
                                    title="Revocar acceso de administrador"
                                    className="p-2 text-ink-soft transition-colors hover:text-red-600"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 border border-hairline bg-brand-50/50 p-4 text-xs font-light text-brand-900 dark:border-brand-700/40 dark:bg-brand-900/20 dark:text-brand-100">
                    <Info size={16} className="shrink-0 text-brand-500" />
                    <span>
                      <strong>Nota de seguridad:</strong> El acceso al panel está protegido por la
                      allowlist de administradores. Quien figure en esta lista podrá iniciar sesión en
                      el panel una vez que cree su contraseña en Supabase Auth.
                    </span>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div hidden={tab !== 'metricas'}>
              <SectionCard
                title="Métricas institucionales"
                intro="Cifras clave que se destacan en la portada y la sección Quiénes somos."
              >
                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label htmlFor="cfg-years" className={LABEL_CLS}>
                      Años de trayectoria
                    </label>
                    <input
                      id="cfg-years"
                      type="number"
                      min={0}
                      className={FIELD_CLS}
                      {...register('metrics.years', { valueAsNumber: true })}
                    />
                    {errors.metrics?.years && (
                      <p className={ERROR_CLS}>{errors.metrics.years.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="cfg-m2" className={LABEL_CLS}>
                      m² desarrollados / construidos
                    </label>
                    <input
                      id="cfg-m2"
                      type="number"
                      min={0}
                      className={FIELD_CLS}
                      {...register('metrics.m2', { valueAsNumber: true })}
                    />
                    {errors.metrics?.m2 && <p className={ERROR_CLS}>{errors.metrics.m2.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="cfg-projects" className={LABEL_CLS}>
                      Proyectos entregados / en curso
                    </label>
                    <input
                      id="cfg-projects"
                      type="number"
                      min={0}
                      className={FIELD_CLS}
                      {...register('metrics.projects', { valueAsNumber: true })}
                    />
                    {errors.metrics?.projects && (
                      <p className={ERROR_CLS}>{errors.metrics.projects.message}</p>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div hidden={tab !== 'societarios'}>
              <SectionCard
                title="Datos societarios y legales"
                intro="Razón social, CUIT y matrícula que respaldan la operación institucional en el pie de página."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cfg-legal" className={LABEL_CLS}>
                      Razón social
                    </label>
                    <input id="cfg-legal" type="text" className={FIELD_CLS} {...register('legalName')} />
                    {errors.legalName && <p className={ERROR_CLS}>{errors.legalName.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="cfg-cuit" className={LABEL_CLS}>
                      CUIT (XX-XXXXXXXX-X)
                    </label>
                    <input
                      id="cfg-cuit"
                      type="text"
                      placeholder="30-71234567-8"
                      className={FIELD_CLS}
                      {...register('cuit')}
                    />
                    {errors.cuit && <p className={ERROR_CLS}>{errors.cuit.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="cfg-matricula" className={LABEL_CLS}>
                      Matrícula
                    </label>
                    <input
                      id="cfg-matricula"
                      type="text"
                      className={FIELD_CLS}
                      {...register('matricula')}
                    />
                    {errors.matricula && <p className={ERROR_CLS}>{errors.matricula.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="cfg-domicilio" className={LABEL_CLS}>
                      Domicilio legal
                    </label>
                    <input
                      id="cfg-domicilio"
                      type="text"
                      className={FIELD_CLS}
                      {...register('domicilioLegal')}
                    />
                    {errors.domicilioLegal && (
                      <p className={ERROR_CLS}>{errors.domicilioLegal.message}</p>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div hidden={tab !== 'legales'}>
              <SectionCard
                title="Avisos legales"
                intro="Textos obligatorios del pie. Modificarlos tiene efecto legal: revisarlos con asesoramiento antes de guardar."
              >
                <div className="space-y-5">
                  <div>
                    <label htmlFor="cfg-oferta" className={LABEL_CLS}>
                      Oferta pública (Ley 26.831 — CNV)
                    </label>
                    <textarea
                      id="cfg-oferta"
                      rows={3}
                      className={`${FIELD_CLS} resize-y`}
                      {...register('disclaimers.ofertaPublica')}
                    />
                    {errors.disclaimers?.ofertaPublica && (
                      <p className={ERROR_CLS}>{errors.disclaimers.ofertaPublica.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="cfg-datos" className={LABEL_CLS}>
                      Datos personales (Ley 25.326)
                    </label>
                    <textarea
                      id="cfg-datos"
                      rows={3}
                      className={`${FIELD_CLS} resize-y`}
                      {...register('disclaimers.datosPersonales')}
                    />
                    {errors.disclaimers?.datosPersonales && (
                      <p className={ERROR_CLS}>{errors.disclaimers.datosPersonales.message}</p>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              <span
                role="status"
                aria-live="polite"
                className={`inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-brand-700 dark:text-brand-300 transition-opacity duration-500 ${
                  saved ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Check size={14} strokeWidth={2} aria-hidden />
                Cambios guardados
              </span>
            </div>
          </form>

          <ConfirmDialog
            open={userToDelete !== null}
            title="Revocar acceso de administrador"
            message={`¿Estás seguro de que querés revocar el acceso a "${userToDelete?.email}"? El usuario no podrá ingresar más al panel de administración.`}
            confirmLabel="Revocar acceso"
            busy={deletingUser}
            onConfirm={handleDeleteUser}
            onCancel={() => setUserToDelete(null)}
          />
        </div>
      )}
    </AdminShell>
  );
}
