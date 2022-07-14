import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TUpdateMembre, TUpdateMembreArgs} from './types';
import {useCollectiviteId} from 'core-logic/hooks/params';

/**
 * Met à jour une propriété d'un des membres de la collectivité courante
 */
export const useUpdateCollectiviteMembre = () => {
  const queryClient = useQueryClient();

  // associe la fonction d'update avec l'id de la collectivité
  const collectivite_id = useCollectiviteId();
  const updateCollectiviteMembre = (
    args: TUpdateMembreArgs
  ): Promise<boolean> =>
    collectivite_id
      ? updateMembre({collectivite_id, ...args})
      : Promise.resolve(false);

  const {isLoading, mutate} = useMutation(updateCollectiviteMembre, {
    onSuccess: () => {
      // recharge les données après un changement
      queryClient.invalidateQueries(['collectivite_membres']);
    },
  });

  return {
    isLoading,
    updateMembre: mutate as TUpdateMembre,
  };
};

const fieldNameToRPCName = (name: string) =>
  `update_collectivite_membre_${name}`;

const updateMembre = async ({
  collectivite_id,
  membre_id,
  name,
  value,
}: TUpdateMembreArgs & {collectivite_id: number}) => {
  const {error} = await supabaseClient
    .rpc(fieldNameToRPCName(name), {collectivite_id, membre_id, [name]: value})
    .select();
  return Boolean(error);
};
