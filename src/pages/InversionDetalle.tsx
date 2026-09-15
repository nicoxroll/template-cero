// Detalle de oportunidad — INV-02 (datos completos, documentos, proyecto vinculado)
// e INV-03 (disclaimer junto a toda cifra de retorno). Datos vía repos.

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Edit3, ExternalLink, FileText, MapPin } from 'lucide-react';
import {
  INVESTMENT_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  investmentRepo,
  projectRepo,
  type Investment,
  type Project,
} from '../data';
import { usePageMeta } from '../lib/usePageMeta';
import { useLiveCMS } from '../lib/LiveCMSContext';
import { trackEvent } from '../lib/analytics';
import { gsapReveal } from '../lib/gsapReveal';
import Container from '../components/ui/Container';
import { IMAGERY } from '../lib/siteImagery';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ShareButton from '../components/ui/ShareButton';
import { Skeleton, SkeletonText, useMinVisible, Photo } from '../components/ui/Skeleton';
import ReturnDisclaimer from '../components/inversiones/ReturnDisclaimer';
import { formatAmount } from '../components/inversiones/InvestmentCard';
import EstructuraInversion, {
  EstructuraInversionSkeleton,
} from '../components/inversiones/EstructuraInversion';
import CalculadoraInversion from '../components/inversiones/CalculadoraInversion';

function DetailSkeleton() {
  return (
    <>
      {/* Mismo alto que el hero real: si el skeleton midiera menos, el contenido
          saltaría hacia abajo al llegar los datos. */}
      <Skeleton className="h-screen w-full" />
      <Container>
        <div className="mt-16 grid gap-12 md:mt-20 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SkeletonText lines={4} />
          </div>
          <div className="space-y-3 border border-line p-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-4 h-12 w-full" />
          </div>
        </div>
      </Container>
      <div className="mt-20 md:mt-28">
        <EstructuraInversionSkeleton />
      </div>
    </>
  );
}

export default function InversionDetalle() {
  const { slug } = useParams<{ slug: string }>();
  // Igual que ProyectoDetalle: el resultado viaja JUNTO al slug que lo produjo,
  // así "todavía no cargué este slug" se deriva de comparar. Evita el reset al
  // principio del efecto (setState síncrono dentro del efecto) y el frame que
  // mostraba los datos de la oportunidad anterior al navegar entre dos.
  const [result, setResult] = useState<{
    slug: string;
    investment: Investment | null;
    project: Project | null;
  } | null>(null);

  const currentSlug = slug ?? '';
  const loading = result?.slug !== currentSlug;
  const investment = loading ? undefined : result.investment;
  const project = loading ? null : result.project;
  const showSkeleton = useMinVisible(loading);
  const contentRef = useRef<HTMLDivElement>(null);
  const { isEditMode } = useLiveCMS();

  usePageMeta({
    title: investment ? investment.title : 'Oportunidad de inversión',
    description: investment?.description,
    ogImage: investment?.coverImage,
  });

  useEffect(() => {
    if (!currentSlug) return;
    let cancelled = false;
    void (async () => {
      const inv = await investmentRepo.getBySlug(currentSlug).catch(() => null);
      if (cancelled) return;
      // El proyecto vinculado se resuelve ANTES de publicar el resultado: así
      // la página aparece completa de una vez, sin un segundo repintado que
      // haga saltar el bloque del proyecto.
      let proj: Project | null = null;
      if (inv) {
        trackEvent('investment_view', { slug: inv.slug });
        if (inv.projectSlug) {
          proj = await projectRepo.getBySlug(inv.projectSlug).catch(() => null);
        }
      }
      if (!cancelled) setResult({ slug: currentSlug, investment: inv, project: proj });
    })();
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  useEffect(() => {
    if (!investment || !contentRef.current) return;
    return gsapReveal(contentRef.current);
  }, [investment]);

  if (showSkeleton) {
    return (
      <main className="pb-20 md:pb-28">
        <DetailSkeleton />
      </main>
    );
  }

  // Se comprueba `!result` y no `loading`: son equivalentes en runtime, pero
  // TypeScript no puede correlacionar un booleano derivado con el estado que lo
  // origina, y sin esto `investment` no se estrecha más abajo.
  if (!result || result.slug !== currentSlug) {
    return <main className="pt-24 pb-20 md:pt-32 md:pb-28" />;
  }

  if (investment === null || investment === undefined) {
    return (
      <main className="pt-24 pb-20 md:pt-32 md:pb-28">
        <Container>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-brand-500 md:text-sm">
            Inversiones
          </p>
          <h1 className="text-3xl font-light uppercase tracking-wide text-ink md:text-4xl">
            Oportunidad no encontrada
          </h1>
          <p className="mt-6 max-w-2xl text-base font-light leading-relaxed text-ink-soft">
            La oportunidad que busca no existe o ya no está publicada. Puede ver las
            oportunidades vigentes en la sección de inversiones.
          </p>
          <div className="mt-10">
            <Button variant="outline" to="/inversiones">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver a inversiones
            </Button>
          </div>
        </Container>
      </main>
    );
  }

  const { title, description, amount, currency, estReturn, termMonths, status, coverImage, docs } =
    investment;

  return (
    <main className="pb-0 relative">
      {isEditMode && (
        <div className="sticky top-20 z-40 bg-brand-900/90 text-white backdrop-blur border-b border-white/20 px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Modo Edición activo: <strong>{title}</strong>
            </span>
          </div>
          <Link
            to="/admin/inversiones"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded font-medium uppercase tracking-wider text-xs transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar en Panel</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      )}
      <div ref={contentRef}>
        {/* Hero a pantalla completa, como el detalle de proyecto. Antes la
            portada era una franja de 40vh DENTRO del Container, con el título
            recién debajo: la oportunidad se presentaba con una foto del tamaño
            de una postal y el nombre en texto oscuro sobre fondo claro. Acá la
            foto ocupa la pantalla y el título va encima, que es el idioma del
            resto del sitio. */}
        <section
          aria-label={title}
          className="relative flex h-screen w-full items-end overflow-hidden bg-ink-fixed"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${coverImage})` }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/85"
          />

          <Container className="relative z-10 pb-16 md:pb-24">
            <div className="flex items-center justify-between gap-4">
              <Link
                to="/inversiones"
                className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/70 transition-colors duration-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Volver a inversiones
              </Link>
              <ShareButton
                title={title}
                text={`${title} — Oportunidad de inversión en Punto Cero`}
                dark
              />
            </div>
            <p className="mb-4 mt-8 text-xs font-medium uppercase tracking-[0.3em] text-brand-300 md:text-sm">
              Oportunidad de inversión · {INVESTMENT_STATUS_LABELS[status]}
            </p>
            <h1 className="hero-legible max-w-4xl text-4xl font-light uppercase tracking-wide text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {title}
            </h1>
          </Container>
        </section>

        <Container>
          <div className="mt-12 mb-6">
            <Breadcrumbs
              items={[
                { label: 'Inicio', to: '/' },
                { label: 'Inversiones', to: '/inversiones' },
                { label: title },
              ]}
            />
          </div>
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Columna principal */}
            <div className="lg:col-span-2">
              <p className="text-lg font-light leading-relaxed text-ink-soft">
                {description}
              </p>

              {docs.length > 0 && (
                <div className="mt-14">
                  <h2 className="text-xl font-light tracking-wide text-ink md:text-2xl">
                    Documentación
                  </h2>
                  <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
                    {docs.map((doc) => (
                      <li key={doc.url}>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 py-4 text-base font-light text-ink transition-colors duration-300 hover:text-brand-700 dark:hover:text-brand-300"
                        >
                          <FileText className="h-5 w-5 shrink-0 text-brand-500" aria-hidden />
                          {doc.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project && (
                <div className="mt-14">
                  <h2 className="text-xl font-light tracking-wide text-ink md:text-2xl">
                    Proyecto vinculado
                  </h2>
                  <Link to={`/proyectos/${project.slug}`} className="mt-6 block max-w-xl">
                    <Card interactive className="flex flex-col sm:flex-row">
                      <div className="aspect-[4/3] overflow-hidden sm:w-56 sm:shrink-0">
                        <Photo
                          src={project.coverImage}
                          alt={project.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="text-xl font-light tracking-wide text-ink">
                          {project.name}
                        </h3>
                        <p className="mt-2 flex items-center gap-2 text-sm font-light text-ink-soft">
                          <MapPin className="h-4 w-4 shrink-0 text-brand-500" aria-hidden />
                          {project.location} · {PROJECT_STATUS_LABELS[project.status]}
                        </p>
                        <span className="mt-auto flex items-center gap-2 pt-4 text-sm font-medium uppercase tracking-widest text-brand-500 transition-colors duration-300 group-hover:text-brand-900 dark:group-hover:text-brand-100">
                          Ver proyecto
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </span>
                      </div>
                    </Card>
                  </Link>
                </div>
              )}
            </div>

            {/* Ficha lateral */}
            <aside className="h-fit border border-line bg-paper-soft p-8 lg:sticky lg:top-28">
              <h2 className="text-xs font-medium uppercase tracking-widest text-ink-soft">
                Ficha de la inversión
              </h2>
              <dl className="mt-6 space-y-5">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-widest text-ink-soft">
                    Inversión mínima
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {formatAmount(amount, currency)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-widest text-ink-soft">
                    Retorno estimado *
                  </dt>
                  <dd className="text-right text-lg font-medium text-brand-700 dark:text-brand-300">{estReturn}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-widest text-ink-soft">
                    Plazo
                  </dt>
                  <dd className="text-lg font-medium text-ink">{termMonths} meses</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-widest text-ink-soft">
                    Estado
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {INVESTMENT_STATUS_LABELS[status]}
                  </dd>
                </div>
              </dl>
              <ReturnDisclaimer className="mt-6 border-t border-hairline pt-6" />
              <div className="mt-8">
                <Button to="/contacto" className="w-full">
                  Quiero más información
                </Button>
              </div>
              <p className="mt-4 text-center text-xs font-light text-ink-soft">
                Coordinamos una reunión sin compromiso para presentarle el proyecto en detalle.
              </p>
            </aside>
          </div>
        </Container>

        <div className="mt-20 md:mt-28">
          <EstructuraInversion investment={investment} />
        </div>

        {/* Simulador financiero personalizado para esta oportunidad */}
        <CalculadoraInversion
          className="mt-20 md:mt-28"
          initialProjectName={investment.title}
          initialTicketMinimo={investment.ticketMinimo}
          initialPlazoMeses={investment.termMonths}
        />

        {/* Pasos del Inversor (Landing Section) */}
        <section className="mt-20 border-t border-hairline pt-20 md:mt-28 md:pt-28">
          <Container>
            <div className="mb-12 text-center md:mb-16">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-brand-500">
                Proceso transparente
              </p>
              <h2 className="text-2xl font-light uppercase tracking-wide text-ink md:text-3xl lg:text-4xl">
                ¿Cómo funciona la inversión?
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: '01', title: 'Elección de Oportunidad', text: 'Analice métricas de retorno, plazo y proyecto vinculado con el equipo.' },
                { step: '02', title: 'Firma de Fideicomiso', text: 'Estructuración jurídica transparente con protección total para el inversor.' },
                { step: '03', title: 'Seguimiento de Obra', text: 'Reportes periódicos y certificados de avance de obra en tiempo real.' },
                { step: '04', title: 'Retorno de Capital', text: 'Cobro de rendimientos proyectados al finalizar la etapa acordada.' },
              ].map((item) => (
                <div key={item.step} className="border border-hairline bg-paper p-6 transition-all duration-300 hover:border-brand-500/50">
                  <span className="text-3xl font-light text-brand-500">{item.step}</span>
                  <h3 className="mt-4 text-lg font-light tracking-wide text-ink">{item.title}</h3>
                  <p className="mt-2 text-xs font-light leading-relaxed text-ink-soft">{item.text}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA final con imagen de fondo y superposición */}
        <section
          className="relative mt-20 overflow-hidden bg-brand-900 py-24 text-white md:mt-28 md:py-32"
        >
          {/* Imagen de fondo de arquitectura */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
            style={{ backgroundImage: `url(${coverImage || IMAGERY.wide})` }}
            aria-hidden="true"
          />
          {/* Superposición degradada verde/oscura para contraste y legibilidad absoluta */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/85 to-brand-900/90 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <Container className="relative z-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-brand-300 md:text-sm">
                Próximo paso
              </p>
              <h2 className="text-3xl font-light uppercase tracking-wide text-white md:text-4xl lg:text-5xl">
                Conversemos sobre esta oportunidad
              </h2>
              <p className="mt-5 text-base font-light leading-relaxed text-white/90 md:text-lg">
                Nuestro equipo le presenta la documentación completa, el cronograma de obra y el
                esquema de participación, con total transparencia.
              </p>
              <div className="mt-10">
                <Button to="/contacto">Contactar al equipo</Button>
              </div>
            </div>
          </Container>
        </section>
      </div>
    </main>
  );
}
