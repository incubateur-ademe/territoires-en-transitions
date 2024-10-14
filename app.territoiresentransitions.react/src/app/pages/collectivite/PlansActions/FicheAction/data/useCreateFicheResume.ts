import { useHistory } from 'react-router-dom';
import { QueryKey, useMutation, useQueryClient } from 'react-query';

import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { ficheResumeFactory, sortFichesResume } from './utils';
import { PlanNode } from '../../PlanAction/data/types';
import { waitForMarkup } from 'utils/waitForMarkup';
import { dropAnimation } from '../../PlanAction/DragAndDropNestedContainers/Arborescence';
import { makeCollectiviteFicheNonClasseeUrl } from 'app/paths';
import { FicheResume } from '@tet/api/plan-actions';
import { objectToCamel } from 'ts-case-convert';

type queryArgs = {
  collectiviteId: number;
  axeId?: number;
  actionId?: string;
};

const createFicheResume = async ({
  collectiviteId,
  axeId,
  actionId,
}: queryArgs) => {
  let query = supabaseClient.rpc('create_fiche', {
    collectivite_id: collectiviteId,
    axe_id: axeId,
    action_id: actionId,
  });

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return objectToCamel(data);
};

type Args = {
  axeId?: number;
  actionId?: string;
  /** uniquement quand la fiche est crée dans un axe */
  axeFichesIds?: number[] | null;
  planId?: number;
  /** si renseigné la fiche créée sera ouverte dans un nouvel onglet */
  openInNewTab?: boolean;
  /** Clés react-query à invalider */
  keysToInvalidate?: QueryKey[];
};

export const useCreateFicheResume = (args: Args) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const history = useHistory();

  const { axeId, planId, actionId, axeFichesIds, openInNewTab } = args;

  const flat_axes_key = ['flat_axes', planId];
  const axe_fiches_key = ['axe_fiches', axeId];

  const openUrl = (url: string, openInNewTab?: boolean) => {
    if (openInNewTab) {
      window.open(url, '_blank');
    } else {
      history.push(url);
    }
  };

  return useMutation(
    () =>
      createFicheResume({ collectiviteId: collectivite_id!, axeId, actionId }),
    {
      onMutate: async () => {
        if (axeId) {
          await queryClient.cancelQueries({ queryKey: flat_axes_key });
          await queryClient.cancelQueries({ queryKey: axe_fiches_key });

          const previousData = [
            [flat_axes_key, queryClient.getQueryData(flat_axes_key)],
            [axe_fiches_key, queryClient.getQueryData(axe_fiches_key)],
          ];

          const tempFiche = ficheResumeFactory({
            collectiviteId: collectivite_id!,
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
            flat_axes_key,
            (old: PlanNode[] | undefined) => {
              const axe = old && old.find((a) => a.id === axeId);
              if (axe) {
                axe.fiches = axe.fiches
                  ? [tempFiche.id!, ...axe.fiches]
                  : [tempFiche.id!];
                return old.map((a) => (a.id === axeId ? axe : a));
              } else {
                return [];
              }
            }
          );

          const context = {
            previousData,
            tempFiche,
          };

          return context;
        }
      },
      onError: (err, args, context) => {
        context?.previousData.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
      onSuccess: (data, variables, context) => {
        args.keysToInvalidate?.forEach((key) =>
          queryClient.invalidateQueries(key)
        );
        const newFiche = data as FicheResume;
        if (axeId) {
          // On récupère la fiche renvoyer par le serveur pour la remplacer dans le cache avant invalidation
          queryClient.setQueryData(
            axe_fiches_key,
            (old: FicheResume[] | undefined): FicheResume[] => {
              return old
                ? old.length > 0
                  ? sortFichesResume(
                      old.map((f) =>
                        f.id === context?.tempFiche.id ? newFiche : f
                      )
                    )
                  : [newFiche]
                : [];
            }
          );

          // On récupère la fiche renvoyer par le serveur pour la remplacer dans le cache avant invalidation
          queryClient.setQueryData(
            flat_axes_key,
            (old: PlanNode[] | undefined): PlanNode[] => {
              const axe = old && old.find((a) => a.id === axeId);
              if (axe) {
                axe.fiches =
                  axe.fiches && axe?.fiches.length > 0
                    ? axe.fiches.map((id) =>
                        id === context?.tempFiche.id ? newFiche.id! : id
                      )
                    : [newFiche.id!];
                return old.map((a) => (a.id === axeId ? axe : a));
              } else return [];
            }
          );

          queryClient.invalidateQueries(flat_axes_key);
          queryClient.invalidateQueries(axe_fiches_key).then(() => {
            waitForMarkup(`#fiche-${newFiche.id}`).then(() => {
              // scroll au niveau de la nouvelle fiche créée
              dropAnimation(`fiche-${newFiche.id}`);
            });
          });
        }
        if (actionId) {
          const url = makeCollectiviteFicheNonClasseeUrl({
            collectiviteId: collectivite_id!,
            ficheUid: newFiche.id!.toString(),
          });
          openUrl(url, openInNewTab);
        }
      },
    }
  );
};
