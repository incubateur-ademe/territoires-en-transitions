import {
  axisPathOf,
  ExtractedAction,
  withAxisPath,
} from '../../models/extracted-action';
import { titlesMatch } from '../extract-actions/similar-titles';

/**
 * Retire le dernier niveau d'axe quand il ne contient qu'une action portant
 * son titre : c'est l'action lue deux fois (sommaire, bandeau), pas un niveau
 * du plan. Le premier niveau reste toujours. Ordre et nombre des actions sont
 * conservés.
 */
export const dropRedundantSousAxes = (
  actions: ExtractedAction[]
): ExtractedAction[] => {
  // Un niveau compte tout ce qu'il contient, niveaux inférieurs compris : un
  // niveau qui en porte d'autres n'est pas un écho de l'action.
  const countByPath = new Map<string, number>();
  for (const action of actions) {
    const segments = segmentsOf(action);
    for (let length = 2; length <= segments.length; length++) {
      if (segments[length - 1]) {
        const key = segments.slice(0, length).join('|');
        countByPath.set(key, (countByPath.get(key) ?? 0) + 1);
      }
    }
  }
  return actions.map((action) => {
    const segments = segmentsOf(action);
    const last = segments[segments.length - 1];
    if (
      segments.length < 2 ||
      !last ||
      countByPath.get(segments.join('|')) !== 1 ||
      !titlesMatch(last, action.titre)
    ) {
      return action;
    }
    return action.cheminAxes
      ? withAxisPath(action, segments.slice(0, -1))
      : { ...action, sousAxe: '' };
  });
};

// Sans chemin complet, seul le sous-axe se retire, même sous un axe vide.
const segmentsOf = (action: ExtractedAction): string[] =>
  action.cheminAxes
    ? axisPathOf(action)
    : [action.axe.trim(), action.sousAxe.trim()];
