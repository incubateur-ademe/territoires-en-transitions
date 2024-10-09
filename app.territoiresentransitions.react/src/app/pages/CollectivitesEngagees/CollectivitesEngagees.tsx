import {Route} from 'react-router-dom';
import {Button, Card} from '@tet/ui';
import {getRejoindreCollectivitePath} from '@tet/api';
import {useSansCollectivite} from 'core-logic/hooks/useOwnedCollectivites';
import DecouvrirLesCollectivites from './DecouvrirLesCollectivites';
import {ReactComponent as PictoCarte} from './carte.svg';
import {
  finaliserMonInscriptionUrl,
  recherchesCollectivitesUrl,
  recherchesPath,
} from 'app/paths';

const CollectivitesEngagees = () => {
  const sansCollectivite = useSansCollectivite();

  return (
    <>
      <Route path={finaliserMonInscriptionUrl}>
        <FinaliserMonInscription />
      </Route>
      <Route path={recherchesPath}>
        <DecouvrirLesCollectivites sansCollectivite={sansCollectivite} />
      </Route>
    </>
  );
};

const FinaliserMonInscription = () => (
  <div className="mx-auto my-8" data-test="FinaliserInscription">
    <Card className="items-center">
      <PictoCarte />
      <h2 className="text-primary-8">Merci pour votre inscription !</h2>
      <p className="font-normal text-center leading-7">
        Dernière étape pour accéder à l’ensemble des fonctionnalités de &nbsp;
        <b>Territoires en Transitions</b> : rejoindre une collectivité.
        <br />
        Vous pouvez également découvrir les collectivités déjà inscrites sur la
        plateforme.
      </p>
      <div className="flex flex-row gap-4">
        <Button variant="outlined" href={recherchesCollectivitesUrl}>
          Découvrir les collectivités
        </Button>
        <Button
          href={getRejoindreCollectivitePath(
            document.location.hostname,
            document.location.origin
          )}
        >
          Rejoindre une collectivité
        </Button>
      </div>
    </Card>
  </div>
);

export default CollectivitesEngagees;
