import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {NiveauAcces} from 'generated/dataLayer';
import {makeInvitationLandingPath} from 'app/paths';

export interface AddUserToCollectiviteRequest {
  collectiviteId: number;
  email: string;
  niveauAcces: NiveauAcces;
}

export interface AddUserToCollectiviteResponse {
  invitationUrl?: string;
  error?: string;
  added: boolean;
}

interface AddUserToCollectiviteError {
  error?: string;
}

interface AddUserToCollectiviteData {
  invitation_id?: string;
  added: boolean;
}

export const useAddUserToCollectivite = () => {
  const queryClient = useQueryClient();
  const {
    mutate: addUser,
    data: addUserResponse,
    reset: resetAddUser,
  } = useMutation(addUserToCollectivite, {
    onSuccess: (_, {collectiviteId}) => {
      queryClient.invalidateQueries(['collectivite_membres', collectiviteId]);
    },
  });

  return {
    addUserResponse: addUserResponse || null,
    addUser,
    resetAddUser,
  };
};

/**
 * Ajoute un utilisateur à une collectivité donnée
 */
const addUserToCollectivite = async (
  req: AddUserToCollectiviteRequest
): Promise<AddUserToCollectiviteResponse | null> => {
  const {data, error} = await supabaseClient.rpc('add_user', {
    collectivite_id: req.collectiviteId,
    email: req.email,
    niveau: req.niveauAcces,
  });
  if (error) {
    return {error: (error as AddUserToCollectiviteError).error, added: false};
  }
  const response = data as unknown as AddUserToCollectiviteData;
  const invitationUrl = response?.invitation_id
    ? makeInvitationLandingPath(response?.invitation_id)
    : undefined;
  return {
    invitationUrl: invitationUrl,
    added: response?.added ?? false,
  };
};
