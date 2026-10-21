import { getActionKey } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.rules';
import {
  ImportActionInput,
  ImportActionOrSousAction,
  ImportSousActionInput,
  LIST_ITEM_SEPARATOR,
} from '@tet/backend/plans/plans/import-plan-aggregate/schemas/import-action.input';
import { uniqBy } from 'es-toolkit';
import {
  axisPathOf,
  ExtractedAction,
  ExtractedSousAction,
} from '../models/extracted-action';
import { stripTitleNumbers, unifyAxisLabels } from './normalize-plan-labels';
import { removeDuplicatedContent } from './remove-duplicated-content';
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
  uniqBy(actions, (action) => getActionKey(action.titre, toAxisPath(action)));

export type NormalizedExtractedActions = {
  actions: ExtractedAction[];
  truncatedCount: number;
  duplicateCount: number;
  /** Lignes de description qui répétaient un autre champ, ou un libellé seul. */
  removedDescriptionLines: number;
  /** Sous-actions qui reprenaient un objectif de leur fiche. */
  removedObjectifSousActions: number;
};

export const normalizeExtractedActions = (
  extracted: ExtractedAction[]
): NormalizedExtractedActions => {
  const actions = unifyAxisLabels(extracted);
  const truncatedCount = countOverlongTitles(actions);
  const capped = capExtractedActionTitles(actions);
  // Dédoublonné sur les titres encore numérotés : « Fiche 3 » et « Fiche 7 »
  // de même intitulé sont deux fiches.
  const deduped = dedupeExtractedActions(capped);
  const cleaned = removeDuplicatedContent(stripTitleNumbers(deduped));
  return {
    actions: cleaned.actions,
    truncatedCount,
    duplicateCount: capped.length - deduped.length,
    removedDescriptionLines: cleaned.descriptionLines,
    removedObjectifSousActions: cleaned.sousActions,
  };
};

export const extractedActionToImportActions = (
  action: ExtractedAction
): ImportActionOrSousAction[] => {
  const axisPath = toAxisPath(action);
  // Une sous-action relève des secteurs et des effets attendus de son action :
  // le modèle les a choisis en lisant l'action avec ses sous-actions.
  const proposes = {
    secteursProposes: action.secteurs,
    effetsAttendus: action.effetsAttendus,
  };
  return [
    { ...actionToImport(action, axisPath), ...proposes },
    ...action.sousActions.map((sousAction) => ({
      ...sousActionToImport(sousAction, action.titre, axisPath),
      ...proposes,
    })),
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

const toAxisPath = (action: ExtractedAction): string[] | undefined => {
  const segments = axisPathOf(action);
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
