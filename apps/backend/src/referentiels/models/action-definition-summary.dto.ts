import { ActionCategorie } from './action-definition.table';
import { ActionType } from './action-type.enum';
import { ReferentielId } from './referentiel-id.enum';

export type ActionDefinitionSummary = {
  id: string;
  referentiel: ReferentielId;
  children: string[];
  depth: number;
  type: ActionType;
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
