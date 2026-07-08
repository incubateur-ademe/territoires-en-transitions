import {
  createUnenrichedSousAction,
  ExtractedAction,
} from '../../models/extracted-action';
import { ConsolidationEntry } from './consolidate-actions.schema';

export const updateActionsWithConsolidatedEntries = (
  actions: ExtractedAction[],
  entries: ConsolidationEntry[]
): ExtractedAction[] => {
  const entryByIndex = new Map(entries.map((entry) => [entry.index, entry]));
  return actions.map((action, index) => {
    const entry = entryByIndex.get(index);
    return entry
      ? updateLowQualityActionWithConsolidatedEntry(action, entry)
      : action;
  });
};

const updateLowQualityActionWithConsolidatedEntry = (
  action: ExtractedAction,
  entry: ConsolidationEntry
): ExtractedAction => ({
  ...action,
  titre: entry.titre.trim(),
  description: entry.description.trim() || null,
  sousActions: entry['sous-actions']
    .map(createUnenrichedSousAction)
    .filter((sousAction) => sousAction.titre.length > 0),
  confidence:
    action.confidence === null
      ? null
      : { ...action.confidence, amelioree: true },
});
