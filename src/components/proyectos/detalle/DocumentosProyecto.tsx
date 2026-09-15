// Documentos descargables del proyecto (PROY-04).

import { useEffect, useRef } from 'react';
import { BookOpen, Download, File, FileSpreadsheet, Ruler, ScrollText, Signature } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { gsapReveal } from '../../../lib/gsapReveal';
import Container from '../../ui/Container';
import SectionHeading from '../../ui/SectionHeading';
import { DOCUMENT_KIND_LABELS, type DocumentKind, type DocumentRef } from '../../../data';

const KIND_LABEL = DOCUMENT_KIND_LABELS;

const KIND_ICON: Record<DocumentKind, LucideIcon> = {
  brochure: BookOpen,
  planos: Ruler,
  'term-sheet': FileSpreadsheet,
  contrato: Signature,
  memorando: ScrollText,
  otro: File,
};

export default function DocumentosProyecto({ docs }: { docs: DocumentRef[] }) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    return gsapReveal(Array.from(listRef.current.children), { stagger: 0.12 });
  }, []);

  if (docs.length === 0) return null;

  return (
    <section className="bg-paper-soft py-20 md:py-28 lg:py-32">
      <Container>
        <SectionHeading
          kicker="Documentación"
          title="Material descargable"
          className="mb-12 md:mb-16"
        />
        <ul ref={listRef} className="max-w-3xl divide-y divide-hairline border-y border-hairline">
          {docs.map((doc) => {
            const Icon = KIND_ICON[doc.kind];
            return (
              <li key={doc.name}>
                <a
                  href={doc.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 py-5 transition-colors duration-300 hover:bg-brand-50 dark:hover:bg-brand-900/30"
                >
                  <Icon
                    className="h-5 w-5 shrink-0 text-brand-500 transition-transform duration-300 group-hover:scale-110"
                    strokeWidth={1.5}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-base font-light text-ink">{doc.name}</span>
                    <span className="mt-1 block text-xs font-medium uppercase tracking-widest text-ink-soft">
                      {KIND_LABEL[doc.kind]}
                      <span className="mx-2 text-brand-300">·</span>
                      {doc.sizeLabel}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-700 transition-colors group-hover:text-brand-900 dark:text-brand-300 dark:group-hover:text-brand-100">
                    Descargar
                    <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" strokeWidth={1.5} />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
