import { getUpdatedMetadata } from '@/site/src/utils/getUpdatedMetadata';
import { isPcaetLaunched } from '@/site/src/utils/is-pcaet-launched';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { DemarchePcaetCTASection } from './demarche-pcaet-cta.section';
import { DemarchePcaetDemoSection } from './demarche-pcaet-demo.section';
import { DemarchePcaetEtapesSection } from './demarche-pcaet-etapes.section';
import { DemarchePcaetFAQSection } from './demarche-pcaet-faq.section';
import { DEPOT_ETAPES } from './demarche-pcaet.data';
import { DemarchePcaetHeroSection } from './demarche-pcaet.hero-section';
import { getDemarchePcaetSeo } from './demarche-pcaet.seo';

export async function generateMetadata(
  _: { params: Promise<unknown> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const seo = await getDemarchePcaetSeo();

  // Valeurs de repli tant que le référencement n'est pas saisi dans Strapi.
  return getUpdatedMetadata(metadata, {
    title:
      seo.title ?? 'Déposer votre PCAET (Plan Climat-Air-Énergie Territorial)',
    networkTitle: seo.title,
    description:
      seo.description ??
      "Déposez votre Plan Climat sur Territoires en Transitions : un parcours de dépôt du PCAET guidé étape par étape, de l'élaboration à l'adoption, et un outil de pilotage pour suivre vos actions.",
    image: seo.image,
  });
}

const DemarchePcaetPage = async () => {
  if (!(await isPcaetLaunched())) {
    notFound();
  }

  return (
    <>
      <DemarchePcaetHeroSection />
      <DemarchePcaetEtapesSection etapes={DEPOT_ETAPES} />
      <DemarchePcaetDemoSection />
      <DemarchePcaetFAQSection />
      <DemarchePcaetCTASection />
    </>
  );
};

export default DemarchePcaetPage;
