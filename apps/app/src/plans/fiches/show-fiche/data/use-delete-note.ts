import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { FicheWithRelations } from '@tet/domain/plans';

export type DeletedNote = { id: number };

export const useDeleteNote = ({
  id: ficheId,
}: Pick<FicheWithRelations, 'id'>) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    trpc.plans.fiches.notes.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.get.queryKey({ id: ficheId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.notes.list.queryKey({ ficheId }),
        });
      },
    }),
    queryClient
  );

  return {
    ...mutation,
    mutateAsync: async ({ id }: DeletedNote) => {
      return mutation.mutateAsync({ ficheId, noteId: id });
    },
  };
};
