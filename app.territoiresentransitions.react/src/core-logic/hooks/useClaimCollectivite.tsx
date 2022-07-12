import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';

// rattache l'utilisateur courant à une collectivité
// la liste des collectivités associées à l'utilisateur est rechargée quand l'appel réussi
export const useClaimCollectivite = () => {
  const queryClient = useQueryClient();
  const {
    isLoading,
    data: lastReply,
    mutate: claimCollectivite,
  } = useMutation(claim, {
    onSuccess: () => {
      queryClient.invalidateQueries(['mes_collectivitess']);
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
