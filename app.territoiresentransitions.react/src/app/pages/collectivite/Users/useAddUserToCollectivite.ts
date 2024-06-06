import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TNiveauAcces} from 'types/alias';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {UserData} from 'core-logic/api/auth/AuthProvider';
import {useSendInvitation} from 'app/pages/collectivite/Users/useSendInvitation';

type AddUserToCollectiviteArgs = {
  email: string;
  niveau: TNiveauAcces;
};

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

/**
 * Ajoute un utilisateur à une collectivité donnée
 */
export const useAddUserToCollectivite = (
  collectivite: CurrentCollectivite,
  user: UserData
) => {
  const {collectivite_id} = collectivite;
  const queryClient = useQueryClient();
  const {mutate: sendInvitation} = useSendInvitation(collectivite, user);

  return useMutation(
    async ({email: rawEmail, niveau}: AddUserToCollectiviteArgs) => {
      const email = rawEmail.toLowerCase();
      const {data, error} = await supabaseClient.rpc('add_user', {
        collectivite_id,
        email,
        niveau,
      });

      if (error) {
        return {
          error: (error as AddUserToCollectiviteError).error,
          email,
          added: false,
        };
      }

      const response = data as unknown as AddUserToCollectiviteData;
      const invitationId = response?.invitation_id;

      // envoi le mail d'invitation
      if (invitationId) {
        await sendInvitation({email, invitationId});
      }

      return {
        added: response?.added ?? false,
        email,
        invitationId,
      };
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          'collectivite_membres',
          collectivite_id,
        ]);
      },
      meta: {
        disableToast: true,
      },
    }
  );
};

