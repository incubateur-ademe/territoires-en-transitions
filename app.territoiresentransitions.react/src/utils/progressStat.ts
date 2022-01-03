import {ActionScore} from 'types/ClientScore';

export type ProgressState =
  | 'non_renseigne'
  | 'nc'
  | 'alert'
  | 'warning'
  | 'ok'
  | 'good'
  | 'best';

export const inferStateFromScore = (
  score: ActionScore | null
): ProgressState => {
  if (score === null || score.point_fait === null) return 'non_renseigne';
  const percentage: number = (score.point_fait / score.point_potentiel) * 100;
  if (!score.concerne) {
    return 'nc';
  } else if (percentage < 34) {
    return 'alert';
  } else if (percentage < 49) {
    return 'warning';
  } else if (percentage < 64) {
    return 'ok';
  } else if (percentage < 74) {
    return 'good';
  } else {
    return 'best';
  }
};

const approxEqual = (a: number, b: number) => Math.abs(a - b) < 0.0001;

export const toFixed = (n: number) => {
  if (approxEqual(Math.round(n), n)) return n.toFixed(0);
  else if (approxEqual(Math.round(n * 10), n * 10)) return n.toFixed(1);
  else return n.toFixed(2);
};

export const percentageTextFromScore = (score: ActionScore | null) =>
  score && score.point_fait
    ? `${toFixed((score.point_fait / score.point_potentiel) * 100)}% `
    : '0% ';

export const pointsTextFromScore = (score: ActionScore | null) => {
  if (!score) return null;
  const textPoints = score.point_fait ? toFixed(score.point_fait) : '..';
  const textPotentiel = score.point_potentiel
    ? toFixed(score.point_potentiel)
    : '..';
  return `(${textPoints}/${textPotentiel})`;
};
