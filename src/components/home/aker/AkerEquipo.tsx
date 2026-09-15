// "Nuestro equipo" — overline + heading + grilla de fotos reales del equipo
// (teamRepo, DESIGN.md § Datos — nunca fixtures directo). id="equipo" para
// el link del bento del hero ("Nuestro equipo" → /#equipo).

import { useEffect, useRef, useState } from 'react';
import { siteContentRepo, teamRepo, type TeamMember } from '../../../data';
import { Skeleton, useMinVisible } from '../../ui/Skeleton';
import { gsapReveal } from '../../../lib/gsapReveal';
import { AkerContainer, AkerHeading, AkerOverline } from './AkerPrimitives';

function EquipoSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[3/4] rounded-aker-card" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function AkerEquipo() {
  const isVisible = siteContentRepo.getSync()['quienes.teamVisible'] === 'true';
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const loading = team === null;
  const showSkeleton = useMinVisible(loading);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    teamRepo
      .list()
      .then((items) => {
        if (alive) setTeam(items);
      })
      .catch(() => {
        if (alive) setTeam([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loading || !ref.current) return;
    return gsapReveal(Array.from(ref.current.children), { stagger: 0.1, y: 20 });
  }, [loading]);

  if (!isVisible) return null;

  return (
    <section id="equipo" className="bg-aker-paper py-20">
      <AkerContainer>
        <div className="mb-12 md:mb-16">
          <AkerOverline className="mb-3">Nuestro equipo</AkerOverline>
          <AkerHeading>Un equipo, todas las etapas</AkerHeading>
        </div>

        {showSkeleton ? (
          <EquipoSkeleton />
        ) : loading ? null : (
          <div ref={ref} className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {team.map((member) => (
              <div key={member.id} className="group">
                <div className="aspect-[3/4] overflow-hidden rounded-aker-card bg-aker-mist">
                  <img
                    src={member.photo}
                    alt={member.name}
                    loading="lazy"
                    className="aker-photo h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-4 text-[15px] font-normal text-aker-ink">{member.name}</p>
                <p className="mt-1 text-[12px] leading-snug text-aker-smoke">{member.role}</p>
              </div>
            ))}
          </div>
        )}
      </AkerContainer>
    </section>
  );
}
