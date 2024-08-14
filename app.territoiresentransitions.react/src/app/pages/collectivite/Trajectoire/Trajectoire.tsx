import {Alert, Button, Card} from '@tet/ui';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import {CheckDataSNBCStatus, useTrajectoireCheck} from './useTrajectoire';
import {ReactComponent as DbErrorPicto} from './db-error.svg';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';

/**
 * Affiche la trajectoire SNBC
 */
const TrajectoireContent = () => {
  const {data, error, isLoading} = useTrajectoireCheck();
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
    data.status === CheckDataSNBCStatus.COMMUNE_NON_SUPPORTEE
  ) {
    return <DonneesNonDispo />;
  }

  if (data.status === CheckDataSNBCStatus.DONNEES_MANQUANTES) {
    return <DonneesNonDispo aCompleter />;
  }
};

/**
 * Affiche un message quand les données pour faire le calcul de la trajectoire
 * ne sont pas disponibles.
 */
const DonneesNonDispo = ({aCompleter}: {aCompleter?: boolean}) => {
  const collectiviteId = useCollectiviteId()!;

  return (
    <Card className="flex items-center">
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
        <Button href={makeCollectiviteIndicateursUrl({collectiviteId})}>
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

const Trajectoire = () => (
  <div className="flex items-start gap-20 mb-12">
    <TrajectoireContent />
  </div>
);

export default Trajectoire;
