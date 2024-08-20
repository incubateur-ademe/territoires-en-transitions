import {Alert, Button} from '@tet/ui';
import {makeCollectiviteIndicateursUrl} from 'app/paths';

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
        <Button
          size="sm"
          href={makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: 'cae',
            identifiantReferentiel,
          })}
        >
          Compléter mes données
        </Button>
      }
    />
  );
};
