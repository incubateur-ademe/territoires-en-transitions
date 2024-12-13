import { getRejoindreCollectivitePath } from '@/api';
import {
  finaliserMonInscriptionUrl,
  recherchesCollectivitesUrl,
  recherchesPath,
} from '@/app/app/paths';
import { EmptyCard } from '@/ui';
import { Route } from 'react-router-dom';
import DecouvrirLesCollectivites from './DecouvrirLesCollectivites';
import { ReactComponent as PictoCarte } from './carte.svg';

const CollectivitesEngagees = () => {
  return (
    <>
      <Route path={finaliserMonInscriptionUrl}>
        <FinaliserMonInscription />
      </Route>
      <Route path={recherchesPath}>
        <DecouvrirLesCollectivites />
      </Route>
    </>
  );
};

const FinaliserMonInscription = () => (
  <div className="mx-auto my-8" data-test="FinaliserInscription">
    <EmptyCard
      picto={(props) => <PictoCarte {...props} />}
      title="Merci pour votre inscription !"
      description="Dernière étape pour accéder à l'ensemble des fonctionnalités de Territoires en Transitions : rejoindre une collectivité. Vous pouvez également découvrir les collectivités déjà inscrites sur la plateforme."
      actions={[
        {
          children: 'Découvrir les collectivités',
          onClick: () => (window.location.href = recherchesCollectivitesUrl),
          variant: 'outlined',
        },
        {
          children: 'Rejoindre une collectivité',
          onClick: () =>
            (window.location.href = getRejoindreCollectivitePath(
              document.location.origin
            )),
        },
      ]}
      size="xl"
    />
  </div>
);

export default CollectivitesEngagees;
