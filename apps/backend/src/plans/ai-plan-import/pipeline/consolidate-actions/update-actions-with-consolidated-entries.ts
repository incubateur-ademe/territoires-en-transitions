import {
  createUnenrichedSousAction,
  ExtractedAction,
  isPinnedAction,
} from '../../models/extracted-action';
import { uniqBy } from 'es-toolkit';
import { normalizeTitle } from '../extract-actions/merge-chunk-actions';
import { ConsolidationEntry } from './consolidate-actions.schema';

export const updateActionsWithConsolidatedEntries = (
  actions: ExtractedAction[],
  entries: ConsolidationEntry[]
): ExtractedAction[] => {
  const entryByIndex = new Map(entries.map((entry) => [entry.index, entry]));
  return actions.map((action, index) => {
    const entry = entryByIndex.get(index);
    return entry && !isPinnedAction(action)
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
  objectifs: mergeObjectifs(action.objectifs, entry.objectifs),
  sousActions: entry['sous-actions']
    .map(createUnenrichedSousAction)
    .filter((sousAction) => sousAction.titre.length > 0),
  confidence:
    action.confidence === null
      ? null
      : { ...action.confidence, amelioree: true },
});

/**
 * La consolidation relit la fiche pour retrouver ce que l'extraction a manqué :
 * ses objectifs s'ajoutent à ceux déjà relevés, sans doublon, jamais à leur place.
 */
const mergeObjectifs = (
  current: string | null,
  consolidated: string | undefined
): string | null => {
  const lines = [current ?? '', consolidated ?? '']
    .flatMap((text) => text.split('\n'))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const merged = uniqBy(lines, (line) =>
    normalizeTitle(line.replace(/^-\s*/, ''))
  );
  return merged.length === 0 ? null : merged.join('\n');
};
