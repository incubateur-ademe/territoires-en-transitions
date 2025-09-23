import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { Fiche, FicheActionNote } from '@/domain/plans/fiches';
import { useNPSSurveyManager } from '@/ui/components/tracking/use-nps-survey-manager';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type EditedNote = Pick<FicheActionNote, 'note'> & {
  id?: number;
  year: number;
};
export type DeletedNote = { id: number };

// renvoie une fonction de modification des notes de suivi
export const useUpsertNoteSuivi = ({
  id: ficheId,
  collectiviteId,
}: Pick<Fiche, 'id' | 'collectiviteId'>) => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { trackUpdateOperation } = useNPSSurveyManager();

  // TODO: use trpc
  return useMutation({
    mutationFn: async ({ id, note, year }: EditedNote) => {
      return api.put({
        route: `/collectivites/${collectiviteId}/fiches-action/${ficheId}/notes`,
        params: {
          notes: [
            { id, note, dateNote: new Date(`${year}-01-01`).toISOString() },
          ],
        },
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['fiche_action', ficheId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ['fiche_action_notes_suivi', collectiviteId, ficheId],
      });
      trackUpdateOperation('fiches');
    },
  });
};

// renvoie une fonction de suppression d'une note de suivi
export const useDeleteNoteSuivi = ({
  id: ficheId,
  collectiviteId,
}: Pick<Fiche, 'id' | 'collectiviteId'>) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeletedNote) => {
      return api.delete({
        route: `/collectivites/${collectiviteId}/fiches-action/${ficheId}/note`,
        params: { id },
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['fiche_action', ficheId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ['fiche_action_notes_suivi', collectiviteId, ficheId],
      });
    },
  });
};
