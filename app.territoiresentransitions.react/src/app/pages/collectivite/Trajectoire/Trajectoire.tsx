import {Alert, Button, Card, Modal, TrackPageView} from '@tet/ui';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import {StatutTrajectoire, useStatutTrajectoire} from './useStatutTrajectoire';
import {useCalculTrajectoire} from './useCalculTrajectoire';
import {TrajectoireCalculee} from './TrajectoireCalculee';
import {CommuneNonSupportee} from './CommuneNonSupportee';
import {HELPDESK_URL} from './constants';
import {ReactComponent as DbErrorPicto} from './db-error.svg';
import {ReactComponent as TrajectoirePicto} from './trajectoire.svg';
import {DonneesCollectivite} from './DonneesCollectivite/DonneesCollectivite';
import {useCollectiviteId} from 'core-logic/hooks/params';

/**
 * Affiche l'écran approprié en fonction du statut du calcul de la trajectoire SNBC
 */
const TrajectoireContent = (props: {
  statut: ReturnType<typeof useStatutTrajectoire>;
}) => {
  const {data, error, isLoading} = props.statut;
  if (isLoading) {
    return (
      <div className="h-56 flex justify-center items-center">
        <SpinnerLoader className="w-8 h-8 fill-primary-5" />
      </div>
    );
  }

  if (error || !data || !data.status) {
    return <ErreurDeChargement />;
  }

  if (data.status === StatutTrajectoire.DONNEES_MANQUANTES) {
    return <DonneesNonDispo />;
  }

  if (data.status === StatutTrajectoire.COMMUNE_NON_SUPPORTEE) {
    return <CommuneNonSupportee />;
  }

  if (data.status === StatutTrajectoire.PRET_A_CALCULER) {
    return <Presentation />;
  }

  if (data.status === StatutTrajectoire.DEJA_CALCULE) {
    return <TrajectoireCalculee />;
  }

  return <ErreurDeChargement />;
};

/**
 * Affiche un message quand les données pour faire le calcul de la trajectoire
 * ne sont pas disponibles.
 */
const DonneesNonDispo = () => {
  return (
    <Card className="flex items-center my-16">
      <DbErrorPicto />
      <h2>Données disponibles insuffisantes pour le calcul</h2>
      <p className="font-normal text-lg text-center">
        Nous ne disposons pas encore des données suffisantes pour permettre le
        calcul automatique de la trajectoire SNBC territorialisée de votre
        collectivité. Vous pouvez néanmoins lancer un calcul en complétant les
        données disponibles en open data avec vos propres données. Vous pourrez
        ainsi visualiser facilement votre trajectoire SNBC territorialisée et la
        comparer aux objectifs fixés et résultats observés.
      </p>
      <Modal
        size="xl"
        render={props => <DonneesCollectivite modalProps={props} />}
      >
        <Button>Compléter mes données</Button>
      </Modal>
    </Card>
  );
};

/**
 * Affiche un message quand les données n'ont pas pu être chargées (erreur 500 par exemple)
 */
const ErreurDeChargement = () => {
  return (
    <Alert
      state="error"
      className="self-stretch my-8"
      title="Erreur lors du chargement des données"
      description="Veuillez ré-essayer dans quelques instants. Si le problème persiste merci de contacter le support."
    />
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
        <h1>Je calcule ma trajectoire SNBC territorialisée</h1>
        <p className="font-bold text-lg">
          La trajectoire SNBC territorialisée n’est aucunement prescriptive.
          <br />
          C’est un outil d’aide à la décision, un point de repère pour :
        </p>
        <ul className="w-11/12 text-lg list-disc ml-4 mb-0">
          <li>
            Définir vos objectifs ou les interroger lorsque ceux-ci sont définis
            (par exemple à l’occasion d’un suivi annuel ou d’un bilan à
            mi-parcours d’un PCAET)
          </li>
          <li>Quantifier les efforts à réaliser secteur par secteur</li>
          <li>Identifier sa contribution à la SNBC</li>
        </ul>
        <Button
          size="md"
          variant="underlined"
          external
          href={HELPDESK_URL}
          className="mb-6"
        >
          Pour plus d’informations
        </Button>

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
const Trajectoire = () => {
  const statut = useStatutTrajectoire();
  const {data, isLoading} = statut;
  const collectivite_id = useCollectiviteId()!;

  return (
    <div className="bg-grey-2 -mb-8">
      {!isLoading && (
        <TrackPageView
          pageName="app/trajectoires/snbc"
          properties={{
            collectivite_id,
            statut: data && data.status ? data.status : 'error',
          }}
        />
      )}
      <div className="fr-container flex flex-col gap-16">
        <TrajectoireContent statut={statut} />
      </div>
    </div>
  );
};

export default Trajectoire;
