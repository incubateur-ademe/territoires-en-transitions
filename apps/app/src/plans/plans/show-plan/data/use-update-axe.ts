import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isNil } from 'es-toolkit';

import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { RouterInput, useTRPC } from '@tet/api';
import { PlanNode } from '@tet/domain/plans';
import { AxeDescriptionCreatedEvent } from '../plan-arborescence.view/axe/axe.context';

type UpdateAxe = Omit<
  RouterInput['plans']['axes']['update'],
  'id' | 'collectiviteId' | 'parent' | 'indicateurs'
> & {
  parent?: number | null;
  indicateurs?: IndicateurDefinitionListItem[];
};

export const useUpdateAxe = ({
  collectiviteId,
  axe,
  planId,
}: {
  collectiviteId: number;
  axe: PlanNode;
  planId: number;
}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: updateAxe } = useMutation(
    trpc.plans.axes.update.mutationOptions()
  );

  const queryKeyPlan = trpc.plans.plans.get.queryKey({ planId });
  const queryKeyIndicateurs = trpc.indicateurs.indicateurs.list.queryKey({
    collectiviteId,
    filters: { axeIds: [axe.id] },
  });

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
    onMutate: async (variables) => {
      if (!planId) {
        return;
      }

      // annule les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: queryKeyPlan });
      await queryClient.cancelQueries({ queryKey: queryKeyIndicateurs });

      // sauvegarde les données précédentes pour le rollback en cas d'erreur
      const previousPlan = queryClient.getQueryData(queryKeyPlan);
      const previousIndicateurs = queryClient.getQueryData(queryKeyIndicateurs);

      // mise à jour optimiste : met à jour l'axe dans plans.plans.get
      queryClient.setQueryData(queryKeyPlan, (old) => {
        if (!old) {
          return undefined;
        }

        const updatedAxes = old.axes.map((a) => {
          if (a.id === axe.id) {
            return {
              ...a,
              nom: variables.nom ?? a.nom,
              description:
                variables.description === null
                  ? null
                  : variables.description ?? a.description,
              parent:
                variables.parent !== undefined ? variables.parent : a.parent,
              indicateurs: variables.indicateurs
                ? variables.indicateurs.map(({ id }) => id)
                : undefined,
            };
          }
          return a;
        });

        return {
          ...old,
          axes: updatedAxes,
        };
      });

      queryClient.setQueryData(queryKeyIndicateurs, () => {
        if (variables.indicateurs) {
          return {
            page: 1,
            pageCount: 1,
            pageSize: variables.indicateurs.length,
            count: variables.indicateurs.length,
            data: variables.indicateurs,
          };
        }
      });

      // signale la création de la description pour donner le focus au champ
      const hasSetDescription =
        axe.description === null && variables.description === '';
      if (hasSetDescription) {
        window.dispatchEvent(
          new CustomEvent(AxeDescriptionCreatedEvent, {
            detail: { axeId: axe.id },
          })
        );
      }

      return { previousPlan, previousIndicateurs, planId };
    },
    onSuccess: async (data, variables) => {
      const hasChangeDescription =
        axe.description !== data.description &&
        !isNil(axe.description) &&
        !isNil(data.description);

      if (!hasChangeDescription) {
        await queryClient.invalidateQueries({ queryKey: queryKeyPlan });
      }
      if (variables.indicateurs) {
        await queryClient.invalidateQueries({ queryKey: queryKeyIndicateurs });
      }
    },
    onError: (err, variables, context) => {
      // rollback : restaure les données précédentes en cas d'erreur
      if (!context) return;

      const { previousPlan, previousIndicateurs, planId } = context;

      if (planId && previousPlan) {
        queryClient.setQueryData(queryKeyPlan, previousPlan);
      }
      if (previousIndicateurs) {
        queryClient.setQueryData(queryKeyIndicateurs, previousIndicateurs);
      }
    },
  });
};
