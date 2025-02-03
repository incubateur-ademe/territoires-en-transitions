import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useMutation, useQueryClient } from 'react-query';

/**
 * Associe l'utilisateur courant à une collectivité.
 *
 * Quand l'appel réussi
 * - la liste des collectivités associées à l'utilisateur est rechargée.
 * - on navigue vers le tableau de bord de la collectivité nouvellement associée.
 */
export const useClaimCollectivite = () => {
  const queryClient = useQueryClient();
  const {
    isLoading,
    isSuccess,
    reset,
    data: lastReply,
    mutate: claimCollectivite,
  } = useMutation(claim, {
    onSuccess: async () => {
      await queryClient.invalidateQueries(['mes_collectivites']);
    },
  });

  return {
    isLoading,
    isSuccess,
    reset,
    claimCollectivite,
    lastReply: lastReply || null,
  };
};

const claim = async (collectiviteId: number): Promise<boolean> => {
  const { data, error } = await supabaseClient.rpc('claim_collectivite', {
    id: collectiviteId,
  });

  if (error) {
    return false;
  }
  return !!data;
};
