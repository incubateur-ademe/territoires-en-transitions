'use client';

import { type ActionDetailed } from '@/app/referentiels/use-snapshot';

/**
 * Recursively extracts all actionId and nom properties from actionsEnfant
 */
export const getActionsAndSubActionsIdIdentifiantAndName = (
  actionNode: ActionDetailed | undefined
): Array<{ actionId: string; identifiant: string; nom: string }> => {
  if (!actionNode) return [];

  const result: Array<{
    actionId: string;
    identifiant: string;
    nom: string;
  }> = [];

  // Add current action if it has actionId and nom from action and sous-action
  if (
    (actionNode.actionType === 'action' ||
      actionNode.actionType === 'sous-action') &&
    actionNode.actionId &&
    actionNode.nom
  ) {
    result.push({
      actionId: actionNode.actionId,
      identifiant: actionNode.identifiant,
      nom: actionNode.nom,
    });
  }

  // Recursively process all children
  if (actionNode.actionsEnfant && Array.isArray(actionNode.actionsEnfant)) {
    actionNode.actionsEnfant.forEach((enfant: any) => {
      result.push(...getActionsAndSubActionsIdIdentifiantAndName(enfant));
    });
  }

  return result;
};
