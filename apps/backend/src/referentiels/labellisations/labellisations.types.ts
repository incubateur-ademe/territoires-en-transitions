import { Etoile } from './etoile-definition.table';

/** Critère lié au score de la collectivité pour un référentiel */
export type TCritereScore = {
  atteint: boolean;
  etoiles: Etoile;
  score_fait: number;
  score_a_realiser: number;
};
