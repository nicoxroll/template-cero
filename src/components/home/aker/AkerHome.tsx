// AkerHome — orquestador del skin Aker (modo Galería) para la landing.
// Clon 1:1 de la estructura/riqueza de akercompanies.com (ver brief de
// reconstrucción y DESIGN-AKER.md): 12 secciones, mismo ritmo de sección que
// el sitio real (hero foto → canvas → foto → canvas → foto → banda oscura →
// canvas ×4 → cierre 2-cards → footer sitemap). Reemplaza la presentación
// completa de Home (HomeStory + FeaturedProjectsStrip) cuando skin === 'aker'
// — branch en src/pages/Home.tsx. El <Footer/> global se oculta en esta
// página vía App.tsx (PublicLayout) para no duplicar el sitemap de cierre.

import AkerHero from './AkerHero';
import AkerStatement from './AkerStatement';
import AkerPhotoBand from './AkerPhotoBand';
import AkerQueHacemos from './AkerQueHacemos';
import AkerDondeDesarrollamos from './AkerDondeDesarrollamos';
import AkerQueBuscamos from './AkerQueBuscamos';
import AkerNuestroTrabajo from './AkerNuestroTrabajo';
import AkerEquipo from './AkerEquipo';
import AkerEnNumeros from './AkerEnNumeros';
import AkerClosingCta from './AkerClosingCta';
import AkerFooter from './AkerFooter';
import { AKER_BRAND_ASSETS_BAND, AKER_PHOTO_BAND_1 } from './akerImages';

export default function AkerHome() {
  return (
    <div className="bg-aker-paper">
      <AkerHero />
      <AkerStatement />
      <AkerPhotoBand image={AKER_PHOTO_BAND_1} />
      <AkerQueHacemos />
      <AkerPhotoBand image={AKER_BRAND_ASSETS_BAND} heightClass="h-[50vh] md:h-[60vh]" />
      <AkerDondeDesarrollamos />
      <AkerQueBuscamos />
      <AkerNuestroTrabajo />
      <AkerEquipo />
      <AkerEnNumeros />
      <AkerClosingCta />
      <AkerFooter />
    </div>
  );
}
