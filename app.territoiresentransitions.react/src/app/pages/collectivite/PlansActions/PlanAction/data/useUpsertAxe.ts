import { supabaseClient } from 'core-logic/api/supabase';
import { useMutation, useQueryClient } from 'react-query';

import { makeCollectivitePlanActionUrl } from 'app/paths';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useRouter } from 'next/navigation';
import { TAxeInsert } from 'types/alias';
import { waitForMarkup } from 'utils/waitForMarkup';
import { PlanNode } from './types';
import { planNodeFactory, sortPlanNodes } from './utils';

/**
 * Upsert un axe pour une collectivité.
 * S'il n'a pas de parent, alors cela est considéré comme un nouveau plan
 */
export const upsertAxe = async (axe: TAxeInsert) => {
  const query = supabaseClient.from('axe').upsert(axe).select();

  const {error, data} = await query;

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

  const navigation_key = ['plans_navigation', collectivite_id];

  return useMutation(upsertAxe, {
    meta: {disableToast: true},
    onMutate: async ({nom}) => {
      await queryClient.cancelQueries({queryKey: navigation_key});

      const previousData: PlanNode[] | undefined =
        queryClient.getQueryData(navigation_key);

      queryClient.setQueryData(
        navigation_key,
        (old: PlanNode[] | undefined) => {
          if (old) {
            const axe = planNodeFactory({axes: old, nom});
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
    onError: (err, axe, previousData) => {
      queryClient.setQueryData(navigation_key, previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(navigation_key);
    },
    onSuccess: data => {
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
export const useAddAxe = (
  parentId: number,
  parentDepth: number,
  planActionId: number
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  const flat_axes_key = ['flat_axes', planActionId];
  const navigation_key = ['plans_navigation', collectivite_id];

  return useMutation(upsertAxe, {
    meta: {disableToast: true},
    onMutate: async () => {
      await queryClient.cancelQueries({queryKey: flat_axes_key});
      await queryClient.cancelQueries({queryKey: navigation_key});

      const previousData = [
        [flat_axes_key, queryClient.getQueryData(flat_axes_key)],
        [navigation_key, queryClient.getQueryData(navigation_key)],
      ];

      queryClient.setQueryData(flat_axes_key, (old: PlanNode[] | undefined) => {
        if (old) {
          const axe = planNodeFactory({
            axes: old,
            parentId,
            parentDepth: parentDepth + 1,
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
              parentId,
              parentDepth: parentDepth + 1,
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
    onError: (err, axe, previousData) => {
      previousData?.forEach(([key, data]) =>
        queryClient.setQueryData(key as string[], data)
      );
    },
    onSuccess: data => {
      queryClient.invalidateQueries(navigation_key);
      queryClient.invalidateQueries(flat_axes_key).then(() => {
        waitForMarkup(`#axe-${data[0].id}`).then(el => {
          // scroll au niveau du nouvel axe créé
          el?.scrollIntoView({behavior: 'smooth', block: 'center'});
          // donne le focus à son titre
          document.getElementById(`axe-titre-${data[0].id}`)?.focus();
        });
      });
    },
  });
};
