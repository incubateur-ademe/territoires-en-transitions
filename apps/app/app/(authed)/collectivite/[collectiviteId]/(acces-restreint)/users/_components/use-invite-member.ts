import {
  makeCollectiviteAccueilUrl,
  makeInvitationLandingPath,
} from '@/app/app/paths';
import { useMutation } from '@tanstack/react-query';
import { useUserSession } from '@tet/api/users';
import { getAuthHeaders } from '@tet/api/utils/supabase/get-auth-headers';
import { UserWithRolesAndPermissions } from '@tet/domain/users';

export type SendInvitationArgs = {
  email: string;
  invitationId?: string;
};

export type SendInvitationData =
  | {
      email?: string;
      sent: boolean;
      error?: string;
    }
  | undefined;

/**
 * Envoi le mail d'invitation à rejoindre une collectivité donnée
 */
export const useSendInvitation = (
  collectiviteId: number,
  collectiviteName: string,
  user: UserWithRolesAndPermissions
) => {
  const session = useUserSession();

  return useMutation({
    mutationFn: async ({
      invitationId,
      email: rawEmail,
    }: SendInvitationArgs) => {
      const email = rawEmail.toLowerCase();
      const url =
        window.location.origin +
        (invitationId
          ? makeInvitationLandingPath(invitationId, email)
          : makeCollectiviteAccueilUrl({
              collectiviteId,
            }));
      const urlType = invitationId ? 'invitation' : 'rattachement';

      // envoi le mail d'invitation
      const invitePath = `${process.env.NEXT_PUBLIC_AUTH_URL}/invite`;
      const { prenom, nom, email: emailFrom } = user;
      const result = await fetch(invitePath, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(await getAuthHeaders(session)),
        },
        body: JSON.stringify({
          to: email,
          from: { prenom, nom, email: emailFrom },
          collectivite: collectiviteName,
          url,
          urlType,
        }),
      });
      if (!result.ok) {
        return {
          error:
            "L'invitation à rejoindre la collectivité n'a pas pu être envoyée",
          sent: false as const,
        };
      }
      return {
        email,
        sent: true as const,
      };
    },

    meta: {
      disableToast: true,
    },
  });
};
