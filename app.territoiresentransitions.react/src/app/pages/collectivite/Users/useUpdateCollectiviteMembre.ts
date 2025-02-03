import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation, useQueryClient } from 'react-query';
import { TUpdateMembre, TUpdateMembreArgs } from './types';

/**
 * Met à jour une propriété d'un des membres de la collectivité courante
 */
export const useUpdateCollectiviteMembre = () => {
  const queryClient = useQueryClient();

  // associe la fonction d'update avec l'id de la collectivité
  const collectiviteId = useCollectiviteId();
  const updateCollectiviteMembre = (
    args: TUpdateMembreArgs
  ): Promise<boolean> =>
    collectiviteId
      ? updateMembre({ collectiviteId, ...args })
      : Promise.resolve(false);

  const utils = trpc.useUtils();
  const { isLoading, mutate } = useMutation(updateCollectiviteMembre, {
    onSuccess: () => {
      // recharge les données après un changement
      queryClient.invalidateQueries(['collectivite_membres']);
      if (collectiviteId)
        utils.collectivites.membres.list.invalidate({ collectiviteId });
    },
  });

  return {
    isLoading,
    updateMembre: mutate as TUpdateMembre,
  };
};

const fieldNameToRPCName = (name: TUpdateMembreArgs['name']) =>
  `update_collectivite_membre_${name}`;

const updateMembre = async ({
  collectiviteId,
  membre_id,
  name,
  value,
}: TUpdateMembreArgs & { collectiviteId: number }) => {
  const { error } = await supabaseClient
    .rpc(fieldNameToRPCName(name) as any, {
      collectivite_id: collectiviteId,
      membre_id,
      [name]: value,
    })
    .select();
  return Boolean(error);
};
