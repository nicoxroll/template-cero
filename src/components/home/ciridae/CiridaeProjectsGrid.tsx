// Proyectos destacados (DESIGN-CIRIDAE.md § System Card): fotografía real del
// catálogo (projectRepo) a sangre horizontal dentro de SystemCard (py-8/px-0
// de la primitiva ya alinea el contenido al borde — ver CiridaePrimitives).

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { PROJECT_STATUS_LABELS, projectRepo, type Project } from '../../../data';
import { gsapReveal, REVEAL } from '../../../lib/gsapReveal';
import { PillBadge, SectionHeading, SystemCard } from './CiridaePrimitives';
import { Skeleton } from '../../ui/Skeleton';

function ProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-cir-card bg-cir-charcoal py-8">
          <Skeleton className="aspect-[4/3] w-full bg-cir-white/10 before:via-cir-white/20" />
          <div className="space-y-3 px-8 pt-6">
            <Skeleton className="h-5 w-3/4 bg-cir-white/10 before:via-cir-white/20" />
            <Skeleton className="h-3 w-1/2 bg-cir-white/10 before:via-cir-white/20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CiridaeProjectsGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    projectRepo
      .listFeatured()
      .then((list) => {
        if (alive) setProjects(list);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loading || !gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('.cir-project-card');
    if (!cards.length) return;
    return gsapReveal(Array.from(cards), { stagger: REVEAL.stagger });
  }, [loading, projects]);

  return (
    <section id="proyectos" className="bg-cir-void py-10 sm:py-[60px]">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <SectionHeading eyebrow="Catálogo" title="Proyectos destacados" />
        {loading ? (
          <ProjectsSkeleton />
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.slug} to={`/proyectos/${p.slug}`} className="cir-project-card group block">
                <SystemCard className="transition-colors duration-300 group-hover:bg-cir-charcoal/80">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={p.coverImage}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-col items-start gap-3 px-8 pt-6">
                    <PillBadge>{PROJECT_STATUS_LABELS[p.status]}</PillBadge>
                    <h3 className="font-cir-cond text-cir-h uppercase tracking-[-0.02em] text-cir-white">
                      {p.name}
                    </h3>
                    <p className="font-cir-cond text-cir-body uppercase tracking-[-0.02em] text-cir-white/50">
                      {p.location}
                    </p>
                  </div>
                </SystemCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
