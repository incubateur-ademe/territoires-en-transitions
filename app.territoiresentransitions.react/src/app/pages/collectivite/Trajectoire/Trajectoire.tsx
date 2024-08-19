import {Alert, Button, Card} from '@tet/ui';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {StatutTrajectoire, useStatutTrajectoire} from './useStatutTrajectoire';
import {useCalculTrajectoire} from './useCalculTrajectoire';
import TrajectoireCalculee from './TrajectoireCalculee';
import {ReactComponent as DbErrorPicto} from './db-error.svg';
import {ReactComponent as TrajectoirePicto} from './trajectoire.svg';

/**
 * Affiche l'écran approprié en fonction du statut du calcul de la trajectoire SNBC
 */
const TrajectoireContent = () => {
  const {data, error, isLoading} = useStatutTrajectoire();
  if (isLoading) {
    return (
      <div className="h-56 flex justify-center items-center">
        <SpinnerLoader className="w-8 h-8 fill-primary-5" />
      </div>
    );
  }

  if (
    error ||
    !data ||
    !data.status ||
    data.status === StatutTrajectoire.COMMUNE_NON_SUPPORTEE
  ) {
    return <DonneesNonDispo />;
  }

  if (data.status === StatutTrajectoire.DONNEES_MANQUANTES) {
    return <DonneesNonDispo aCompleter />;
  }

  if (data.status === StatutTrajectoire.PRET_A_CALCULER) {
    return <Presentation />;
  }

  if (data.status === StatutTrajectoire.DEJA_CALCULE) {
    return <TrajectoireCalculee />;
  }

  return <DonneesNonDispo />;
};

/**
 * Affiche un message quand les données pour faire le calcul de la trajectoire
 * ne sont pas disponibles.
 */
const DonneesNonDispo = ({aCompleter}: {aCompleter?: boolean}) => {
  const collectiviteId = useCollectiviteId()!;

  return (
    <Card className="flex items-center my-16">
      <DbErrorPicto />
      <h2>Données disponibles insuffisantes pour le calcul</h2>
      <p>
        Nous ne disposons pas encore des données suffisantes pour permettre le
        calcul automatique de la trajectoire SNBC territorialisée de votre
        collectivité. Vous pouvez néanmoins lancer un calcul en complétant les
        données disponibles en open data avec vos propres données. Vous pourrez
        ainsi visualiser facilement votre trajectoire SNBC territorialisée et la
        comparer aux objectifs fixés et résultats observés.
      </p>
      {aCompleter ? (
        <Button
          href={makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: 'cae',
          })}
        >
          Compléter mes données
        </Button>
      ) : (
        <Alert
          className="self-stretch"
          title="Revenez dans quelques jours !"
          description="Dans la prochaine version, vous pourrez compléter vos données et ainsi calculer votre trajectoire."
        />
      )}
    </Card>
  );
};

/**
 * Affiche le message de présentation
 */
const Presentation = () => {
  const {mutate: calcul, isLoading} = useCalculTrajectoire();

  return (
    <div className="flex flex-row gap-14 py-12">
      <div className="w-3/5">
        <h2>Je calcule ma trajectoire SNBC territorialisée</h2>
        <p>
          La trajectoire SNBC territorialisée n’est aucunement prescriptive.
          C’est un outil d’aide à la décision, un point de repère pour :
        </p>
        <ul>
          <li>
            Définir vos objectifs ou les interroger lorsque ceux-ci sont définis
            (par exemple à l’occasion d’un suivi annuel ou d’un bilan à
            mi-parcours d’un PCAET)
          </li>
          <li>Quantifier les efforts à réaliser secteur par secteur</li>
          <li>Identifier sa contribution à la SNBC</li>
        </ul>
        <Button onClick={() => calcul()} disabled={isLoading}>
          {isLoading ? (
            <>
              Calcul en cours
              <SpinnerLoader />
            </>
          ) : (
            'Je lance le calcul'
          )}
        </Button>
      </div>
      <TrajectoirePicto />
    </div>
  );
};

/**
 * Point d'entrée
 */
const Trajectoire = () => (
  <div className="bg-grey-2 -mb-8">
    <div className="fr-container flex flex-col gap-16">
      <TrajectoireContent />
    </div>
  </div>
);

export default Trajectoire;
