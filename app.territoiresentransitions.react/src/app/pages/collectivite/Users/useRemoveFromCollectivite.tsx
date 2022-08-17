import {useMutation, useQueryClient} from 'react-query';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TRemoveFromCollectivite} from './types';
import {getQueryKey} from './useCollectiviteMembres';
import {supabaseClient} from 'core-logic/api/supabase';

type RemoveMembreResponse = {
  message?: string;
};

const removeMembre = async (
  collectiviteId: number,
  userEmail: string
): Promise<RemoveMembreResponse | null> => {
  const {data, error} = await supabaseClient.rpc(
    'remove_membre_from_collectivite',
    {
      email: userEmail,
      collectivite_id: collectiviteId,
    }
  );

  if (error || !data) {
    return null;
  }
  return data as unknown as RemoveMembreResponse;
};

/**
 * Retire un membre de la collectivité courante
 */
export const useRemoveFromCollectivite = () => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const {isLoading, mutate} = useMutation(
    (userEmail: string) =>
      collectivite_id
        ? removeMembre(collectivite_id, userEmail)
        : Promise.resolve(null),
    {
      onSuccess: () => {
        // recharge la liste après avoir retiré l'utilisateur de la collectivité
        queryClient.invalidateQueries(getQueryKey(collectivite_id));
      },
    }
  );
  return {
    isLoading,
    removeFromCollectivite: mutate as TRemoveFromCollectivite,
  };
};
