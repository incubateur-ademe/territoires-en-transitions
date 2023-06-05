import {useHistory} from 'react-router-dom';
import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionAxeFicheUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import {FicheAction} from './types';

/** Upsert une fiche action pour une collectivité */
const upsertFicheAction = async (fiche: FicheAction) => {
  let query = supabaseClient
    .from('fiches_action')
    .insert(fiche as any)
    .select();

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Crée une nouvelle fiche action pour une collectivité
 * Si l'id d'un axe est donnée en argument, la fiche est ajoutée à cet axe
 * Si l'id d'une action est donné, la fiche est liée à cette action
 */
type Args = {
  axeId?: number;
  planActionId?: number;
  isAxePage?: boolean;
  actionId?: string;
  /** si renseigné la fiche créée sera ouverte dans un nouvel onglet */
  openInNewTab?: boolean;
};

export const useCreateFicheAction = (args?: Args) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const history = useHistory();
  const {axeId, planActionId, actionId, isAxePage, openInNewTab} = args || {};

  const openUrl = (url: string, openInNewTab?: boolean) => {
    if (openInNewTab) {
      window.open(url, '_blank');
    } else {
      history.push(url);
    }
  };

  return useMutation(
    () =>
      upsertFicheAction({
        collectivite_id: collectivite_id!,
        axes: axeId ? [{id: axeId, collectivite_id: collectivite_id!}] : null,
        actions: actionId ? [{id: actionId}] : null,
      } as never),
    {
      meta: {disableToast: true},
      onSuccess: data => {
        // redirige sur la nouvelle fiche du plan
        if (axeId) {
          if (isAxePage) {
            queryClient.invalidateQueries(['plan_action', axeId]);
            const url = makeCollectivitePlanActionAxeFicheUrl({
              collectiviteId: collectivite_id!,
              ficheUid: data[0].id!.toString(),
              planActionUid: planActionId!.toString(),
              axeUid: axeId.toString(),
            });
            return openUrl(url);
          }

          queryClient.invalidateQueries(['plan_action', planActionId]);
          const url = makeCollectivitePlanActionFicheUrl({
            collectiviteId: collectivite_id!,
            ficheUid: data[0].id!.toString(),
            planActionUid: planActionId!.toString(),
          });
          return openUrl(url, openInNewTab);
        }

        // ou sur la nouvelle fiche non classée
        queryClient.invalidateQueries(['fiches_non_classees', collectivite_id]);
        const url = makeCollectiviteFicheNonClasseeUrl({
          collectiviteId: collectivite_id!,
          ficheUid: data[0].id!.toString(),
        });
        openUrl(url, openInNewTab);
      },
    }
  );
};

/**
 * Édite une fiche action
 */
export const useEditFicheAction = () => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation(upsertFicheAction, {
    mutationKey: 'edit_fiche',
    onMutate: async fiche => {
      const ficheActionKey = ['fiche_action', fiche.id?.toString()];
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({queryKey: ficheActionKey});

      // Snapshot the previous value
      const previousFiche: {fiche: FicheAction} | undefined =
        queryClient.getQueryData(ficheActionKey);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ficheActionKey,
        (old?: {fiche: FicheAction}) => ({
          fiche: {
            ...old?.fiche,
            ...fiche,
          },
        })
      );

      // Return a context object with the snapshotted value
      return {previousFiche};
    },
    onSettled: (data, err, fiche, context) => {
      if (err) {
        queryClient.setQueryData(
          ['fiche_action', fiche.id],
          context?.previousFiche
        );
      }
      queryClient.invalidateQueries(['fiche_action', fiche.id?.toString()]);

      queryClient.invalidateQueries(['fiches_non_classees', collectivite_id]);
      queryClient.invalidateQueries(['structures', collectivite_id]);
      queryClient.invalidateQueries(['partenaires', collectivite_id]);
      queryClient.invalidateQueries(['personnes_pilotes', collectivite_id]);
      queryClient.invalidateQueries(['personnes', collectivite_id]);
      queryClient.invalidateQueries(['services_pilotes', collectivite_id]);
      queryClient.invalidateQueries(['personnes_referentes', collectivite_id]);
      queryClient.invalidateQueries(['financeurs', collectivite_id]);
    },
  });
};
