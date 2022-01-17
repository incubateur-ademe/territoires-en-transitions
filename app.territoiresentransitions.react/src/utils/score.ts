import {ActionScore} from 'types/ClientScore';
import {toFixed} from 'utils/toFixed';

export const computeScoreAvancementPercentage = (
  score: ActionScore,
  point_avancement:
    | 'point_fait'
    | 'point_pas_fait'
    | 'point_programme'
    | 'point_non_renseigne'
    | 'point_non_concerne'
): number => {
  if (!score) return 0;
  const maxPoints = Math.max(score?.point_potentiel, score?.point_referentiel);
  if (point_avancement === 'point_non_concerne') {
    return toFixed(((maxPoints - score.point_potentiel) / maxPoints) * 100);
  }
  return toFixed((score[point_avancement] / maxPoints) * 100);
};

export const getNonConcernePoint = (score: ActionScore) =>
  Math.max(score.point_referentiel - score.point_potentiel, 0);
