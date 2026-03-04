import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { divisionOrZero } from '@tet/domain/utils';
import { ActionListItem } from '../actions/use-list-actions';

/**
 * Met en forme les scores pour les graphes de progression des scores
 */

export const getFormattedScore = (
  scoreData: readonly ActionListItem[],
  indexBy: string,
  percentage: boolean,
  customColors: { [key: string]: string }
) => {
  const formattedScore = [];

  if (percentage) {
    // Formate les scores (%) pour un affichage sur 100
    formattedScore.push(
      ...scoreData.map((d) => ({
        [indexBy]: `${d.actionId.split('_')[1]}`,
        [avancementToLabel.fait]:
          divisionOrZero(d.score.pointFait, d.score.pointPotentiel) * 100,
        [avancementToLabel.programme]:
          divisionOrZero(d.score.pointProgramme, d.score.pointPotentiel) * 100,
        [avancementToLabel.pas_fait]:
          divisionOrZero(d.score.pointPasFait, d.score.pointPotentiel) * 100,
        [avancementToLabel.non_renseigne]:
          divisionOrZero(d.score.pointNonRenseigne, d.score.pointPotentiel) *
          100,
        ...customColors,
        clickable: `${d.childrenIds.length > 0}`,
      }))
    );

    // Calcul des scores totaux
    const totalPointsMaxPersonnalises =
      scoreData.reduce(
        (res, currVal) => res + currVal.score.pointPotentiel,
        0
      ) || 1;

    formattedScore.push({
      [indexBy]: 'Total',
      [avancementToLabel.fait]:
        (scoreData.reduce((res, currVal) => res + currVal.score.pointFait, 0) /
          totalPointsMaxPersonnalises) *
        100,
      [avancementToLabel.programme]:
        (scoreData.reduce(
          (res, currVal) => res + currVal.score.pointProgramme,
          0
        ) /
          totalPointsMaxPersonnalises) *
        100,
      [avancementToLabel.pas_fait]:
        (scoreData.reduce(
          (res, currVal) =>
            res + currVal.score.pointPasFait * currVal.score.pointPotentiel,
          0
        ) /
          totalPointsMaxPersonnalises) *
        100,
      [avancementToLabel.non_renseigne]:
        (scoreData.reduce(
          (res, currVal) =>
            res +
            currVal.score.pointNonRenseigne * currVal.score.pointPotentiel,
          0
        ) /
          totalPointsMaxPersonnalises) *
        100,
      ...customColors,
      clickable: 'false',
    });
  } else {
    // Formate les scores en points
    formattedScore.push(
      ...scoreData.map((d) => ({
        [indexBy]: `${d.actionId.split('_')[1]}`,
        [avancementToLabel.fait]: d.score.pointFait,
        [avancementToLabel.programme]: d.score.pointProgramme,
        [avancementToLabel.pas_fait]:
          d.score.pointPasFait * d.score.pointPotentiel,
        [avancementToLabel.non_renseigne]:
          d.score.pointNonRenseigne * d.score.pointPotentiel,
        ...customColors,
        clickable: `${d.childrenIds.length > 0}`,
      }))
    );
  }

  return formattedScore;
};

export const getAggregatedScore = (scoreData: readonly ActionListItem[]) => {
  const aggregatedScore: { id: string; value: number; color?: string }[] = [
    {
      id: avancementToLabel.fait,
      value: 0,
      color: actionAvancementColors.fait,
    },
    {
      id: avancementToLabel.programme,
      value: 0,
      color: actionAvancementColors.programme,
    },
    {
      id: avancementToLabel.pas_fait,
      value: 0,
      color: actionAvancementColors.pas_fait,
    },
    {
      id: avancementToLabel.non_renseigne,
      value: 0,
      color: actionAvancementColors.non_renseigne,
    },
  ];

  scoreData.forEach(({ score }) => {
    aggregatedScore[0].value += score.pointFait;
    aggregatedScore[1].value += score.pointProgramme;
    aggregatedScore[2].value += score.pointPasFait * score.pointPotentiel;
    aggregatedScore[3].value += score.pointNonRenseigne * score.pointPotentiel;
  });

  return {
    array: aggregatedScore,
    realises: aggregatedScore[0].value,
    programmes: aggregatedScore[1].value,
    pas_fait: aggregatedScore[2].value,
    non_renseigne: aggregatedScore[3].value,
    max_personnalise: scoreData.reduce(
      (res, currVal) => res + currVal.score.pointPotentiel,
      0
    ),
  };
};
