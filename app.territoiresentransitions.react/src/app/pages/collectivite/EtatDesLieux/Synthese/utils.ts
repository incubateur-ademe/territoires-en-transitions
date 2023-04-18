import {ProgressionRow} from './data/queries';

/**
 * Définition des titres des axes pour les graphes de progression des scores
 *
 * @param scoreData readonly ProgressionRow[]
 * @param addTotal boolean
 * @returns string[]
 */

export const getIndexTitles = (
  scoreData: readonly ProgressionRow[],
  addTotal: boolean
) => {
  let indexTitles = scoreData.map(
    d => `${d.action_id.split('_')[1]}. ${d.nom}`
  );
  if (addTotal) indexTitles.push('Total');

  return indexTitles;
};

/**
 * Calcule les scores moyens en % pour la ligne "Total"
 *
 * @param scoreData readonly ProgressionRow[]
 * @param key string
 * @returns number
 */

const getAverageScore = (
  scoreData: readonly ProgressionRow[],
  key: string
): number => {
  return (
    // @ts-ignore
    (scoreData.reduce((res, currVal) => res + currVal[key], 0) /
      (scoreData.length || 1)) *
    100
  );
};

/**
 * Met en forme les scores pour les graphes de progression des scores
 * @param scoreData readonly ProgressionRow[]
 * @param indexBy string
 * @param percentage boolean
 * @param customColors {}
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
        Fait: d.score_realise * 100,
        Programmé: d.score_programme * 100,
        'Pas fait': d.score_pas_fait * 100,
        'Non renseigné': d.score_non_renseigne * 100,
        ...customColors,
      }))
    );

    // Calcul des scores totaux
    formattedScore.push({
      [indexBy]: 'Total',
      Fait: getAverageScore(scoreData, 'score_realise'),
      Programmé: getAverageScore(scoreData, 'score_programme'),
      'Pas fait': getAverageScore(scoreData, 'score_pas_fait'),
      'Non renseigné': getAverageScore(scoreData, 'score_non_renseigne'),
      ...customColors,
    });
  } else {
    // Formate les scores en points
    formattedScore.push(
      ...scoreData.map(d => ({
        [indexBy]: `${d.action_id.split('_')[1]}`,
        Fait: d.points_realises,
        Programmé: d.points_programmes,
        'Pas fait': d.score_pas_fait * d.points_max_personnalises,
        'Non renseigné':
          d.points_max_personnalises -
          d.points_realises -
          d.points_programmes -
          d.score_pas_fait * d.points_max_personnalises,
        ...customColors,
      }))
    );
  }

  return formattedScore;
};
