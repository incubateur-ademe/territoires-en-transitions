import { getActionKey } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.rules';
import {
  ImportActionInput,
  ImportActionOrSousAction,
  ImportSousActionInput,
  LIST_ITEM_SEPARATOR,
} from '@tet/backend/plans/plans/import-plan-aggregate/schemas/import-action.input';
import { uniqBy } from 'es-toolkit';
import {
  ExtractedAction,
  ExtractedSousAction,
} from '../models/extracted-action';
import { stripTitleNumber, unifyAxisLabels } from './normalize-plan-labels';
import { textToRichText } from './text-to-rich-text';

export const MAX_FICHE_TITLE_LENGTH = 300;

const capTitle = (titre: string): string =>
  titre.length > MAX_FICHE_TITLE_LENGTH
    ? `${titre.slice(0, MAX_FICHE_TITLE_LENGTH - 3)}...`
    : titre;

export const capExtractedActionTitles = (
  actions: ExtractedAction[]
): ExtractedAction[] =>
  actions.map((action) => ({
    ...action,
    titre: capTitle(action.titre),
    sousActions: action.sousActions.map((sousAction) => ({
      ...sousAction,
      titre: capTitle(sousAction.titre),
    })),
  }));

export const countOverlongTitles = (actions: ExtractedAction[]): number =>
  actions
    .flatMap((action) => [
      action.titre,
      ...action.sousActions.map((sousAction) => sousAction.titre),
    ])
    .filter((titre) => titre.length > MAX_FICHE_TITLE_LENGTH).length;

export const dedupeExtractedActions = (
  actions: ExtractedAction[]
): ExtractedAction[] =>
  uniqBy(actions, (action) =>
    getActionKey(action.titre, toAxisPath(action.axe, action.sousAxe))
  );

export type NormalizedExtractedActions = {
  actions: ExtractedAction[];
  truncatedCount: number;
  duplicateCount: number;
};

export const normalizeExtractedActions = (
  extracted: ExtractedAction[]
): NormalizedExtractedActions => {
  const actions = unifyAxisLabels(
    extracted.map((action) => ({
      ...action,
      titre: stripTitleNumber(action.titre) || action.titre,
    }))
  );
  const truncatedCount = countOverlongTitles(actions);
  const capped = capExtractedActionTitles(actions);
  const deduped = dedupeExtractedActions(capped);
  return {
    actions: deduped,
    truncatedCount,
    duplicateCount: capped.length - deduped.length,
  };
};

export const extractedActionToImportActions = (
  action: ExtractedAction
): ImportActionOrSousAction[] => {
  const axisPath = toAxisPath(action.axe, action.sousAxe);
  return [
    actionToImport(action, axisPath),
    ...action.sousActions.map((sousAction) =>
      sousActionToImport(sousAction, action.titre, axisPath)
    ),
  ];
};

const actionToImport = (
  action: ExtractedAction,
  axisPath: string[] | undefined
): ImportActionInput => ({
  axisPath,
  titre: action.titre,
  description: action.description
    ? textToRichText(action.description)
    : undefined,
  gouvernance: undefined,
  objectifs: action.objectifs ? textToRichText(action.objectifs) : undefined,
  resources: action.moyensHumains ?? undefined,
  financements: action.financements ?? undefined,
  notesComplementaire: undefined,
  participationCitoyenne: undefined,
  budget: action.budget ?? undefined,
  instanceGouvernance: [],
  dateDebut: toDate(action.dateDebut),
  dateFin: toDate(action.dateFin),
  structures: toList(action.structurePilote),
  partenaires: toList(action.partenaires),
  services: toList(action.directionServicePilote),
  priorite: action.priorite ?? undefined,
  participation: undefined,
  cible: undefined,
  status: action.statut ?? undefined,
  pilotes: toList(action.personnePilote),
  referents: [],
  financeurs: [],
  indicateurs: undefined,
});

const sousActionToImport = (
  sousAction: ExtractedSousAction,
  parentActionTitre: string,
  axisPath: string[] | undefined
): ImportSousActionInput => ({
  axisPath,
  sousTitreAction: null,
  titre: sousAction.titre,
  parentActionTitre,
  description: sousAction.description ?? undefined,
  gouvernance: undefined,
  objectifs: undefined,
  resources: undefined,
  financements: undefined,
  notesComplementaire: undefined,
  participationCitoyenne: undefined,
  budget: undefined,
  instanceGouvernance: [],
  dateDebut: toDate(sousAction.dateDebut),
  dateFin: toDate(sousAction.dateFin),
  structures: [],
  partenaires: [],
  services: [],
  priorite: undefined,
  participation: undefined,
  cible: undefined,
  status: sousAction.statut ?? undefined,
  pilotes: toList(sousAction.personnePilote),
  referents: [],
  financeurs: [],
  indicateurs: undefined,
});

const toAxisPath = (axe: string, sousAxe: string): string[] | undefined => {
  const segments = [axe, sousAxe]
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  return segments.length > 0 ? segments : undefined;
};

// Même convention que l'import Excel (listSchema) : une liste séparée par des
// virgules, sans couper « DDT (unité eau, forêt) » ni un nom entre guillemets.
const toList = (value: string | null): string[] => {
  if (!value) {
    return [];
  }
  return value
    .split(LIST_ITEM_SEPARATOR)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const toDate = (value: string | null): Date | undefined =>
  value === null ? undefined : new Date(value);
