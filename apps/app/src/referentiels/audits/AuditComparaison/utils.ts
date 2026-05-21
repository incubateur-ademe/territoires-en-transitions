import { divisionOrZero } from '@tet/domain/utils';
import { TScoreAuditRowData } from './types';

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
      ...scoreData.map((d) => ({
        [indexBy]: `${d.actionId.split('_')[1]}`,
        'Avant audit':
          divisionOrZero(
            d.preAudit.score.pointFait,
            d.preAudit.score.pointPotentiel
          ) * 100,
        'Après audit':
          divisionOrZero(
            d.courant.score.pointFait,
            d.courant.score.pointPotentiel
          ) * 100,
      }))
    );

    // Calcul des scores totaux
    formattedScore.push({
      [indexBy]: 'Total',
      'Avant audit':
        (scoreData.reduce(
          (res, currVal) => res + (currVal.preAudit.score.pointFait || 0),
          0
        ) /
          (scoreData.reduce(
            (res, currVal) =>
              res + (currVal.preAudit.score.pointPotentiel || 0),
            0
          ) || 1)) *
        100,
      'Après audit':
        (scoreData.reduce(
          (res, currVal) => res + (currVal.courant.score.pointFait || 0),
          0
        ) /
          (scoreData.reduce(
            (res, currVal) => res + (currVal.courant.score.pointPotentiel || 0),
            0
          ) || 1)) *
        100,
    });
  } else {
    // Formate les scores en points
    formattedScore.push(
      ...scoreData.map((d) => ({
        [indexBy]: `${d.actionId.split('_')[1]}`,
        'Avant audit': d.preAudit.score.pointFait,
        'Après audit': d.courant.score.pointFait,
      }))
    );
  }

  return formattedScore;
};
