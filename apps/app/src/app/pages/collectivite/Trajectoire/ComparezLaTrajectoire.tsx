import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { Button, Card } from '@/ui';

interface ComparezLaTrajectoireProps {
  collectiviteId: number;
  identifiantReferentiel: string;
  readonly?: boolean;
}

/** Affiche l'encadré "Comparez la trajectoire SNBC à vos objectifs et vos résultats" */
export const ComparezLaTrajectoire = ({
  collectiviteId,
  identifiantReferentiel,
  readonly = false,
}: ComparezLaTrajectoireProps) => {
  return (
    <Card>
      <h5>Comparez la trajectoire SNBC à vos objectifs et vos résultats</h5>
      {readonly ? (
        <p className="text-sm font-normal">
          Pour cela, il faut d&apos;abord{' '}
          <b>
            faire compléter vos objectifs et vos résultats dans vos Indicateurs
            par un utilisateur en Edition ou Admin sur le profil de cette
            collectivité
          </b>
          . L&apos;utilisateur pourra appliquer les données disponibles en open
          data, ou bien renseigner ses propres données.
        </p>
      ) : (
        <p className="text-sm font-normal">
          Pour cela, il faut d&apos;abord{' '}
          <b>compléter vos objectifs et vos résultats dans vos Indicateurs</b>.
          Vous avez le choix d&apos;appliquer les données disponibles en open
          data, ou bien de renseigner vos propres données.
        </p>
      )}
      <Button
        disabled={readonly}
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
