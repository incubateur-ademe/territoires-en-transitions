import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { FicheNote, FicheWithRelations } from '@tet/domain/plans';

export type EditedNote = Pick<FicheNote, 'note'> & {
  id?: number;
  year: number;
};

export const useUpsertNote = ({
  id: ficheId,
}: Pick<FicheWithRelations, 'id'>) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    trpc.plans.fiches.notes.upsert.mutationOptions({
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
    mutateAsync: async ({ id, note, year }: EditedNote) => {
      return mutation.mutateAsync({
        ficheId,
        note: {
          id,
          note,
          dateNote: new Date(`${year}-01-01`).toISOString(),
        },
      });
    },
  };
};
