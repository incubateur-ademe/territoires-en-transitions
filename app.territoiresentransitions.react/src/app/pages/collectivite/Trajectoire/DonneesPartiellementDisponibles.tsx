import {Alert, Button, Modal} from '@tet/ui';
import {DonneesCollectivite} from './DonneesCollectivite/DonneesCollectivite';

/** Affiche l'avertissement "Données partiellement disponibles" */
export const DonneesPartiellementDisponibles = ({
  collectiviteId,
  identifiantReferentiel,
}: {
  collectiviteId: number;
  identifiantReferentiel: string;
}) => {
  return (
    <Alert
      state="warning"
      title="Voici un premier calcul de votre trajectoire SNBC territorialisée, avec les données disponibles !"
      description="Il manque des données pour certains secteurs : nous vous les mettrons à disposition prochainement. En attendant, complétez les données manquantes pour l'année 2015 afin de finaliser le calcul."
      footer={
        <Modal
          size="xl"
          render={props => <DonneesCollectivite modalProps={props} />}
        >
          <Button size="sm">Compléter les données</Button>
        </Modal>
      }
    />
  );
};
