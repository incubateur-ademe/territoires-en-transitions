import { HomeCTA } from '../home/HomeCTA';
import { ApportsPlateformeSection } from './apports-plateforme.section';
import { DistingueSection } from './distingue.section';
import { PlateformeCTASection } from './plateforme-cta.section';
import { PlateformeFAQSection } from './plateforme-faq.section';
import { PlateformeNumeriqueHeroSection } from './plateforme-numerique.hero-section';
import { QuiSommesNousSection } from './qui-sommes-nous.section';
import TemoignagesPlateforme from './TemoignagesPlateforme';
import { getStrapiData } from './utils';

/**
 * TODO : Ajouter les méta données
 */

const PlateformeNumerique = async () => {
  const data = await getStrapiData();

  return (
    <>
      <PlateformeNumeriqueHeroSection />
      <ApportsPlateformeSection />
      <HomeCTA />
      <DistingueSection />
      {data?.temoignages && data.temoignages.length > 0 && (
        <TemoignagesPlateforme temoignages={data.temoignages} />
      )}
      <PlateformeCTASection />
      <PlateformeFAQSection />
      <QuiSommesNousSection />
    </>
  );
};

export default PlateformeNumerique;
