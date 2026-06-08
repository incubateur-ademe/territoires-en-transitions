import { Statut } from '@tet/domain/plans';
import {
  ExtractedAction,
  ExtractedSousAction,
} from '../../models/extracted-action';
import { ExtractionAction, ExtractionResponse } from './extract-actions.schema';

export const extractionResponseToExtractedActions = (
  response: ExtractionResponse
): ExtractedAction[] => response.map(toExtractedAction);

const toExtractedAction = (action: ExtractionAction): ExtractedAction => ({
  axe: action.axe,
  sousAxe: action['sous-axe'],
  titre: action.titre,
  description: toNullable(action.description),
  objectifs: toNullable(action.objectifs),
  structurePilote: toNullable(action['structure pilote']),
  directionServicePilote: toNullable(action['direction ou service pilote']),
  personnePilote: toNullable(action['personne pilote']),
  budget: toBudget(action.budget),
  statut: toStatut(action.statut),
  confidence: null,
  sousActions: action['sous-actions']
    .map(toSousAction)
    .filter((sousAction) => sousAction.titre.length > 0),
});

const toSousAction = (titre: string): ExtractedSousAction => ({
  titre: titre.trim(),
  description: null,
  personnePilote: null,
  statut: null,
  dateDebut: null,
  dateFin: null,
});

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toBudget = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toStatut = (value: '' | Statut): Statut | null =>
  value === '' ? null : value;
