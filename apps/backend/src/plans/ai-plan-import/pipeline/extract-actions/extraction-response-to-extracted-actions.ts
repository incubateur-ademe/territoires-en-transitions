import { Priorite, Statut } from '@tet/domain/plans';
import { frenchDateToIso } from '../../adapters/french-date-to-iso';
import {
  createUnenrichedSousAction,
  ExtractedAction,
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
  partenaires: toNullable(action.partenaires),
  budget: toBudget(action.budget),
  financements: toNullable(action.financements),
  moyensHumains: toNullable(action['moyens humains']),
  priorite: toPriorite(action.priorite),
  dateDebut: frenchDateToIso(action['date de debut']),
  dateFin: frenchDateToIso(action['date de fin']),
  statut: toStatut(action.statut),
  confidence: null,
  sousActions: action['sous-actions']
    .map(createUnenrichedSousAction)
    .filter((sousAction) => sousAction.titre.length > 0),
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

const toPriorite = (value: '' | Priorite): Priorite | null =>
  value === '' ? null : value;
