import { useMutation, useQueryClient } from '@tanstack/react-query';

import { RouterInput, useTRPC } from '@tet/api';
import { PlanNode } from '@tet/domain/plans';

type UpdateAxe = Omit<
  RouterInput['plans']['axes']['update'],
  'id' | 'collectiviteId' | 'parent'
>;

export const useUpdateAxe = ({
  collectiviteId,
  axe,
}: {
  collectiviteId: number;
  axe: PlanNode;
}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: updateAxe } = useMutation(
    trpc.plans.axes.update.mutationOptions()
  );

  return useMutation({
    mutationFn: (data: UpdateAxe) => {
      return updateAxe({
        id: axe.id,
        collectiviteId,
        ...data,
      });
    },
    meta: { disableToast: true },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.indicateurs.list.queryKey({
          filters: { axeIds: [data.id] },
        }),
      });
    },
  });
};
