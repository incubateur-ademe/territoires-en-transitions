import {TScoreAuditRowData} from './types';

/**
 * Met en forme les scores pour les graphes de comparaison avant / après audit
 */

export const getFormattedScore = (
  scoreData: readonly TScoreAuditRowData[],
  indexBy: string,
  percentage: boolean
) => {
  const formattedScore = [];

  if (percentage) {
    // Formate les scores (%) pour un affichage sur 100
    formattedScore.push(
      ...scoreData.map(d => ({
        [indexBy]: `${d.action_id.split('_')[1]}`,
        'Avant audit': (d.pre_audit.score_realise || 0) * 100,
        'Après audit': (d.courant.score_realise || 0) * 100,
      }))
    );

    // Calcul des scores totaux
    formattedScore.push({
      [indexBy]: 'Total',
      'Avant audit':
        (scoreData.reduce(
          (res, currVal) => res + (currVal.pre_audit.points_realises || 0),
          0
        ) /
          (scoreData.reduce(
            (res, currVal) =>
              res + (currVal.pre_audit.points_max_personnalises || 0),
            0
          ) || 1)) *
        100,
      'Après audit':
        (scoreData.reduce(
          (res, currVal) => res + (currVal.courant.points_realises || 0),
          0
        ) /
          (scoreData.reduce(
            (res, currVal) =>
              res + (currVal.courant.points_max_personnalises || 0),
            0
          ) || 1)) *
        100,
    });
  } else {
    // Formate les scores en points
    formattedScore.push(
      ...scoreData.map(d => ({
        [indexBy]: `${d.action_id.split('_')[1]}`,
        'Avant audit': d.pre_audit.points_realises,
        'Après audit': d.courant.points_realises,
      }))
    );
  }

  return formattedScore;
};
