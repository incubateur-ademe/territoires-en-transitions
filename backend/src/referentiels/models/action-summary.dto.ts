import { ActionCategorie } from './action-definition.table';
import { ActionTypeEnum } from './action-type.enum';
import { ReferentielId } from './referentiel-id.enum';

export type ActionSummary = {
  id: string;
  referentiel: ReferentielId;
  children: string[];
  depth: number;
  type: ActionTypeEnum;
  identifiant: string;
  nom: string;
  description: string;
  haveContexte: boolean;
  haveExemples: boolean;
  haveRessources: boolean;
  havePerimetreEvaluation: boolean;
  haveQuestions: boolean;
  haveScoreIndicatif: boolean;
  phase: ActionCategorie | null;
};
