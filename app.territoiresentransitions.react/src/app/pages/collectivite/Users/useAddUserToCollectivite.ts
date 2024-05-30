import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TNiveauAcces} from 'types/alias';
import {makeInvitationLandingPath} from 'app/paths';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {getAuthBaseUrl} from '@tet/api';
import {UserData} from 'core-logic/api/auth/AuthProvider';
import {useAuthHeaders} from 'core-logic/api/auth/useCurrentSession';

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
  const {collectivite_id, nom: nomCollectivite} = collectivite;
  const authHeaders = useAuthHeaders();
  const queryClient = useQueryClient();

  return useMutation(
    async ({email, niveau}: AddUserToCollectiviteArgs) => {
      const {data, error} = await supabaseClient.rpc('add_user', {
        collectivite_id,
        email: email?.toLowerCase(),
        niveau,
      });

      if (error) {
        return {
          error: (error as AddUserToCollectiviteError).error,
          added: false,
        };
      }

      const response = data as unknown as AddUserToCollectiviteData;
      const invitationUrl = response?.invitation_id
        ? makeInvitationLandingPath(response?.invitation_id)
        : undefined;

      // envoi le mail d'invitation
      if (invitationUrl) {
        const invitePath = `${getAuthBaseUrl(
          document.location.hostname
        )}/invite`;
        const {prenom, nom, email: emailFrom} = user;
        const {status} = await fetch(invitePath, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({
            to: email?.toLowerCase(),
            niveau,
            from: {prenom, nom, email: emailFrom},
            collectivite: nomCollectivite,
            invitationUrl,
          }),
        });
        if (status > 200) {
          return {error: "Echec de l'envoi d'email", added: false};
        }
      }

      return {
        invitationUrl,
        added: response?.added ?? false,
      };
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          'collectivite_membres',
          collectivite_id,
        ]);
      },
    }
  );
};

