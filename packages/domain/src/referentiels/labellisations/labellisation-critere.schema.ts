import { Etoile } from './labellisation-etoile.enum.schema';

/** Critère lié au score de la collectivité pour un référentiel */
export type LabellisationCritere = {
  atteint: boolean;
  etoiles: Etoile;
  score_fait: number;
  score_a_realiser: number;
};
