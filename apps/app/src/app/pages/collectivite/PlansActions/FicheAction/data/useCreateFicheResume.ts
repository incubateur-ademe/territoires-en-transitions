import { makeCollectiviteFicheNonClasseeUrl } from '@/app/app/paths';
import { dropAnimation } from '@/app/plans/plans/show-plan/plan-arborescence.view';
import { useTRPC } from '@tet/api';

import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plan } from '@tet/domain/plans';
import { isNil } from 'es-toolkit';
import { useRouter } from 'next/navigation';
import { ficheResumeFactory, sortFichesResume } from './utils';

const TEMPORARY_ID = -1 as const;

type Args = {
  axeId?: number;
  actionId?: string;
  /** uniquement quand la fiche est crée dans un axe */
  axeFichesIds?: number[] | null;
  planId?: number;
  /** si renseigné la fiche créée sera ouverte dans un nouvel onglet */
  openInNewTab?: boolean;
  collectiviteId: number;
};

export const useCreateFicheResume = (args: Args) => {
  const queryClient = useQueryClient();
  const trpcClient = useTRPC();
  const router = useRouter();
  const {
    axeId,
    planId,
    actionId,
    axeFichesIds,
    openInNewTab,
    collectiviteId,
  } = args;

  const axe_fiches_key = ['axe_fiches', axeId];

  const openUrl = (url: string, openInNewTab?: boolean) => {
    if (openInNewTab) {
      window.open(url, '_blank');
    } else {
      router.push(url);
    }
  };

  const { mutateAsync: createFiche } = useMutation(
    trpcClient.plans.fiches.create.mutationOptions()
  );

  return useMutation({
    mutationKey: ['create_fiche_resume'],
    mutationFn: () => {
      return createFiche({
        fiche: { collectiviteId },
        ficheFields: {
          axes: isNil(axeId) ? undefined : [{ id: axeId }],
          mesures: isNil(actionId) ? undefined : [{ id: actionId }],
        },
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
      });
      await queryClient.cancelQueries({ queryKey: axe_fiches_key });

      const previousData = [
        [
          trpcClient.plans.plans.get.queryKey({ planId }),
          queryClient.getQueryData(
            trpcClient.plans.plans.get.queryKey({ planId })
          ),
        ],
        [axe_fiches_key, queryClient.getQueryData(axe_fiches_key)],
      ];

      const tempFiche = ficheResumeFactory({
        tempId: TEMPORARY_ID,
        collectiviteId,
        axeId,
        axeFichesIds,
      });

      queryClient.setQueryData(
        axe_fiches_key,
        (old: FicheListItem[] | undefined) => {
          return old ? [tempFiche, ...old] : [tempFiche];
        }
      );

      queryClient.setQueryData(
        trpcClient.plans.plans.get.queryKey({ planId }),
        (old): Plan | undefined => {
          if (!old) {
            return undefined;
          }
          const updatedAxes = (old.axes ?? []).map((a) => {
            if (a.id === axeId) {
              return {
                ...a,
                fiches: a.fiches ? [tempFiche.id, ...a.fiches] : [tempFiche.id],
              };
            }
            return a;
          });

          queryClient.invalidateQueries({
            queryKey: trpcClient.plans.fiches.listFiches.queryKey({
              collectiviteId,
            }),
          });
          return {
            ...old,
            axes: updatedAxes,
          };
        }
      );

      const context = {
        previousData,
        tempFiche,
      };

      return context;
    },
    onError: (err, args, context) => {
      context?.previousData.forEach(([key, data]) =>
        queryClient.setQueryData(key as string[], data)
      );
    },
    onSuccess: async (data) => {
      const newFiche = data as unknown as FicheListItem;

      // On récupère la fiche renvoyer par le serveur pour la remplacer dans le cache avant invalidation
      queryClient.setQueryData(
        axe_fiches_key,
        (old: FicheListItem[] | undefined): FicheListItem[] => {
          const updatedData = old ?? [];
          return sortFichesResume(
            updatedData.map((f) => {
              return f.id === TEMPORARY_ID ? newFiche : f;
            })
          );
        }
      );

      // On récupère la fiche renvoyer par le serveur pour la remplacer dans le cache avant invalidation
      queryClient.setQueryData(
        trpcClient.plans.plans.get.queryKey({ planId }),
        (old: Plan | undefined): Plan | undefined => {
          if (!old) {
            return undefined;
          }
          const updatedAxes = old.axes.map((axe) => {
            if (axe.id !== axeId) {
              return axe;
            }
            return {
              ...axe,
              fiches: axe.fiches
                ? axe.fiches.map((f) => (f === TEMPORARY_ID ? newFiche.id : f))
                : [newFiche.id],
            };
          });
          return {
            ...old,
            axes: updatedAxes,
          };
        }
      );

      // Force a refetch of the data
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
        }),
        queryClient.invalidateQueries({ queryKey: axe_fiches_key }),
        queryClient.invalidateQueries({
          queryKey: trpcClient.plans.fiches.countBy.queryKey({
            collectiviteId,
          }),
        }),
      ]);

      waitForMarkup(`#fiche-${newFiche.id}`).then(() => {
        // scroll au niveau de la nouvelle fiche créée
        dropAnimation(`fiche-${newFiche.id}`);
      });

      if (actionId) {
        const url = makeCollectiviteFicheNonClasseeUrl({
          collectiviteId,
          ficheUid: newFiche.id.toString(),
        });
        openUrl(url, openInNewTab);
      }
    },
  });
};
