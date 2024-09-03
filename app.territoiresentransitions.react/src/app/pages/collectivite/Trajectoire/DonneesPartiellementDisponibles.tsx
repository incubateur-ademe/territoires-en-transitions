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
      title="Données partiellement disponibles"
      description="Certains secteurs manquent dans le graphique ci-dessus : nous ne disposons pas encore des données permettant de calculer leur trajectoire SNBC territorialisée pour votre collectivité. Nous y travaillons et espérons vous proposer une trajectoire complète automatiquement très prochainement. En attendant, vous pouvez calculer dès maintenant votre trajectoire pour l’ensemble des secteurs en complétant les données déjà disponibles."
      footer={
        <Modal
          size="xl"
          render={props => <DonneesCollectivite modalProps={props} />}
        >
          <Button size="sm">Compléter mes données</Button>
        </Modal>
      }
    />
  );
};
