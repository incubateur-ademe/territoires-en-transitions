import {Alert, Button, Modal} from '@tet/ui';
import {DonneesCollectivite} from './DonneesCollectivite/DonneesCollectivite';

const DEFAULT_TITLE =
  'Voici un premier calcul de votre trajectoire SNBC territorialisée, avec les données disponibles !';
const DEFAULT_DESC =
  "Il manque des données pour certains secteurs : nous vous les mettrons à disposition prochainement. En attendant, complétez les données manquantes pour l'année 2015 afin de finaliser le calcul.";

/** Affiche l'avertissement "Données partiellement disponibles" */
export const DonneesPartiellementDisponibles = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
}: {
  title?: string;
  description?: string;
}) => {
  return (
    <Alert
      state="warning"
      title={title}
      description={description}
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
