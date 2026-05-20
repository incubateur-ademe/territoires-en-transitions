import { appLabels } from '@/app/labels/catalog';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { Button, Card } from '@tet/ui';

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
      <h3 className="text-lg mb-0">{appLabels.comparezTrajectoireSnbcTitre}</h3>
      <div className="flex justify-between flex-col lg:flex-row lg:items-center">
        <p className="text-sm font-normal w-full lg:w-3/4 lg:mb-0 mb-2">
          {appLabels.comparezTrajectoireSnbcIntro}
          {readonly ? (
            <>
              <b>{appLabels.comparezTrajectoireSnbcActionReadonly}</b>
              {appLabels.comparezTrajectoireSnbcDetailsReadonly}
            </>
          ) : (
            <>
              <b>{appLabels.comparezTrajectoireSnbcActionEditeur}</b>
              {appLabels.comparezTrajectoireSnbcDetailsEditeur}
            </>
          )}
        </p>
        <div className="w-full lg:w-1/4 flex justify-end lg:items-center">
          <Button
            disabled={readonly}
            href={makeCollectiviteIndicateursUrl({
              collectiviteId,
              indicateurView: 'cae',
              identifiantReferentiel,
            })}
            variant="outlined"
          >
            {appLabels.completerMesIndicateurs}
          </Button>
        </div>
      </div>
    </Card>
  );
};
