import {useHistory} from 'react-router-dom';
import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {makeCollectiviteFicheNonClasseeUrl} from 'app/paths';
import {FicheAction, FicheResume} from './types';
import {dropAnimation} from '../../PlanAction/DragAndDropNestedContainers/Arborescence';
import {waitForMarkup} from 'utils/waitForMarkup';

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
  actionId?: string;
  /** si renseigné la fiche créée sera ouverte dans un nouvel onglet */
  openInNewTab?: boolean;
};

export const useCreateFicheAction = (args?: Args) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const history = useHistory();
  const {axeId, planActionId, actionId, openInNewTab} = args || {};

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
      onMutate: async args => {
        // Nous avons besoin de l'update optimiste uniquement dans l'arborescence d'un plan d'action
        if (axeId) {
          // clés dans le cache
          const axeKey = ['axe_fiches', axeId];

          // copie l'état précédent avant de modifier le cache
          const previousState = [[axeKey, queryClient.getQueryData(axeKey)]];

          // met à jour les listes des fiches d'un axe
          queryClient.setQueryData(axeKey, (old: any) => {
            const newFiche = {
              id: null,
              collectivite_id: collectivite_id!,
            };
            return old ? [...old, newFiche] : [newFiche];
          });

          // Return a context object with the snapshotted value
          return previousState;
        }
      },
      onError: (err, args, previousState) => {
        // en cas d'erreur restaure l'état précédent
        previousState?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
      onSuccess: data => {
        if (axeId) {
          const ficheId = data[0].id;
          queryClient.setQueryData(
            ['axe_fiches', axeId],
            (old: FicheResume[] | undefined): FicheResume[] => {
              if (old) {
                const index = old.findIndex(f => f.id === null);
                if (index !== -1) {
                  old[index].id = ficheId;
                }
              }
              return old || [];
            }
          );
          queryClient.invalidateQueries(['axe_fiches', axeId]);
          queryClient
            .invalidateQueries(['plan_action', planActionId])
            .then(() => {
              const ficheId = data[0].id;
              waitForMarkup(`#fiche-${ficheId}`).then(() => {
                // scroll au niveau de la nouvelle fiche créée
                dropAnimation(`fiche-${ficheId}`);
                // on la rend éditable
                document
                  .getElementById(`fiche-${ficheId}-edit-button`)
                  ?.click();
                // donne le focus à son titre
                document.getElementById(`fiche-titre-${ficheId}`)?.focus();
              });
            });
        } else {
          queryClient.invalidateQueries([
            'fiches_non_classees',
            collectivite_id,
          ]);
          const url = makeCollectiviteFicheNonClasseeUrl({
            collectiviteId: collectivite_id!,
            ficheUid: data[0].id!.toString(),
          });
          openUrl(url, openInNewTab);
        }
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
