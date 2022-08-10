import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  ActionCommentaireRead,
  ActionCommentaireWrite,
} from 'generated/dataLayer';
import {useMutation, useQuery} from 'react-query';

/**
 * Permet de charger un commentaire (précision) pour une action.
 *
 * Charge tous les commentaires en une seule requête.
 *
 * @param action_id
 * @return Un ActionCommentaireRead et un bool isLoading.
 */
export const useActionCommentaire = (
  action_id: string
): {actionCommentaire: ActionCommentaireRead | null; isLoading: boolean} => {
  const collectivite_id = useCollectiviteId();
  const {data, isLoading} = useQuery<ActionCommentaireRead[] | null>(
    ['action_commentaire', collectivite_id],
    () => (collectivite_id ? read({collectivite_id, action_id}) : null)
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

const read = async ({collectivite_id}: CommentaireParams) => {
  const {data} = await supabaseClient
    .from('action_commentaire')
    .select()
    .eq('collectivite_id', collectivite_id);

  return data;
};

export const useSaveActionCommentaire = () => {
  const {
    isLoading,
    mutate: saveActionCommentaire,
    data: lastReply,
  } = useMutation(write);

  return {
    isLoading,
    saveActionCommentaire,
    lastReply,
  };
};

const write = async (commentaire: ActionCommentaireWrite) =>
  supabaseClient.from('action_commentaire').upsert([commentaire], {
    onConflict: 'collectivite_id,action_id',
  });
