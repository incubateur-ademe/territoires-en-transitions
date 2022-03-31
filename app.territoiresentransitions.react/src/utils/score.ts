import {ActionScore} from 'types/ClientScore';

export const getNonConcernePoint = (score: ActionScore) =>
  Math.max(score.point_referentiel - score.point_potentiel, 0);

export const toPercentString = (value: number) => `${Math.round(value * 100)}%`;
