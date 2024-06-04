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
    async ({invitationId, email}: SendInvitationArgs) => {
      const invitationUrl = makeInvitationLandingPath(invitationId);

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
            to: email.toLowerCase(),
            from: {prenom, nom, email: emailFrom},
            collectivite: nomCollectivite,
            invitationUrl,
          }),
        });
        if (status > 200) {
          throw Error("Echec de l'envoi d'email");
        }
      }

      return true;
    },
    {
      meta: {
        success: `L'invitation à rejoindre la collectivité ${collectivite.nom} a bien été envoyée`,
        error: `L'invitation n'a pas pu être envoyée`,
      },
    }
  );
};
