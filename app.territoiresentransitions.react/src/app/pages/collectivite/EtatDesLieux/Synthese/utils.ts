import {avancementToLabel} from 'app/labels';
import {ProgressionRow} from './data/useProgressionReferentiel';

/**
 * Met en forme les scores pour les graphes de progression des scores
 */

export const getFormattedScore = (
  scoreData: readonly ProgressionRow[],
  indexBy: string,
  percentage: boolean,
  customColors: {}
) => {
  const formattedScore = [];

  if (percentage) {
    // Formate les scores (%) pour un affichage sur 100
    formattedScore.push(
      ...scoreData.map(d => ({
        [indexBy]: `${d.action_id.split('_')[1]}`,
        [avancementToLabel.fait]: d.score_realise * 100,
        [avancementToLabel.programme]: d.score_programme * 100,
        [avancementToLabel.pas_fait]: d.score_pas_fait * 100,
        [avancementToLabel.non_renseigne]: d.score_non_renseigne * 100,
        ...customColors,
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
    });
  } else {
    // Formate les scores en points
    formattedScore.push(
      ...scoreData.map(d => ({
        [indexBy]: `${d.action_id.split('_')[1]}`,
        [avancementToLabel.fait]: d.points_realises,
        [avancementToLabel.programme]: d.points_programmes,
        [avancementToLabel.pas_fait]:
          d.score_pas_fait * d.points_max_personnalises,
        [avancementToLabel.non_renseigne]:
          d.score_non_renseigne * d.points_max_personnalises,
        ...customColors,
      }))
    );
  }

  return formattedScore;
};
