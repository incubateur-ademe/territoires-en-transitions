import { getAuthHeaders } from '@/api/utils/supabase/auth-session.client';
import {
  makeCollectiviteAccueilUrl,
  makeInvitationLandingPath,
} from '@/app/app/paths';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { UserData } from '@/app/users/auth-provider';
import { useMutation } from 'react-query';

export type SendInvitationArgs = {
  email: string;
  invitationId?: string;
};

/**
 * Envoi le mail d'invitation à rejoindre une collectivité donnée
 */
export const useSendInvitation = (
  collectivite: CurrentCollectivite,
  user: UserData
) => {
  const { nom: nomCollectivite } = collectivite;

  return useMutation(
    async ({ invitationId, email: rawEmail }: SendInvitationArgs) => {
      const email = rawEmail.toLowerCase();
      const url =
        window.location.origin +
        (invitationId
          ? makeInvitationLandingPath(invitationId, email)
          : makeCollectiviteAccueilUrl({
              collectiviteId: collectivite.collectiviteId,
            }));
      const urlType = invitationId ? 'invitation' : 'rattachement';

      // envoi le mail d'invitation
      const invitePath = `${process.env.NEXT_PUBLIC_AUTH_URL}/invite`;
      const { prenom, nom, email: emailFrom } = user;
      const { status } = await fetch(invitePath, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...((await getAuthHeaders()) ?? {}),
        },
        body: JSON.stringify({
          to: email,
          from: { prenom, nom, email: emailFrom },
          collectivite: nomCollectivite,
          url,
          urlType,
        }),
      });
      if (status > 200) {
        return { error: "Echec de l'envoi d'email", sent: false as const };
      }
      return {
        email,
        sent: true as const,
      };
    },
    {
      meta: {
        disableToast: true,
      },
    }
  );
};
