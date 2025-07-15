import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { TAxeInsert } from '@/app/types/alias';
import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { useRouter } from 'next/navigation';
import { PlanNode } from '../../types';
import { planNodeFactory, sortPlanNodes } from '../../utils';

/**
 * Upsert un axe pour une collectivité.
 * S'il n'a pas de parent, alors cela est considéré comme un nouveau plan
 */
const upsertAxe = async (supabase: DBClient, axe: TAxeInsert) => {
  const query = supabase.from('axe').upsert(axe).select();

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Crée un nouveau plan d'action pour une collectivité
 */
export const useCreatePlanAction = () => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const router = useRouter();
  const supabase = useSupabase();

  const navigation_key = ['plans_navigation', collectivite_id];

  return useMutation({
    mutationFn: (axe: TAxeInsert) => upsertAxe(supabase, axe),
    meta: { disableToast: true },
    onMutate: async ({ nom }) => {
      await queryClient.cancelQueries({ queryKey: navigation_key });

      const previousData: PlanNode[] | undefined =
        queryClient.getQueryData(navigation_key);

      queryClient.setQueryData(
        navigation_key,
        (old: PlanNode[] | undefined) => {
          if (old) {
            const axe = planNodeFactory({ axes: old, nom });
            const tempNavigation = [...old, axe];
            sortPlanNodes(tempNavigation);
            return tempNavigation;
          } else {
            return [];
          }
        }
      );

      return previousData;
    },
    onError: (err, axe, context) => {
      queryClient.setQueryData(navigation_key, context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: navigation_key });
    },
    onSuccess: (data) => {
      router.push(
        makeCollectivitePlanActionUrl({
          collectiviteId: collectivite_id!,
          planActionUid: data[0].id!.toString(),
        })
      );
    },
  });
};

/**
 * Ajoute un sous-axe à un axe
 */
export const useAddAxe = ({
  parentAxe,
  planActionId,
}: {
  parentAxe: Pick<PlanNode, 'id' | 'depth'>;
  planActionId: number;
}) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  const flat_axes_key = ['flat_axes', planActionId];
  const navigation_key = ['plans_navigation', collectivite_id];

  return useMutation({
    mutationFn: (axe: TAxeInsert) => upsertAxe(supabase, axe),
    meta: { disableToast: true },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: flat_axes_key });
      await queryClient.cancelQueries({ queryKey: navigation_key });

      const previousData = [
        [flat_axes_key, queryClient.getQueryData(flat_axes_key)],
        [navigation_key, queryClient.getQueryData(navigation_key)],
      ];

      queryClient.setQueryData(flat_axes_key, (old: PlanNode[] | undefined) => {
        if (old) {
          const axe = planNodeFactory({
            axes: old,
            parentId: parentAxe.id,
            parentDepth: parentAxe.depth + 1,
          });
          const tempNavigation = [...old, axe];
          sortPlanNodes(tempNavigation);
          return tempNavigation;
        } else {
          return [];
        }
      });

      queryClient.setQueryData(
        navigation_key,
        (old: PlanNode[] | undefined) => {
          if (old) {
            const axe = planNodeFactory({
              axes: old,
              parentId: parentAxe.id,
              parentDepth: parentAxe.depth + 1,
            });
            const tempAxes = [...old, axe];
            sortPlanNodes(tempAxes);
            return tempAxes;
          } else {
            return [];
          }
        }
      );

      return previousData;
    },
    onError: (err, axe, context) => {
      context?.forEach(([key, data]) =>
        queryClient.setQueryData(key as string[], data)
      );
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: navigation_key }),
        queryClient.invalidateQueries({ queryKey: flat_axes_key }),
      ]);
      await waitForMarkup(`#axe-${data[0].id}`).then((el) => {
        // scroll au niveau du nouvel axe créé
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // donne le focus à son titre
        document.getElementById(`axe-titre-${data[0].id}`)?.focus();
      });
    },
  });
};
