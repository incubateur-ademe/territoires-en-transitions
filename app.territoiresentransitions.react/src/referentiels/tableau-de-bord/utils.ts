import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { ProgressionRow } from '../DEPRECATED_scores.types';

/**
 * Met en forme les scores pour les graphes de progression des scores
 */

export const getFormattedScore = (
  scoreData: readonly ProgressionRow[],
  indexBy: string,
  percentage: boolean,
  customColors: { [key: string]: string }
) => {
  const formattedScore = [];

  if (percentage) {
    // Formate les scores (%) pour un affichage sur 100
    formattedScore.push(
      ...scoreData.map((d) => ({
        [indexBy]: `${d.action_id.split('_')[1]}`,
        [avancementToLabel.fait]: d.score_realise * 100,
        [avancementToLabel.programme]: d.score_programme * 100,
        [avancementToLabel.pas_fait]: d.score_pas_fait * 100,
        [avancementToLabel.non_renseigne]: d.score_non_renseigne * 100,
        ...customColors,
        clickable: `${d.have_children}`,
      }))
    );

    // Calcul des scores totaux
    const totalPointsMaxPersonnalises =
      scoreData.reduce(
        (res, currVal) => res + currVal.points_max_personnalises,
        0
      ) || 1;

    formattedScore.push({
      [indexBy]: 'Total',
      [avancementToLabel.fait]:
        (scoreData.reduce((res, currVal) => res + currVal.points_realises, 0) /
          totalPointsMaxPersonnalises) *
        100,
      [avancementToLabel.programme]:
        (scoreData.reduce(
          (res, currVal) => res + currVal.points_programmes,
          0
        ) /
          totalPointsMaxPersonnalises) *
        100,
      [avancementToLabel.pas_fait]:
        (scoreData.reduce(
          (res, currVal) =>
            res + currVal.score_pas_fait * currVal.points_max_personnalises,
          0
        ) /
          totalPointsMaxPersonnalises) *
        100,
      [avancementToLabel.non_renseigne]:
        (scoreData.reduce(
          (res, currVal) =>
            res +
            currVal.score_non_renseigne * currVal.points_max_personnalises,
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
        [indexBy]: `${d.action_id.split('_')[1]}`,
        [avancementToLabel.fait]: d.points_realises,
        [avancementToLabel.programme]: d.points_programmes,
        [avancementToLabel.pas_fait]:
          d.score_pas_fait * d.points_max_personnalises,
        [avancementToLabel.non_renseigne]:
          d.score_non_renseigne * d.points_max_personnalises,
        ...customColors,
        clickable: `${d.have_children}`,
      }))
    );
  }

  return formattedScore;
};

export const getAggregatedScore = (scoreData: readonly ProgressionRow[]) => {
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

  scoreData.forEach((score) => {
    aggregatedScore[0].value += score.points_realises;
    aggregatedScore[1].value += score.points_programmes;
    aggregatedScore[2].value +=
      score.score_pas_fait * score.points_max_personnalises;
    aggregatedScore[3].value +=
      score.score_non_renseigne * score.points_max_personnalises;
  });

  return {
    array: aggregatedScore,
    realises: aggregatedScore[0].value,
    programmes: aggregatedScore[1].value,
    pas_fait: aggregatedScore[2].value,
    non_renseigne: aggregatedScore[3].value,
    max_personnalise: scoreData.reduce(
      (res, currVal) => res + currVal.points_max_personnalises,
      0
    ),
  };
};
