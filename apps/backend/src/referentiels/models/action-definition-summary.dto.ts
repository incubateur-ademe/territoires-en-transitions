import {
  ActionCategorie,
  ActionType,
  ReferentielId,
} from '@tet/domain/referentiels';

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
  discussionsCount: number;
  preuvesCount: number;
};
