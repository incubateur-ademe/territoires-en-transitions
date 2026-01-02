import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isNil } from 'es-toolkit';

import { RouterInput, useTRPC } from '@tet/api';
import { PlanNode } from '@tet/domain/plans';

type UpdateAxe = Omit<
  RouterInput['plans']['axes']['update'],
  'id' | 'collectiviteId' | 'parent'
> & {
  parent?: number | null;
};

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
    mutationFn: ({ parent, ...data }: UpdateAxe) => {
      return updateAxe({
        id: axe.id,
        collectiviteId,
        parent: parent ?? undefined,
        ...data,
      });
    },
    meta: { disableToast: true },
    onSuccess: async (data, variables) => {
      const hasSetDescription =
        axe.description === null && data.description === '';
      const hasChangeDescription =
        axe.description !== data.description &&
        !isNil(axe.description) &&
        !isNil(data.description);

      if (!hasChangeDescription) {
        await queryClient.invalidateQueries({
          queryKey: trpc.plans.plans.get.queryKey({
            planId: data.plan ?? undefined,
          }),
        });
      }
      if (variables.indicateurs) {
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.indicateurs.list.queryKey({
            filters: { axeIds: [data.id] },
          }),
        });
      }
      if (hasSetDescription) {
        await waitForMarkup(`#axe-desc-${data.id} div[contenteditable]`).then(
          (el) => {
            (el as HTMLInputElement)?.focus?.();
          }
        );
      }
    },
  });
};
