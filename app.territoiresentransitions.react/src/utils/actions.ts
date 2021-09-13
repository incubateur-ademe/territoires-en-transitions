import {ActionReferentiel} from 'generated/models/action_referentiel';

export const flattenActions = (
  actions: ActionReferentiel[],
  recursive: boolean
): ActionReferentiel[] => {
  const flattened: ActionReferentiel[] = [];
  for (const action of actions) {
    flattened.push(...action.actions);
    if (recursive) flattened.push(...flattenActions(action.actions, true));
  }

  return flattened;
};

export const actionsById = (
  actions: ActionReferentiel[]
): Map<string, ActionReferentiel> => {
  const results = new Map<string, ActionReferentiel>();
  const append = (actions: ActionReferentiel[]) => {
    for (const action of actions) {
      results.set(action.id, action);
      append(action.actions);
    }
  };
  append(actions);

  return results;
};

export const searchActionById = (
  actionId: string,
  actions: ActionReferentiel[]
): ActionReferentiel | null => {
  for (const action of actions) {
    if (actionId === action.id) return action;
    if (actionId.startsWith(action.id))
      return searchActionById(actionId, action.actions);
  }
  return null;
};

export const searchActionSiblingsOfId = (
  actionId: string,
  actions: ActionReferentiel[]
): ActionReferentiel[] | null => {
  for (const action of actions) {
    if (actionId === action.id) return actions;
    if (actionId.startsWith(action.id))
      return searchActionSiblingsOfId(actionId, action.actions);
  }
  return null;
};

/**
 * Returns a list of parents ordered from top (root) to bottom.
 *
 * @param actionId id we search for
 * @param actions actions tree to search in
 */
export const searchParents = (
  actionId: string,
  actions: ActionReferentiel[]
): ActionReferentiel[] => {
  const parents: ActionReferentiel[] = [];

  const search = (actions: ActionReferentiel[]): void => {
    for (const action of actions) {
      if (actionId === action.id) return;
      if (actionId.startsWith(action.id)) {
        parents.push(action);
        return search(action.actions);
      }
    }
  };
  search(actions);
  return parents;
};

export const referentielMesureDepth = (actionId: string): number =>
  actionId.startsWith('economie_circulaire') ? 2 : 3;

export const actionIdDepth = (actionId: string) => {
  const [, action] = actionId.split('__');
  if (action) return action.split('.').length;
  return 0;
};

export const parentId = (actionId: string): string | null => {
  const elements = actionId.split('.');
  if (elements.length === 1) return null;
  elements.pop();
  return elements.join('.');
};

export const displayName = (action: ActionReferentiel) =>
  action.id_nomenclature
    ? `${action.id_nomenclature} - ${action.nom}`
    : action.nom;

export const referentielId = (actionId: string): string =>
  actionId.startsWith('economie_circulaire') ? 'eci' : 'cae';
