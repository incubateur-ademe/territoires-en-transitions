import { z } from 'zod';
import { ExtractedAction } from '../../models/extracted-action';
import { mergeActions } from '../extract-actions/merge-chunk-actions';

export const hierarchyEntrySchema = z.object({
  index: z.number().int(),
  axe: z.string(),
  'sous-axe': z.string(),
  /** Index de la première occurrence de la même action, -1 sinon. */
  doublonDe: z.number().int(),
});

export const hierarchyResponseSchema = z.array(hierarchyEntrySchema);

export type HierarchyEntry = z.output<typeof hierarchyEntrySchema>;

export type HierarchyOutcome = {
  actions: ExtractedAction[];
  /** Pour chaque action conservée, son index d'avant : les tranches suivent. */
  keptIndexes: number[];
};

/**
 * Applique les rattachements et fusionne les doublons. Une action que le
 * modèle a oubliée garde son axe : c'est lui qui résume, pas nous.
 */
export const applyHierarchy = (
  actions: ExtractedAction[],
  entries: HierarchyEntry[]
): HierarchyOutcome => {
  const entryByIndex = new Map(entries.map((entry) => [entry.index, entry]));

  const targetOf = new Map<number, number>();
  actions.forEach((_, index) => {
    const target = entryByIndex.get(index)?.doublonDe ?? -1;
    if (target >= 0 && target < index && target !== index) {
      targetOf.set(index, resolveTarget(target, targetOf));
    }
  });
  // Fusionner d'abord, rattacher ensuite : le rattachement décidé pour
  // l'action conservée prime sur ce que son doublon portait.
  const merged = [...actions];
  for (const [index, target] of targetOf) {
    merged[target] = mergeActions(merged[target], merged[index]);
  }

  const keptIndexes = actions
    .map((_, index) => index)
    .filter((index) => !targetOf.has(index));
  return {
    actions: keptIndexes.map((index) => {
      const entry = entryByIndex.get(index);
      const action = merged[index];
      // Un axe vide : le modèle n'a pas su rattacher, l'origine reste. Un axe
      // avec un sous-axe vide : l'axe n'a pas de sous-axe, c'est voulu.
      return entry && entry.axe.trim()
        ? {
            ...action,
            axe: entry.axe.trim(),
            sousAxe: entry['sous-axe'].trim(),
          }
        : action;
    }),
    keptIndexes,
  };
};

// Un doublon d'un doublon rejoint l'action d'origine.
const resolveTarget = (target: number, targetOf: Map<number, number>): number =>
  targetOf.has(target)
    ? resolveTarget(targetOf.get(target) as number, targetOf)
    : target;
