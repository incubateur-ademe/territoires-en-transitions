import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation, useQueryClient } from 'react-query';
import { TRemoveFromCollectivite } from './types';
import { getQueryKey } from './useCollectiviteMembres';

type RemoveMembreResponse = {
  message?: string;
};

const removeMembre = async (
  supabase: DBClient,
  collectiviteId: number,
  userEmail: string
): Promise<RemoveMembreResponse | null> => {
  const { data, error } = await supabase.rpc(
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
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const supabase = useSupabase();

  const { isLoading, mutate } = useMutation(
    (userEmail: string) =>
      collectiviteId
        ? removeMembre(supabase, collectiviteId, userEmail)
        : Promise.resolve(null),
    {
      onSuccess: () => {
        // recharge la liste après avoir retiré l'utilisateur de la collectivité
        queryClient.invalidateQueries(getQueryKey(collectiviteId));
        if (collectiviteId)
          utils.collectivites.membres.list.invalidate({ collectiviteId });
      },
    }
  );
  return {
    isLoading,
    removeFromCollectivite: mutate as TRemoveFromCollectivite,
  };
};
