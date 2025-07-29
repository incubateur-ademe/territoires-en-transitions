import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { FicheResume } from '@/domain/plans/fiches';
import { PlanNode } from '@/domain/plans/plans';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useRestreindreFiches = (axes: PlanNode[]) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const supabase = useSupabase();
  const collectiviteId = useCollectiviteId();

  const axesWithFiches = axes.filter(
    (axe) => axe.fiches && axe.fiches.length > 0
  );

  const keys = axesWithFiches.map((axe) => ['axe_fiches', axe.id, axe.fiches]);

  return useMutation({
    mutationFn: async ({
      plan_id,
      restreindre,
    }: {
      plan_id: number;
      restreindre: boolean;
    }) => {
      await supabase.rpc('restreindre_plan', { plan_id, restreindre });
    },
    onMutate: async ({
      restreindre,
    }: {
      plan_id: number;
      restreindre: boolean;
    }) => {
      const previousData = keys.map((key) => [
        key,
        queryClient.getQueryData(key),
      ]);

      keys.forEach((key) =>
        queryClient.setQueryData(
          key,
          (old: FicheResume[] | undefined): FicheResume[] => {
            return (
              old?.map((fiche) => ({ ...fiche, restreint: restreindre })) || []
            );
          }
        )
      );

      return previousData;
    },
    onError: (_, __, previousData: any) => {
      previousData?.forEach(([key, data]: [any, any]) =>
        queryClient.setQueryData(key as string[], data)
      );
    },
    onSettled: () => {
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));

      // Invalidate tRPC query for fiches list
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listResumes.queryKey({
          collectiviteId,
        }),
      });
    },
  });
};
