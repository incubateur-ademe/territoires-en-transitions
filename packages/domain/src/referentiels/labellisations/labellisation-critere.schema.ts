import { Etoile } from './labellisation-etoile.enum.schema';

/** Critère lié au score de la collectivité pour un référentiel */
export type LabellisationCritere = {
  atteint: boolean;
  etoiles: Etoile;
  scoreFait: number;
  scoreARealiser: number;
};
