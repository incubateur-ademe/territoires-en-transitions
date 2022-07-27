import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {NiveauAcces} from 'generated/dataLayer';

export interface AddUserToCollectiviteRequest {
  collectiviteId: number;
  email: string;
  niveau_acces: NiveauAcces;
}

export interface AddUserToCollectiviteResponse {
  added?: boolean;
  invitationId?: string;
  error?: string;
}

export const useAddUserToCollectivite = (req: AddUserToCollectiviteRequest) => {
  const queryClient = useQueryClient();
  const {
    isLoading,
    data,
    mutate: addUser,
  } = useMutation(addUserToCollectivite(req), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(['add_user_to_collectivite']);
    },
  });

  return {
    isLoading,
    data,
  };
};

/**
 * Ajoute un utilisateur à une collectivité donnée
 */
export const addUserToCollectivite = async (
  req: AddUserToCollectiviteRequest
): Promise<AddUserToCollectiviteResponse | null> => {
  const {data, error} = await supabaseClient.rpc('add_user', {
    collectivite_id: req.collectiviteId,
    email: req.email,
    niveau_acces: req.niveau_acces,
  });

  if (error) {
    return {error: error.message};
  }

  return (data as unknown as AddUserToCollectiviteResponse) || null;
};
