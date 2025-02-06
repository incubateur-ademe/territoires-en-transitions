import { ActionTypeIncludingExemple } from './models/action-type.enum';
import { referentielIdEnumSchema } from './models/referentiel-id.enum';

export class ReferentielException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReferentielException';
  }
}

export function getReferentielIdFromActionId(actionId: string) {
  const unsafeReferentielId = actionId.split('_')[0];

  const parsing = referentielIdEnumSchema.safeParse(unsafeReferentielId);
  if (parsing.success) {
    return parsing.data;
  }

  throw new ReferentielException(
    `Invalid referentielId ${unsafeReferentielId} for actionId '${actionId}'`
  );
}

export function getAxeFromActionId(actionId: string): number {
  let identifiant = actionId;

  if (actionId.includes('_')) {
    identifiant = actionId.split('_')[1];
  }

  const identifiantParts = identifiant.split('.');
  const axe = parseInt(identifiantParts[0]);

  if (isNaN(axe)) {
    throw new ReferentielException(
      `Invalid actionId '${actionId}', axe not found`
    );
  }

  return axe;
}

export function getActionTypeFromActionId(
  actionId: string,
  orderedActionTypes: ActionTypeIncludingExemple[]
): ActionTypeIncludingExemple {
  const level = getLevelFromActionId(actionId);

  if (level >= orderedActionTypes.length) {
    throw new ReferentielException(
      `Action level ${level} non consistent with referentiel action types: ${orderedActionTypes.join(
        ','
      )}`
    );
  }

  return orderedActionTypes[level];
}

export function getIdentifiantFromActionId(actionId: string): string {
  const actionParts = actionId.split('_');

  if (actionParts.length !== 2) {
    throw new ReferentielException(
      `Invalid actionId '${actionId}', identifiant not found`
    );
  }

  return actionParts[1];
}

export function getLevelFromActionId(actionId: string) {
  const level = actionId.split('.').length;
  if (level === 1) {
    return actionId.split('_').length === 1 ? 0 : 1;
  }

  return level;
}

export function getParentIdFromActionId(actionId: string): string | null {
  const actionIdParts = actionId.split('.');
  if (actionIdParts.length <= 1) {
    const firstPart = actionIdParts[0];
    const firstPartParts = firstPart.split('_');
    if (firstPartParts.length > 1) {
      return firstPartParts[0];
    } else {
      return null;
    }
  } else {
    return actionIdParts.slice(0, -1).join('.');
  }
}

/**
 * Equivalent to a `reduce` function but for a list of actions and their children.
 */
export function reduceActions<A extends { actionsEnfant?: A[] }, T>(
  actions: A[],
  initialValue: T,
  callbackfn: (previousValue: T, currentValue: A) => T
): T {
  return actions.reduce((previousValue, action) => {
    const newValue = callbackfn(previousValue, action);

    if (action.actionsEnfant && action.actionsEnfant.length > 0) {
      return reduceActions(action.actionsEnfant, newValue, callbackfn);
    }

    return newValue;
  }, initialValue);
}

export function flatMapActionsEnfants<A extends { actionsEnfant?: A[] }>(
  action: A
): A[] {
  return reduceActions([action], [] as A[], (allActionsEnfants, action) => [
    ...allActionsEnfants,
    action,
  ]);
}
