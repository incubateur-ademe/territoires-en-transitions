import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {makeCollectiviteTableauBordUrl} from 'app/paths';
import {useHistory} from 'react-router-dom';

/**
 * Associe l'utilisateur courant à une collectivité.
 *
 * Quand l'appel réussi
 * - la liste des collectivités associées à l'utilisateur est rechargée.
 * - on navigue vers le tableau de bord de la collectivité nouvellement associée.
 */
export const useClaimCollectivite = () => {
  const queryClient = useQueryClient();
  const history = useHistory();
  const {
    isLoading,
    data: lastReply,
    mutate: claimCollectivite,
  } = useMutation(claim, {
    onSuccess: async (success, collectivite_id) => {
      await queryClient.invalidateQueries(['mes_collectivites']);
      history.push(
        makeCollectiviteTableauBordUrl({
          collectiviteId: collectivite_id,
        })
      );
    },
  });

  return {
    isLoading,
    claimCollectivite,
    lastReply: lastReply || null,
  };
};

const claim = async (collectiviteId: number): Promise<boolean> => {
  const {data, error} = await supabaseClient.rpc('claim_collectivite', {
    id: collectiviteId,
  });

  if (error) {
    return false;
  }
  return !!data;
};
