import {ScoreRead} from 'generated/dataLayer/client_scores_read';

export type ProgressState =
  | 'non_renseigne'
  | 'nc'
  | 'alert'
  | 'warning'
  | 'ok'
  | 'good'
  | 'best';

export const inferStateFromScore = (score: ScoreRead | null): ProgressState => {
  if (score === null || score.points === null) return 'non_renseigne';
  const percentage: number = (score.points / score.potentiel) * 100;
  if (score.concernee === false) {
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

export const percentageTextFromScore = (score: ScoreRead | null) =>
  score && score.points
    ? `${toFixed((score.points / score.potentiel) * 100)}% `
    : '0% ';

export const pointsTextFromScore = (score: ScoreRead | null) => {
  if (!score) return null;
  const textPoints = score.points ? toFixed(score.points) : '..';
  const textPotentiel = score.potentiel ? toFixed(score.potentiel) : '..';
  return `(${textPoints}/${textPotentiel})`;
};
