import { ExtractedAction } from '../../models/extracted-action';
import { titlesMatch } from '../extract-actions/similar-titles';

/**
 * Retire un sous-axe qui ne contient qu'une action portant son titre : c'est
 * l'action lue deux fois (sommaire, bandeau), pas un niveau du plan. Ordre et
 * nombre des actions sont conservés.
 */
export const dropRedundantSousAxes = (
  actions: ExtractedAction[]
): ExtractedAction[] => {
  const countBySousAxe = new Map<string, number>();
  for (const action of actions) {
    if (action.sousAxe.trim()) {
      const key = sousAxeKey(action);
      countBySousAxe.set(key, (countBySousAxe.get(key) ?? 0) + 1);
    }
  }
  return actions.map((action) =>
    action.sousAxe.trim() &&
    countBySousAxe.get(sousAxeKey(action)) === 1 &&
    titlesMatch(action.sousAxe, action.titre)
      ? { ...action, sousAxe: '' }
      : action
  );
};

const sousAxeKey = (action: ExtractedAction): string =>
  `${action.axe.trim()}|${action.sousAxe.trim()}`;
