import { getUpdatedMetadata } from '@/site/src/utils/getUpdatedMetadata';
import { Metadata, ResolvingMetadata } from 'next';
import { HomeCTA } from '../home/HomeCTA';
import { ApportsPlateformeSection } from './apports-plateforme.section';
import { DistingueSection } from './distingue.section';
import { PlateformeCTASection } from './plateforme-cta.section';
import { PlateformeFAQSection } from './plateforme-faq.section';
import { PlateformeNumeriqueHeroSection } from './plateforme-numerique.hero-section';
import { QuiSommesNousSection } from './qui-sommes-nous.section';
import TemoignagesPlateforme from './TemoignagesPlateforme';
import { getStrapiData } from './utils';

export async function generateMetadata(
  _: { params: Promise<unknown> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const strapiData = await getStrapiData();

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle ?? 'Plateforme numérique',
    networkTitle: strapiData?.seo.metaTitle,
    description: strapiData?.seo.metaDescription ?? strapiData?.header.accroche,
    image: strapiData?.seo.metaImage,
  });
}

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
