// Franja de specs del proyecto (PROY-04): datos clave en banda horizontal.

import { useEffect, useRef } from 'react';
import { gsapReveal } from '../../../lib/gsapReveal';
import Container from '../../ui/Container';
import type { ProjectSpec } from '../../../data';

export default function SpecsStrip({ specs }: { specs: ProjectSpec[] }) {
  const listRef = useRef<HTMLDListElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    return gsapReveal(Array.from(listRef.current.children), { stagger: 0.12 });
  }, []);

  if (specs.length === 0) return null;

  return (
    <section className="border-b border-hairline bg-paper-soft">
      <Container>
        <dl
          ref={listRef}
          className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-3 md:py-16 lg:grid-cols-5"
        >
          {specs.map((spec) => (
            <div key={spec.label}>
              <dt className="text-xs font-medium uppercase tracking-widest text-ink-soft">
                {spec.label}
              </dt>
              <dd className="mt-2 text-xl font-light tracking-wide text-ink md:text-2xl">
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
