import Section from '@/site/components/sections/Section';
import { getAuthPaths } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';
import { Button } from '@tet/ui';
import { getStatsHeroSectionSite } from '../home/getStatsHeroSectionSite';

export const PlateformeCTASection = async () => {
  const authPaths = getAuthPaths(ENV.app_url ?? '');
  const stats = await getStatsHeroSectionSite();
  const nbCollectivitesActives = stats?.nb_ct_actif_12_mois ?? 0;

  return (
    <Section className="text-center">
      <h2>Prêt·e à piloter efficacement votre transition écologique ?</h2>
      {nbCollectivitesActives > 0 && (
        <p>
          Rejoignez gratuitement les{' '}
          <span className="font-bold text-3xl">
            {new Intl.NumberFormat('fr-FR').format(nbCollectivitesActives)}
          </span>{' '}
          collectivités qui pilotent déjà leurs plans d&apos;actions sur
          Territoires en Transitions.
        </p>
      )}
      <div className="flex flex-wrap gap-4 max-lg:justify-center mx-auto">
        <Button
          className="after:hidden"
          variant="primary"
          href={authPaths?.signUp}
          external
        >
          Je crée mon compte gratuitement
        </Button>
        <Button
          className="after:hidden"
          variant="outlined"
          href="https://calendly.com/territoiresentransitions/demo-fonctionnalite-plans-d-action"
          external
        >
          Je réserve une démo
        </Button>
      </div>
    </Section>
  );
};
