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
      <h3 className="text-lg mb-0">
        Comparez la trajectoire SNBC à vos objectifs et vos résultats
      </h3>
      <div className="flex justify-between">
        <p className="text-sm font-normal w-3/4">
          Pour cela, il faut d&apos;abord{' '}
          {readonly ? (
            <>
              <b>
                faire compléter vos objectifs et vos résultats dans vos
                Indicateurs par un utilisateur en Edition ou Admin sur le profil
                de cette collectivité
              </b>
              . L&apos;utilisateur pourra appliquer les données disponibles en
              open data, ou bien renseigner ses propres données.
            </>
          ) : (
            <>
              <b>
                compléter vos objectifs et vos résultats dans vos Indicateurs
              </b>
              . Vous avez le choix d&apos;appliquer les données disponibles en
              open data, ou bien de renseigner vos propres données.
            </>
          )}
        </p>
        <div>
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
        </div>
      </div>
    </Card>
  );
};
