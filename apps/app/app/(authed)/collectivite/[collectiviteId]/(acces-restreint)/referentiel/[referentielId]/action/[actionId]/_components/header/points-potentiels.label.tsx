import { appLabels } from '@/app/labels/catalog';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { ActionScoreFinal } from '@tet/domain/referentiels';

type ActionScoreLike = Pick<
  ActionScoreFinal,
  'pointReferentiel' | 'pointPotentiel' | 'pointPotentielPerso' | 'desactive'
>;

/**
 * Affiche le potentiel de points (normal ou réduit)
 */
export function PointsPotentiels({ score }: { score?: ActionScoreLike }) {
  if (!score) {
    return null;
  }

  return (
    <div className="text-sm text-grey-6" data-test="points-potentiels">
      {getLabel(score)}
    </div>
  );
}

const getLabel = (actionScore: ActionScoreLike): string => {
  const { pointReferentiel, pointPotentiel, pointPotentielPerso, desactive } =
    actionScore;

  if (desactive) {
    return appLabels.potentielReduitZero;
  }

  const value = pointPotentielPerso ?? pointPotentiel ?? pointReferentiel;
  const points = appLabels.pointsFormates({
    formattedValue: toLocaleFixed(value, 2),
    count: value,
  });

  const isModified = Math.abs(value - pointReferentiel) >= 0.1;

  if (isModified) {
    return value > pointReferentiel
      ? appLabels.potentielAugmente({ points })
      : appLabels.potentielReduit({ points });
  }
  return appLabels.potentiel({ points });
};
