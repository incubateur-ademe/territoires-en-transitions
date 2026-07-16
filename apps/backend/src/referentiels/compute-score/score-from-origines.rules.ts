import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import { type ActionScoreWithOnlyPoints } from '@tet/domain/referentiels';
import { roundTo } from '@tet/domain/utils';
import { isNil } from 'es-toolkit';

export const getRatioFromOrigineActions = (
  origineActions: CorrelatedActionWithScore[] | undefined,
  referentielPointsPotentiels: number | null
): number => {
  const originePointsReferentiel = origineActions?.reduce(
    (acc, origineAction) =>
      acc +
      (origineAction.score?.pointReferentiel || 0) *
        (origineAction.ponderation || 1),
    0
  );
  const ratio = originePointsReferentiel
    ? (referentielPointsPotentiels || 0) / originePointsReferentiel
    : 0;
  return ratio;
};

export const getScoreFromOrigineActionsAndRatio = (
  ratio: number,
  origineActions: CorrelatedActionWithScore[] | undefined,
  roundingDigits: number,
  referentielPointsPotentiels?: number | null
): Partial<
  Pick<ActionScoreWithOnlyPoints, 'pointPotentiel' | 'pointReferentiel'>
> &
  Omit<ActionScoreWithOnlyPoints, 'pointPotentiel' | 'pointReferentiel'> => {
  const initialScore: Partial<
    Pick<ActionScoreWithOnlyPoints, 'pointPotentiel' | 'pointReferentiel'>
  > &
    Omit<ActionScoreWithOnlyPoints, 'pointPotentiel' | 'pointReferentiel'> = {
    pointFait: 0,
    pointProgramme: 0,
    pointPasFait: 0,
    pointNonRenseigne: 0,
  };
  initialScore.pointFait = roundTo(
    ratio *
      (origineActions?.reduce(
        (acc, origineAction) =>
          acc +
          ((origineAction.score?.faitTachesAvancement || 0) /
            (origineAction.score?.totalTachesCount || 1)) *
            (origineAction.score?.pointReferentiel || 0) *
            (origineAction.ponderation || 1),
        0
      ) || 0),
    roundingDigits
  );

  initialScore.pointProgramme = roundTo(
    ratio *
      (origineActions?.reduce(
        (acc, origineAction) =>
          acc +
          ((origineAction.score?.programmeTachesAvancement || 0) /
            (origineAction.score?.totalTachesCount || 1)) *
            (origineAction.score?.pointReferentiel || 0) *
            (origineAction.ponderation || 1),
        0
      ) || 0),
    roundingDigits
  );
  initialScore.pointPasFait = roundTo(
    ratio *
      (origineActions?.reduce(
        (acc, origineAction) =>
          acc +
          ((origineAction.score?.pasFaitTachesAvancement || 0) /
            (origineAction.score?.totalTachesCount || 1)) *
            (origineAction.score?.pointReferentiel || 0) *
            (origineAction.ponderation || 1),
        0
      ) || 0),
    roundingDigits
  );

  if (isNil(referentielPointsPotentiels)) {
    referentielPointsPotentiels =
      roundTo(
        ratio *
          (origineActions?.reduce(
            (acc, origineAction) =>
              acc +
              (origineAction.score?.pointReferentiel || 0) *
                (origineAction.ponderation || 1),
            0
          ) || 0),
        roundingDigits
      ) || 0;

    initialScore.pointReferentiel = referentielPointsPotentiels;
    initialScore.pointPotentiel = referentielPointsPotentiels;
  }

  initialScore.pointNonRenseigne = roundTo(
    (referentielPointsPotentiels || 0) -
      (initialScore.pointFait || 0) -
      (initialScore.pointProgramme || 0) -
      (initialScore.pointPasFait || 0),
    roundingDigits
  );

  return initialScore;
};
