// Home Ciridae (modo NORMAL) — orquesta las secciones siguiendo el ritmo de
// DESIGN-CIRIDAE.md § Layout: hero oscuro → franja Bone (única sección clara)
// → narrativa oscura → grilla de servicios → proyectos destacados → footer
// oscuro. Montado por src/pages/Home.tsx cuando el modo no es 'tour'.

import CiridaeTopBar from './CiridaeTopBar';
import CiridaeHero from './CiridaeHero';
import CiridaeMetrics from './CiridaeMetrics';
import CiridaeNarrative from './CiridaeNarrative';
import CiridaeServicesGrid from './CiridaeServicesGrid';
import CiridaeProjectsGrid from './CiridaeProjectsGrid';
import CiridaeFooter from './CiridaeFooter';

export default function CiridaeHome() {
  return (
    <div className="bg-cir-void">
      <CiridaeTopBar />
      <CiridaeHero />
      <CiridaeMetrics />
      <CiridaeNarrative />
      <CiridaeServicesGrid />
      <CiridaeProjectsGrid />
      <CiridaeFooter />
    </div>
  );
}
