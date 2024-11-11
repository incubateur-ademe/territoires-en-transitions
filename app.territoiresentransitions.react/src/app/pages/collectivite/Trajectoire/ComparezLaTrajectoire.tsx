import { Button, Card } from '@tet/ui';
import { makeCollectiviteIndicateursUrl } from 'app/paths';

/** Affiche l'encadré "Comparez la trajectoire SNBC à vos objectifs et vos résultats" */
export const ComparezLaTrajectoire = ({
  collectiviteId,
  identifiantReferentiel,
}: {
  collectiviteId: number;
  identifiantReferentiel: string;
}) => {
  return (
    <Card>
      <h5>Comparez la trajectoire SNBC à vos objectifs et vos résultats</h5>
      <p className="text-sm font-normal">
        Pour cela, il faut d&apos;abord{' '}
        <b>compléter vos objectifs et vos résultats dans vos Indicateurs</b>.
        Vous avez le choix d&apos;appliquer les données disponibles en open
        data, ou bien de renseigner vos propres données.
      </p>
      <Button
        href={makeCollectiviteIndicateursUrl({
          collectiviteId,
          indicateurView: 'cae',
          identifiantReferentiel,
        })}
        variant="outlined"
      >
        Compléter mes indicateurs
      </Button>
    </Card>
  );
};
