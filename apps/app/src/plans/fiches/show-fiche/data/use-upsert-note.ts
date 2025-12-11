import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FicheNote, FicheWithRelations } from '@tet/domain/plans';

export type EditedNote = Pick<FicheNote, 'note'> & {
  id?: number;
  year: number;
};

export const useUpsertNote = ({
  id: ficheId,
  collectiviteId,
}: Pick<FicheWithRelations, 'id' | 'collectiviteId'>) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  // TODO: use trpc
  return useMutation({
    mutationKey: ['upsert_note'],
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
        queryKey: ['fiche_action_notes', collectiviteId, ficheId],
      });
    },
  });
};
