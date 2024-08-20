import {Button, Card} from '@tet/ui';
import {makeCollectiviteIndicateursUrl} from 'app/paths';

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
        Vos résultats et vos objectifs ne sont pas disponibles pour cet
        indicateur. Veuillez les renseigner afin de pouvoir les comparer à votre
        trajectoire SNBC territorialisée. Vous pourrez ainsi visualiser les
        écarts plus facilement pour piloter votre stratégie.
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
