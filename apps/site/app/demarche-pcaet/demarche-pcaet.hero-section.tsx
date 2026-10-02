import Section from '@/site/components/sections/Section';
import { getAuthPaths } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';
import { Button } from '@tet/ui';
import { DemarchePcaetSchemaAnime } from './demarche-pcaet.schema-anime';

export const DemarchePcaetHeroSection = () => {
  const appUrl = ENV.app_url ?? '';
  // Le site ignore la collectivité de l'utilisateur : l'app la résout après la
  // connexion, via son raccourci `/collectivite/demarche-pcaet`.
  const depotAuthPaths = getAuthPaths(`${appUrl}/collectivite/demarche-pcaet`);
  const authPaths = getAuthPaths(appUrl);

  return (
    <Section
      className="pt-6 pb-8 lg:pt-10 lg:pb-12"
      containerClassName="bg-gradient-to-b from-[#F8F9FE] to-primary-0 border-b border-primary-3"
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_580px] gap-10 xl:gap-14 items-center">
        <div className="flex flex-col gap-7">
          <h1 className="mb-0 text-primary-10 text-[1.875rem] lg:text-[2.75rem] leading-tight">
            Déposez votre <span className="text-primary-7">Plan Climat</span>{' '}
            sur Territoires en Transitions
          </h1>
          <p className="mb-0 text-primary-8 font-medium text-lg lg:text-2xl lg:text-primary-7 lg:font-normal">
            Le dépôt des PCAET se fait maintenant sur Territoires en
            Transitions. Que votre démarche soit obligatoire ou volontaire,
            bénéficiez d&apos;un parcours de dépôt modernisé et d&apos;un outil
            de pilotage opérationnel pour suivre vos actions.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <Button
              className="after:hidden justify-center max-sm:w-full"
              href={depotAuthPaths.login}
              external
            >
              Commencer mon dépôt
            </Button>
            <Button
              className="after:hidden justify-center max-sm:w-full"
              variant="outlined"
              icon="account-circle-line"
              href={authPaths.login}
              external
            >
              Se connecter
            </Button>
          </div>
        </div>
        <DemarchePcaetSchemaAnime />
      </div>
    </Section>
  );
};
