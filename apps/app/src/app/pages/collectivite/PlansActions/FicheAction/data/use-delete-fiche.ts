import { ListFichesOutput } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Plan } from '@tet/domain/plans';

type UseDeleteFicheArgs = {
  onDeleteCallback?: () => void;
  /** ID du plan pour la mise à jour optimiste (optionnel) */
  planId?: number;
  /** ID de l'axe pour la mise à jour optimiste (optionnel) */
  axeId?: number;
};

export const useDeleteFiche = ({
  onDeleteCallback,
  planId,
  axeId,
}: UseDeleteFicheArgs) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useMutation(
    trpc.plans.fiches.delete.mutationOptions({
      meta: { disableToast: true },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey({
            collectiviteId,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.plans.plans.get.queryKey(),
        });

        onDeleteCallback?.();
      },
      onMutate: async (variables) => {
        const { ficheId } = variables;

        // annule les requêtes en cours pour éviter les conflits
        if (planId) {
          await queryClient.cancelQueries({
            queryKey: trpc.plans.plans.get.queryKey({ planId }),
          });
        }

        if (axeId) {
          await queryClient.cancelQueries({
            queryKey: trpc.plans.fiches.listFiches.queryKey({
              collectiviteId,
              filters: { axesId: [axeId] },
            }),
          });
        }

        // sauvegarde les données précédentes pour le rollback en cas d'erreur
        const previousData = {
          plan: planId
            ? queryClient.getQueryData(
                trpc.plans.plans.get.queryKey({ planId })
              )
            : undefined,
          listFiches:
            axeId && collectiviteId
              ? queryClient.getQueryData(
                  trpc.plans.fiches.listFiches.queryKey({
                    collectiviteId,
                    filters: { axesId: [axeId] },
                  })
                )
              : undefined,
        };

        // mise à jour optimiste : retire la fiche de listFiches avec le filtre axesId
        if (axeId) {
          queryClient.setQueryData(
            trpc.plans.fiches.listFiches.queryKey({
              filters: { axesId: [axeId] },
            }),
            (old: ListFichesOutput | undefined) => {
              if (!old) {
                return old;
              }
              return {
                ...old,
                data: old.data.filter((f) => f.id !== ficheId),
                count: Math.max(0, old.count - 1),
              };
            }
          );
        }

        // mise à jour optimiste : retire la fiche de l'axe dans plans.plans.get
        if (planId && axeId) {
          queryClient.setQueryData(
            trpc.plans.plans.get.queryKey({ planId }),
            (old: Plan | undefined): Plan | undefined => {
              if (!old) {
                return undefined;
              }
              const updatedAxes = old.axes.map((a) => {
                if (a.id === axeId) {
                  return {
                    ...a,
                    fiches: a.fiches?.filter((f) => f !== ficheId) ?? [],
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
        }

        return { previousData };
      },
      onError: (err, variables, context) => {
        // rollback : restaure les données précédentes en cas d'erreur
        if (!context) return;

        const { previousData } = context;

        if (planId && previousData.plan) {
          queryClient.setQueryData(
            trpc.plans.plans.get.queryKey({ planId }),
            previousData.plan
          );
        }

        if (axeId && collectiviteId && previousData.listFiches) {
          queryClient.setQueryData(
            trpc.plans.fiches.listFiches.queryKey({
              collectiviteId,
              filters: { axesId: [axeId] },
            }),
            previousData.listFiches
          );
        }
      },
    })
  );
};
