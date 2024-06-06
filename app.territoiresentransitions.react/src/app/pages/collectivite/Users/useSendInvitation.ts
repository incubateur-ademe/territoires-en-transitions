import {useMutation} from 'react-query';
import {makeInvitationLandingPath} from 'app/paths';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {getAuthBaseUrl} from '@tet/api';
import {UserData} from 'core-logic/api/auth/AuthProvider';
import {useAuthHeaders} from 'core-logic/api/auth/useCurrentSession';

export type SendInvitationArgs = {
  email: string;
  invitationId: string;
};

/**
 * Envoi le mail d'invitation à rejoindre une collectivité donnée
 */
export const useSendInvitation = (
  collectivite: CurrentCollectivite,
  user: UserData
) => {
  const {nom: nomCollectivite} = collectivite;
  const authHeaders = useAuthHeaders();

  return useMutation(
    async ({invitationId, email: rawEmail}: SendInvitationArgs) => {
      const invitationUrl = makeInvitationLandingPath(invitationId);
      const email = rawEmail.toLowerCase();

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
            to: email,
            from: {prenom, nom, email: emailFrom},
            collectivite: nomCollectivite,
            invitationUrl,
          }),
        });
        if (status > 200) {
          return {error: "Echec de l'envoi d'email"};
        }
        return {
          email,
          sent: true,
        };
      }

      return {
        email,
        sent: false,
      };
    },
    {
      meta: {
        disableToast: true,
      },
    }
  );
};
