import { createOptimisticAction } from '@tanstack/react-db';
import {
  ActionId,
  ListActionsDynamicStateResult,
} from '@tet/domain/referentiels';
import { ActionStatesCollection } from './action-states.collection';

type UpdateExplicationInput = {
  actionId: ActionId;
  collectiviteId: number;
  commentaire: string;
};

/**
 * Remplace l'explication d'une action dans la réponse brute de
 * `listActionsGroupedById`. Réponse inchangée si l'action n'y est pas.
 */
export function patchActionExplication(
  response: ListActionsDynamicStateResult | undefined,
  actionId: ActionId,
  commentaire: string
): ListActionsDynamicStateResult | undefined {
  const action = response?.actionsById[actionId];
  if (!response || !action) return response;
  return {
    ...response,
    actionsById: {
      ...response.actionsById,
      [actionId]: {
        ...action,
        score: { ...action.score, explication: commentaire },
      },
    },
  };
}

/**
 * Enregistre l'explication (commentaire) d'une action, avec mise à jour
 * optimiste de la collection de l'état : le nouveau texte s'affiche tout de
 * suite, et il est annulé automatiquement si `save` échoue.
 *
 * Pas de rechargement de l'état en cas de succès : le commentaire n'a pas
 * d'effet sur les scores. La valeur enregistrée est écrite dans le cache brut
 * de `listActionsGroupedById` (`patchStateCache`), que la collection observe :
 * les deux restent alignés, et les autres écritures de ce cache (renommage
 * d'un service…) ne ramènent pas l'ancien commentaire. En cas d'erreur,
 * l'état est rechargé : le commentaire peut avoir été enregistré malgré
 * l'échec (recalcul du snapshot).
 *
 * Si l'action n'est pas (encore) dans la collection, enregistre sans mise à
 * jour optimiste.
 */
export async function updateActionExplicationOptimistically(
  states: ActionStatesCollection,
  input: UpdateExplicationInput,
  {
    save,
    patchStateCache,
  }: {
    save: (input: UpdateExplicationInput) => Promise<{ commentaire: string }>;
    patchStateCache: (commentaire: string) => void;
  }
): Promise<void> {
  if (!states.has(input.actionId)) {
    const { commentaire } = await save(input);
    patchStateCache(commentaire);
    return;
  }

  const updateExplication = createOptimisticAction<UpdateExplicationInput>({
    onMutate: ({ actionId, commentaire }) => {
      states.update(actionId, (draft) => {
        draft.score.explication = commentaire;
      });
    },
    mutationFn: async (variables) => {
      const { commentaire } = await save(variables);
      // la collection reprend la valeur du cache avant que l'optimisme soit
      // levé : pas de clignotement. Pas de `writeUpdate` : après une écriture
      // directe, la collection ignorerait les autres écritures de ce cache.
      patchStateCache(commentaire);
    },
  });

  try {
    await updateExplication(input).isPersisted.promise;
  } catch (error) {
    // l'échec du rechargement ne doit pas masquer l'erreur d'origine
    await states.utils.refetch().catch(() => undefined);
    throw error;
  }
}
