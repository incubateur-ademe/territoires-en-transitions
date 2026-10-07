import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type { UseUpdateActionDeReference } from '../actions-de-reference.contract';

const useUpdateActionDeReference: UseUpdateActionDeReference = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    trpc.shared.actionsDeReference.update.mutationOptions({
      meta: { success: appLabels.actionDeReferenceModificationSucces },
      onSuccess: (): Promise<void> =>
        queryClient.invalidateQueries({
          queryKey: trpc.shared.actionsDeReference.list.pathKey(),
        }),
    })
  );

  return {
    updateAction: (input, { onUpdated }) =>
      mutate(input, { onSuccess: onUpdated }),
    isPending,
  };
};

export { useUpdateActionDeReference };
