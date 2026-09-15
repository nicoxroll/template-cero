// Hero full-viewport (DESIGN-CIRIDAE.md § Hero): canvas Void Black + foto
// atmosférica a sangre muy desenfocada (blur ~48px). Marca centrada,
// micro-labels flanqueando extremos, ghost pills de acción. Composición
// triádica estática — el reveal vive en las secciones siguientes.

import { GhostPill } from './CiridaePrimitives';
import { CIR_HERO_PHOTO } from './ciridaeImages';

export default function CiridaeHero() {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-cir-void px-6">
      <img
        src={CIR_HERO_PHOTO}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-[48px]"
      />
      <div aria-hidden className="absolute inset-0 bg-cir-void/55" />

      <p
        aria-hidden
        className="absolute left-5 top-1/2 hidden w-[150px] -translate-y-1/2 font-cir-cond text-cir-body uppercase leading-tight tracking-[-0.02em] text-cir-white/60 sm:left-8 lg:block"
      >
        Arquitectura, desarrollo e inversión
      </p>
      <p
        aria-hidden
        className="absolute right-5 top-1/2 hidden w-[150px] -translate-y-1/2 text-right font-cir-cond text-cir-body uppercase leading-tight tracking-[-0.02em] text-cir-white/60 sm:right-8 lg:block"
      >
        Del terreno a la entrega
      </p>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <h1 className="font-cir-cond uppercase leading-[0.95] tracking-[-0.02em] text-cir-white [font-size:clamp(2.75rem,9vw,6.5rem)]">
          Punto Cero
          <span className="mt-2 block [font-size:clamp(0.9rem,2.2vw,1.5rem)] tracking-[0.2em] text-brand-500">
            Desarrollos
          </span>
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <GhostPill href="/proyectos">Ver proyectos</GhostPill>
          <GhostPill href="/contacto">Hablemos</GhostPill>
        </div>
      </div>
    </section>
  );
}
