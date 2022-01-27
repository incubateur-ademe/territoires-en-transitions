import {Referentiel} from 'types/litterals';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionTitleRead} from 'core-logic/api/endpoints/ActionTitleReadEndpoint';

/**
 * Search for the siblings of an action in the action list.
 * The returned list of siblings *includes* the action.
 *
 * @param action one of the siblings
 * @param actions list containing the siblings
 */
export function findActionSiblingsOfId<
  T extends ActionDefinitionSummary | ActionTitleRead
>(action: T, actions: T[]): T[] {
  if (action.type === 'referentiel') {
    return actions.filter(a => a.type === 'referentiel');
  }

  const parent = findParent(action, actions)!;
  return findChildren<T>(parent, actions) ?? [];
}

/**
 * Search for the children of action in the action list.
 *
 * @param action parent action
 * @param actions list containing children
 */
export function findChildren<
  T extends ActionDefinitionSummary | ActionTitleRead
>(action: T, actions: T[]): T[] {
  return actions.filter(a => action.children.includes(a.id));
}

/**
 * Search for the parent of a given action amongst actions.
 * @param action
 * @param actions
 */
export function findParent<T extends ActionDefinitionSummary | ActionTitleRead>(
  action: T,
  actions: T[]
): T | null {
  return actions.find(a => a.children.includes(action.id)) ?? null;
}

/**
 * Returns a list of parents ordered from top (root) to bottom.
 *
 * @param action the action we are searching the parent of.
 * @param actions list containing the action ancestor.
 */
export function searchAncestors<
  T extends ActionDefinitionSummary | ActionTitleRead
>(action: T, actions: T[]): T[] {
  const parents: T[] = [];
  let parent = findParent(action, actions);

  while (parent !== null) {
    parents.unshift(parent);
    parent = findParent(parent, actions);
  }

  return parents;
}

export const referentielMesureDepth = (actionId: string): number =>
  actionId.startsWith('eci') ? 2 : 3;

export const parentId = (actionId: string): string | null => {
  const elements = actionId.split('.');
  if (elements.length === 1) return null;
  elements.pop();
  return elements.join('.');
};

export const displayName = (
  action: ActionDefinitionSummary | ActionTitleRead
) =>
  action.type === 'referentiel'
    ? referentielDisplayName(action)
    : `${action.identifiant} - ${action.nom}`;

export const referentielId = (actionId: string): Referentiel =>
  actionId.startsWith('eci') ? 'eci' : 'cae';

export const actionPath = (
  collectiviteId: number,
  actionId: string
): string => {
  const elements = actionId.split('.');
  const depth = elements.length;
  const mesureDepth = referentielMesureDepth(actionId);
  const epciPath = `/collectivite/${collectiviteId}`;

  if (depth < mesureDepth) {
    return `${epciPath}/referentiels/${referentielId(actionId)}/#${actionId}`;
  }
  if (depth === mesureDepth) {
    return `${epciPath}/action/${referentielId(actionId)}/${actionId}`;
  }
  while (elements.length > mesureDepth) elements.pop();
  const mesureId = elements.join('.');
  return `${epciPath}/action/${referentielId(actionId)}/${mesureId}`;
};

export const referentielDisplayName = (
  action: ActionDefinitionSummary | ActionTitleRead
): string =>
  action.referentiel === 'cae' ? 'Climat Air Energie' : 'Économie Circulaire';
