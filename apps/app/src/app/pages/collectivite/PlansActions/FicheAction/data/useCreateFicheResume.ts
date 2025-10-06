import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { makeCollectiviteFicheNonClasseeUrl } from '@/app/app/paths';
import { dropAnimation } from '@/app/plans/plans/show-plan/plan-arborescence.view';

import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { FicheResume } from '@/domain/plans/fiches';
import { Plan } from '@/domain/plans/plans';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { objectToCamel } from 'ts-case-convert';
import { ficheResumeFactory, sortFichesResume } from './utils';

type queryArgs = {
  collectiviteId: number;
  axeId?: number;
  actionId?: string;
};

const TEMPORARY_ID = 9999 as const;

const createFicheResume = async (
  supabase: DBClient,
  { collectiviteId, axeId, actionId }: queryArgs
) => {
  const query = supabase.rpc('create_fiche', {
    collectivite_id: collectiviteId,
    axe_id: axeId,
    action_id: actionId,
  });

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return objectToCamel({
    ...data,
    dateFin: data.date_fin_provisoire,
    priorite: data.niveau_priorite,
  });
};

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
  const supabase = useSupabase();
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

  return useMutation({
    mutationKey: ['create_fiche_resume'],
    mutationFn: () =>
      createFicheResume(supabase, {
        collectiviteId,
        axeId,
        actionId,
      }),
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
        (old: FicheResume[] | undefined) => {
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
      const newFiche = data as unknown as FicheResume;

      // On récupère la fiche renvoyer par le serveur pour la remplacer dans le cache avant invalidation
      queryClient.setQueryData(
        axe_fiches_key,
        (old: FicheResume[] | undefined): FicheResume[] => {
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
