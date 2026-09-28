import { Statut } from '@tet/domain/plans';
import { frenchDateToIso } from '../../adapters/french-date-to-iso';
import {
  ExtractedAction,
  ExtractedSousAction,
} from '../../models/extracted-action';
import { EnrichmentEntry } from './enrich-sous-actions.schema';
import { IndexedSousAction } from './index-sous-actions';

export const applyEnrichments = (
  actions: ExtractedAction[],
  indexed: IndexedSousAction[],
  entries: EnrichmentEntry[]
): ExtractedAction[] => {
  const entryByIndex = new Map(entries.map((entry) => [entry.index, entry]));
  const enrichmentByPosition = new Map(
    indexed
      .map((item) => ({ item, entry: entryByIndex.get(item.index) }))
      .filter(isEnriched)
      .map(({ item, entry }) => [
        positionKey(item.actionIndex, item.sousActionIndex),
        entry,
      ])
  );

  return actions.map((action, actionIndex) => ({
    ...action,
    sousActions: action.sousActions.map((sousAction, sousActionIndex) => {
      const entry = enrichmentByPosition.get(
        positionKey(actionIndex, sousActionIndex)
      );
      return entry ? enrichSousAction(sousAction, entry) : sousAction;
    }),
  }));
};

type EnrichedPosition = { item: IndexedSousAction; entry: EnrichmentEntry };

const isEnriched = (pair: {
  item: IndexedSousAction;
  entry: EnrichmentEntry | undefined;
}): pair is EnrichedPosition => pair.entry !== undefined;

const positionKey = (actionIndex: number, sousActionIndex: number): string =>
  `${actionIndex}:${sousActionIndex}`;

const enrichSousAction = (
  sousAction: ExtractedSousAction,
  entry: EnrichmentEntry
): ExtractedSousAction => ({
  ...sousAction,
  description: toNullable(entry.description),
  personnePilote: toNullable(entry.personne_pilote),
  statut: toStatut(entry.statut),
  dateDebut: frenchDateToIso(entry.date_debut),
  dateFin: frenchDateToIso(entry.date_fin),
});

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toStatut = (value: '' | Statut): Statut | null =>
  value === '' ? null : value;
