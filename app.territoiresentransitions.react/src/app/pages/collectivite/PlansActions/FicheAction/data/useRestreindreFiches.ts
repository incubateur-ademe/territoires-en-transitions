import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { FicheResume } from '@/domain/plans/fiches';
import { useMutation, useQueryClient } from 'react-query';
import { PlanNode } from '../../PlanAction/data/types';

export const useRestreindreFiches = (axes: PlanNode[]) => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const axesWithFiches = axes.filter(
    (axe) => axe.fiches && axe.fiches.length > 0
  );

  const keys = axesWithFiches.map((axe) => ['axe_fiches', axe.id, axe.fiches]);

  return useMutation(
    async ({
      plan_id,
      restreindre,
    }: {
      plan_id: number;
      restreindre: boolean;
    }) => {
      await supabase.rpc('restreindre_plan', { plan_id, restreindre });
    },
    {
      onMutate: async ({ restreindre }) => {
        const previousData = keys.map((key) => [
          key,
          queryClient.getQueryData(key),
        ]);

        keys.forEach((key) =>
          queryClient.setQueryData(
            key,
            (old: FicheResume[] | undefined): FicheResume[] => {
              return (
                old?.map((fiche) => ({ ...fiche, restreint: restreindre })) ||
                []
              );
            }
          )
        );

        return previousData;
      },
      onError: (err, axe, previousData) => {
        previousData?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
      onSettled: () => {
        keys.forEach((key) => queryClient.invalidateQueries(key));
      },
    }
  );
};
