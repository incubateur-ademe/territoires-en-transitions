import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { makeCollectiviteFicheNonClasseeUrl } from '@/app/app/paths';
import { dropAnimation } from '@/app/plans/plans/show-detailed-plan/plan-arborescence.view.tsx';
import { PlanNode } from '@/app/plans/plans/types';
import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { FicheResume } from '@/domain/plans/fiches';
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
  const trpc = useTRPC();
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

  const flat_axes_key = ['flat_axes', planId];
  const axe_fiches_key = ['axe_fiches', axeId];

  const openUrl = (url: string, openInNewTab?: boolean) => {
    if (openInNewTab) {
      window.open(url, '_blank');
    } else {
      router.push(url);
    }
  };

  return useMutation({
    mutationFn: () =>
      createFicheResume(supabase, {
        collectiviteId,
        axeId,
        actionId,
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: flat_axes_key });
      await queryClient.cancelQueries({ queryKey: axe_fiches_key });

      const previousData = [
        [flat_axes_key, queryClient.getQueryData(flat_axes_key)],
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

      queryClient.setQueryData(flat_axes_key, (old: PlanNode[] | undefined) => {
        return (old ?? []).map((a) => {
          if (a.id === axeId) {
            return {
              ...a,
              fiches: a.fiches ? [tempFiche.id, ...a.fiches] : [tempFiche.id],
            };
          }
          return a;
        });
      });

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
        flat_axes_key,
        (old: PlanNode[] | undefined): PlanNode[] => {
          return (old ?? []).map((axe) => {
            if (axe.id === axeId) {
              return {
                ...axe,
                fiches: axe.fiches
                  ? axe.fiches.map((f) =>
                      f === TEMPORARY_ID ? newFiche.id : f
                    )
                  : [newFiche.id],
              };
            }
            return axe;
          });
        }
      );

      // Force a refetch of the data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flat_axes_key }),
        queryClient.invalidateQueries({ queryKey: axe_fiches_key }),
        // Invalidate countBy queries to update plan status charts
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.countBy.queryKey(),
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
