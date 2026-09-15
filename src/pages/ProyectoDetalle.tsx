// Detalle de proyecto (PROY-04/05): hero parallax, specs, descripción,
// galería con lightbox, timeline de etapas, mapa, documentos y CTA.

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Edit3, ExternalLink } from 'lucide-react';
import { projectRepo, type Project } from '../data';
import { usePageMeta } from '../lib/usePageMeta';
import { useLiveCMS } from '../lib/LiveCMSContext';
import { gsapReveal } from '../lib/gsapReveal';
import { useParallax } from '../lib/useParallax';
import { useMinVisible } from '../components/ui/Skeleton';
import Container from '../components/ui/Container';
import SectionHeading from '../components/ui/SectionHeading';
import Button from '../components/ui/Button';
import NotFound from './NotFound';
import DetalleHero from '../components/proyectos/detalle/DetalleHero';
import SpecsStrip from '../components/proyectos/detalle/SpecsStrip';
import GaleriaProyecto from '../components/proyectos/detalle/GaleriaProyecto';
import TimelineEtapas from '../components/proyectos/detalle/TimelineEtapas';
import MapaUbicacion from '../components/proyectos/detalle/MapaUbicacion';
import DocumentosProyecto from '../components/proyectos/detalle/DocumentosProyecto';
import TipologiasVisor from '../components/proyectos/detalle/TipologiasVisor';
import DetalleSkeleton from '../components/proyectos/detalle/DetalleSkeleton';
import Breadcrumbs from '../components/ui/Breadcrumbs';

function Descripcion({ project }: { project: Project }) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return gsapReveal(bodyRef.current);
  }, []);

  return (
    <section className="bg-paper py-20 md:py-28 lg:py-32">
      <Container>
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Inicio', to: '/' },
              { label: 'Proyectos', to: '/proyectos' },
              { label: project.name },
            ]}
          />
        </div>
        <div ref={bodyRef} className="max-w-3xl">
          <SectionHeading kicker="El proyecto" title={project.name} className="mb-12 md:mb-16" />
          <p className="text-lg font-light leading-relaxed text-ink-soft">
            {project.description}
          </p>
        </div>
      </Container>
    </section>
  );
}

function CtaFinal({
  projectName,
  coverImage,
}: {
  projectName: string;
  coverImage: string;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useParallax<HTMLDivElement>({ amount: 16, triggerRef: sectionRef });

  useEffect(() => {
    return gsapReveal(innerRef.current);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-brand-900 py-20 text-white md:py-28 lg:py-32"
    >
      {/* La portada del propio proyecto de fondo: el cierre estaba en verde
          plano justo después de una página llena de fotografía, y se leía como
          si el contenido se hubiera terminado antes de tiempo. Velo negro —no
          verde— para que la foto se vea sin teñirse. */}
      <div
        ref={photoRef}
        aria-hidden
        className="absolute -inset-y-[12%] inset-x-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${coverImage})` }}
      />
      <div aria-hidden className="absolute inset-0 bg-black/70" />
      <div aria-hidden className="absolute inset-0 bg-brand-900/30" />
      <Container className="relative z-10">
        <div ref={innerRef} className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-brand-300 md:text-sm">
            Contacto
          </p>
          <h2 className="text-3xl font-light uppercase tracking-wide md:text-4xl lg:text-5xl">
            ¿Le interesa {projectName}?
          </h2>
          <p className="mt-6 text-lg font-light leading-relaxed text-white/80">
            Nuestro equipo puede acercarle información comercial, planos y
            disponibilidad actualizada del proyecto.
          </p>
          <div className="mt-10">
            <Button to="/contacto">Contactarnos</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default function ProyectoDetalle() {
  const { slug } = useParams<{ slug: string }>();
  // El resultado guarda JUNTO el slug que lo produjo. Así, al navegar de un
  // proyecto a otro, "todavía no cargué este slug" se DERIVA de comparar —no
  // hace falta resetear el estado al principio del efecto, que era un setState
  // síncrono dentro del efecto (react-hooks/set-state-in-effect) y además
  // dejaba pintado un frame con los datos del proyecto anterior.
  const [result, setResult] = useState<{ slug: string; project: Project | null } | null>(null);

  const currentSlug = slug ?? '';
  const loading = result?.slug !== currentSlug;
  const project = loading ? null : result.project;
  const notFound = !loading && result.project === null;

  useEffect(() => {
    let alive = true;
    projectRepo
      .getBySlug(currentSlug)
      .then((p) => {
        if (alive) setResult({ slug: currentSlug, project: p });
      })
      .catch(() => {
        if (alive) setResult({ slug: currentSlug, project: null });
      });
    return () => {
      alive = false;
    };
  }, [currentSlug]);

  usePageMeta({
    title: project?.name ?? 'Proyecto',
    description: project?.description,
    ogImage: project?.coverImage,
  });

  const showSkeleton = useMinVisible(loading);

  const { isEditMode } = useLiveCMS();

  if (notFound) return <NotFound />;
  if (showSkeleton) return <DetalleSkeleton />;
  if (loading || !project) return null;

  return (
    <main className="relative">
      {isEditMode && (
        <div className="sticky top-20 z-40 bg-brand-900/90 text-white backdrop-blur border-b border-white/20 px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Modo Edición activo: <strong>{project.name}</strong>
            </span>
          </div>
          <Link
            to="/admin/proyectos"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded font-medium uppercase tracking-wider text-xs transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar en Panel</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      )}
      <DetalleHero project={project} />
      <SpecsStrip specs={project.specs} />
      <Descripcion project={project} />
      <TipologiasVisor project={project} />
      <GaleriaProyecto
        name={project.name}
        gallery={project.gallery}
        isRender={project.isRender}
      />
      <TimelineEtapas timeline={project.timeline} />
      <MapaUbicacion
        name={project.name}
        location={project.location}
        coords={project.coords}
      />
      <DocumentosProyecto docs={project.docs} />
      <CtaFinal projectName={project.name} coverImage={project.coverImage} />
    </main>
  );
}
