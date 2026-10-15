import {
  ActionId,
  ListActionsDynamicStateResult,
} from '@tet/domain/referentiels';

/**
 * Met à jour l'explication (commentaire) d'une action dans le cache
 * `listActionsGroupedById`, pour la mise à jour optimiste du commentaire.
 */
export function patchActionExplicationInCache(
  old: ListActionsDynamicStateResult | undefined,
  actionId: ActionId,
  commentaire: string
): ListActionsDynamicStateResult | undefined {
  if (!old) return old;
  const action = old.actionsById[actionId];
  if (!action) return old;
  return {
    ...old,
    actionsById: {
      ...old.actionsById,
      [actionId]: {
        ...action,
        score: {
          ...action.score,
          explication: commentaire,
        },
      },
    },
  };
}
