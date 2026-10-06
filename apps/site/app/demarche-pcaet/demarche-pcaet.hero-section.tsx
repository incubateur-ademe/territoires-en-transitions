import Section from '@/site/components/sections/Section';
import { Button } from '@tet/ui';
import { DemarchePcaetAnimatedDiagram } from './demarche-pcaet.animated-diagram';
import { getDepotEntryUrl } from './demarche-pcaet.data';

export const DemarchePcaetHeroSection = () => {
  return (
    <Section
      className="flex flex-col gap-8 lg:gap-16 pt-12 pb-16 border-b border-primary-3"
      containerClassName="pt-0 bg-gradient-to-b from-[#F4F5FD] to-[#FFFFFF]"
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_580px] gap-8 xl:gap-12 items-center">
        <div className="flex flex-col justify-center">
          <h1 className="max-lg:text-center">
            Déposez votre <span className="text-primary-7">Plan Climat</span>{' '}
            sur Territoires en Transitions
          </h1>
          <p className="text-primary-7 max-lg:text-center text-2xl leading-8">
            Le dépôt des PCAET se fait maintenant sur Territoires en
            Transitions. Que votre démarche soit obligatoire ou volontaire,
            bénéficiez d&apos;un parcours de dépôt modernisé et d&apos;un outil
            de pilotage opérationnel pour suivre vos actions.
          </p>
          <div className="flex flex-wrap gap-4 max-lg:justify-center">
            <Button
              className="after:hidden"
              variant="primary"
              href={getDepotEntryUrl()}
              external
            >
              Commencer mon dépôt
            </Button>
          </div>
        </div>
        <DemarchePcaetAnimatedDiagram />
      </div>
    </Section>
  );
};
