import {useMutation, useQueryClient} from 'react-query';
import {useHistory} from 'react-router-dom';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {FicheAction} from './types';
import {makeCollectiviteFicheNonClasseeUrl} from 'app/paths';

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

export const useCreateFicheAction = () => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const history = useHistory();

  return useMutation(
    () =>
      upsertFicheAction({
        collectivite_id: collectivite_id!,
      } as never),
    {
      meta: {disableToast: true},
      onSuccess: data => {
        queryClient.invalidateQueries(['fiches_non_classees', collectivite_id]);
        const url = makeCollectiviteFicheNonClasseeUrl({
          collectiviteId: collectivite_id!,
          ficheUid: data[0].id!.toString(),
        });
        history.push(url);
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
