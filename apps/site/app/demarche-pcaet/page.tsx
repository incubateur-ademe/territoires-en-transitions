import { getUpdatedMetadata } from '@/site/src/utils/getUpdatedMetadata';
import { Metadata, ResolvingMetadata } from 'next';
import { DemarchePcaetCTASection } from './demarche-pcaet-cta.section';
import { DemarchePcaetDemoSection } from './demarche-pcaet-demo.section';
import { DemarchePcaetEtapesSection } from './demarche-pcaet-etapes.section';
import { DemarchePcaetFAQSection } from './demarche-pcaet-faq.section';
import { DemarchePcaetHeroSection } from './demarche-pcaet.hero-section';

export async function generateMetadata(
  _: { params: Promise<unknown> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;

  return getUpdatedMetadata(metadata, {
    title: 'Déposer votre PCAET (Plan Climat-Air-Énergie Territorial)',
    description:
      "Déposez votre Plan Climat sur Territoires en Transitions : un parcours de dépôt du PCAET guidé étape par étape, de l'élaboration à l'adoption, et un outil de pilotage pour suivre vos actions.",
  });
}

const DemarchePcaetPage = () => (
  <>
    <DemarchePcaetHeroSection />
    <DemarchePcaetEtapesSection />
    <DemarchePcaetDemoSection />
    <DemarchePcaetFAQSection />
    <DemarchePcaetCTASection />
  </>
);

export default DemarchePcaetPage;
