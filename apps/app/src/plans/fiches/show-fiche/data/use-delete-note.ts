import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fiche } from '@tet/domain/plans';

export type DeletedNote = { id: number };

export const useDeleteNote = ({
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
        queryKey: ['fiche_action_notes', collectiviteId, ficheId],
      });
    },
  });
};
