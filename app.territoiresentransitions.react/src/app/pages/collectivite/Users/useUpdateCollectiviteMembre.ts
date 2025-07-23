import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from 'react-query';
import { TUpdateMembre, TUpdateMembreArgs } from './types';

/**
 * Met à jour une propriété d'un des membres de la collectivité courante
 */
export const useUpdateCollectiviteMembre = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  // associe la fonction d'update avec l'id de la collectivité
  const collectiviteId = useCollectiviteId();
  const updateCollectiviteMembre = (
    args: TUpdateMembreArgs
  ): Promise<boolean> =>
    collectiviteId
      ? updateMembre(supabase, { collectiviteId, ...args })
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

const updateMembre = async (
  supabase: DBClient,
  {
    collectiviteId,
    membre_id,
    name,
    value,
  }: TUpdateMembreArgs & { collectiviteId: number }
) => {
  const { error } = await supabase
    .rpc(fieldNameToRPCName(name) as any, {
      collectivite_id: collectiviteId,
      membre_id,
      [name]: value,
    })
    .select();
  return Boolean(error);
};
