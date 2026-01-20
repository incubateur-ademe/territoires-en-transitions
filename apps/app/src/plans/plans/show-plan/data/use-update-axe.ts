import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isNil } from 'es-toolkit';

import { RouterInput, useTRPC } from '@tet/api';
import { PlanNode } from '@tet/domain/plans';
import { AxeDescriptionCreatedEvent } from '../plan-arborescence.view/axe/axe.context';

type UpdateAxe = Omit<
  RouterInput['plans']['axes']['update'],
  'id' | 'collectiviteId' | 'parent'
> & {
  parent?: number | null;
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
      // annule les requêtes en cours pour éviter les conflits
      if (planId) {
        await queryClient.cancelQueries({
          queryKey: trpc.plans.plans.get.queryKey({ planId }),
        });
      }

      // sauvegarde les données précédentes pour le rollback en cas d'erreur
      const previousPlan = planId
        ? queryClient.getQueryData(trpc.plans.plans.get.queryKey({ planId }))
        : undefined;

      // mise à jour optimiste : met à jour l'axe dans plans.plans.get
      if (planId) {
        queryClient.setQueryData(
          trpc.plans.plans.get.queryKey({ planId }),
          (old) => {
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
                    variables.parent !== undefined
                      ? variables.parent
                      : a.parent,
                };
              }
              return a;
            });

            return {
              ...old,
              axes: updatedAxes,
            };
          }
        );

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
      }

      return { previousPlan, planId };
    },
    onSuccess: async (data, variables) => {
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
    },
    onError: (err, variables, context) => {
      // rollback : restaure les données précédentes en cas d'erreur
      if (!context) return;

      const { previousPlan, planId } = context;

      if (planId && previousPlan) {
        queryClient.setQueryData(
          trpc.plans.plans.get.queryKey({ planId }),
          previousPlan
        );
      }
    },
  });
};
