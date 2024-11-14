import { useMutation, useQueryClient } from 'react-query';
import { FicheAction, FicheActionNote } from '@tet/api/plan-actions';
import { useApiClient } from 'core-logic/api/useApiClient';

export type EditedNote = Pick<FicheActionNote, 'note'> & { year: number };
export type DeletedNote = { year: number };

// renvoie une fonction de modification des notes de suivi
export const useUpsertNoteSuivi = ({
  id: ficheId,
  collectiviteId,
}: Pick<FicheAction, 'id' | 'collectiviteId'>) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation(
    async ({ note, year }: EditedNote) => {
      return api.put({
        route: `/collectivites/${collectiviteId}/fiches-action/${ficheId}/notes`,
        params: {
          notes: [{ note, dateNote: new Date(`${year}-01-01`).toISOString() }],
        },
      });
    },
    {
      mutationKey: 'update_note_suivi',
      onSuccess: () => {
        queryClient.invalidateQueries(['fiche_action', ficheId.toString()]);
        queryClient.invalidateQueries([
          'fiche_action_notes_suivi',
          collectiviteId,
          ficheId,
        ]);
      },
    }
  );
};

// renvoie une fonction de suppression d'une note de suivi
export const useDeleteNoteSuivi = ({
  id: ficheId,
  collectiviteId,
}: Pick<FicheAction, 'id' | 'collectiviteId'>) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation(
    async ({ year }: DeletedNote) => {
      return api.delete({
        route: `/collectivites/${collectiviteId}/fiches-action/${ficheId}/note`,
        params: { dateNote: new Date(`${year}-01-01`).toISOString() },
      });
    },
    {
      mutationKey: 'delete_note_suivi',
      onSuccess: () => {
        queryClient.invalidateQueries(['fiche_action', ficheId.toString()]);
        queryClient.invalidateQueries([
          'fiche_action_notes_suivi',
          collectiviteId,
          ficheId,
        ]);
      },
    }
  );
};
