import { createOptimisticAction } from '@tanstack/react-db';
import { ActionId } from '@tet/domain/referentiels';
import { ActionStatesCollection } from './action-states.collection';

type UpdateExplicationInput = {
  actionId: ActionId;
  collectiviteId: number;
  commentaire: string;
};

/**
 * Enregistre l'explication (commentaire) d'une action, avec mise à jour
 * optimiste de la collection de l'état : le nouveau texte s'affiche tout de
 * suite, et il est annulé automatiquement si `save` échoue.
 *
 * Pas de rechargement de l'état en cas de succès : le commentaire n'a pas
 * d'effet sur les scores, on écrit seulement la valeur enregistrée dans la
 * collection (et donc dans le cache de `listActionsGroupedById`). En cas
 * d'erreur, l'état est rechargé : le commentaire peut avoir été enregistré
 * malgré l'échec (recalcul du snapshot).
 *
 * Si l'action n'est pas (encore) dans la collection, enregistre sans mise à
 * jour optimiste.
 */
export async function updateActionExplicationOptimistically(
  states: ActionStatesCollection,
  input: UpdateExplicationInput,
  save: (input: UpdateExplicationInput) => Promise<{ commentaire: string }>
): Promise<void> {
  if (!states.has(input.actionId)) {
    await save(input);
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
      const row = states.get(variables.actionId);
      if (row) {
        // état serveur aligné avant de lever l'optimisme : pas de clignotement
        await states.utils.writeUpdate({
          actionId: row.actionId,
          score: { ...row.score, explication: commentaire },
        });
      }
    },
  });

  try {
    await updateExplication(input).isPersisted.promise;
  } catch (error) {
    await states.utils.refetch();
    throw error;
  }
}
