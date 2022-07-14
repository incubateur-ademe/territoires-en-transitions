import {useMutation, useQueryClient} from 'react-query';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {removeUser} from 'core-logic/api/procedures/collectiviteProcedures';
import {TRemoveFromCollectivite} from './types';
import {getQueryKey} from './useCollectiviteMembres';

/**
 * Retire un utilisateur de la collectivité courante
 */

export const useRemoveFromCollectivite = () => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const {isLoading, mutate} = useMutation(
    (user_id: string) =>
      collectivite_id
        ? removeUser(collectivite_id, user_id)
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
