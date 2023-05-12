import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import {Database} from 'types/database.types';

/**
 * Permet de charger un commentaire (précision) pour une action.
 *
 * Charge tous les commentaires en une seule requête.
 *
 * @param action_id
 * @return Un ActionCommentaireRead et un bool isLoading.
 */
export const useActionCommentaire = (action_id: string) => {
  const collectivite_id = useCollectiviteId();
  const referentiel = getReferentielFromActionId(action_id);
  const {data, isLoading} = useReferentielCommentaires(
    collectivite_id,
    referentiel
  );
  return {
    actionCommentaire:
      data?.find(action => action.action_id === action_id) || null,
    isLoading,
  };
};

type CommentaireParams = {
  collectivite_id: number;
  action_id: string;
};

/**
 * Permet de charger les commentaires (précisions) d'une collectivité pour
 * toutes les actions d'un référentiel.
 *
 * @param action_id
 * @return Un ActionCommentaireRead et un bool isLoading.
 */
export const useReferentielCommentaires = (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  return useQuery(['action_commentaire', collectivite_id, referentiel], () =>
    collectivite_id && referentiel ? read({collectivite_id, referentiel}) : null
  );
};

const read = async ({
  collectivite_id,
  referentiel,
}: Pick<CommentaireParams, 'collectivite_id'> & {referentiel: string}) => {
  const {data} = await supabaseClient
    .from('action_commentaire')
    .select()
    .eq('collectivite_id', collectivite_id)
    .ilike('action_id', `${referentiel}%`);

  return data;
};

export const useSaveActionCommentaire = () => {
  const queryClient = useQueryClient();
  const {
    isLoading,
    mutate: saveActionCommentaire,
    data: lastReply,
  } = useMutation(write, {
    mutationKey: 'action_commentaire',
    onSuccess: (data, variables) => {
      queryClient.refetchQueries([
        'action_commentaire',
        variables.collectivite_id,
        getReferentielFromActionId(variables.action_id),
      ]);
    },
  });

  return {
    isLoading,
    saveActionCommentaire,
    lastReply,
  };
};

type ActionCommentaireWrite =
  Database['public']['Tables']['action_commentaire']['Insert'];
const write = async (commentaire: ActionCommentaireWrite) =>
  supabaseClient.from('action_commentaire').upsert([commentaire], {
    onConflict: 'collectivite_id,action_id',
  });

const getReferentielFromActionId = (action_id: string) =>
  action_id.split('_')[0];
