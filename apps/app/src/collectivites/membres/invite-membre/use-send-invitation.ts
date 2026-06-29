import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation } from '@tanstack/react-query';
import { useCurrentCollectivite } from '@tet/api/collectivites';

export type SendInvitationArgs = {
  email: string;
  invitationId?: string;
};

/**
 * Envoi le mail d'invitation à rejoindre une collectivité donnée.
 *
 * Depuis le correctif TET-7331 (pentest V3), seuls les identifiants
 * (`invitationId` ou `collectiviteId`) sont transmis : l'URL et le contenu du
 * mail sont reconstruits côté serveur à partir d'`APP_URL` pour empêcher tout
 * détournement du lien.
 */
export const useSendInvitation = () => {
  const { setToast } = useToastContext();
  const { user, collectiviteId, collectiviteNom } = useCurrentCollectivite();

  return useMutation({
    mutationFn: async ({
      invitationId,
      email: rawEmail,
    }: SendInvitationArgs) => {
      const email = rawEmail.toLowerCase();

      const invitePath = '/invite';
      const { prenom, nom, email: emailFrom } = user;
      const body = invitationId
        ? {
            urlType: 'invitation' as const,
            invitationId,
            to: email,
            from: { prenom, nom, email: emailFrom },
            collectivite: collectiviteNom,
          }
        : {
            urlType: 'rattachement' as const,
            collectiviteId,
            to: email,
            from: { prenom, nom, email: emailFrom },
            collectivite: collectiviteNom,
          };

      return fetch(invitePath, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    },
    onSuccess: async (data, variables) => {
      if (data.ok && variables.invitationId) {
        setToast(
          'success',
          "L'invitation à rejoindre la collectivité a été envoyée"
        );
      }
    },
    meta: {
      error: "L'invitation à rejoindre la collectivité n'a pas pu être envoyée",
    },
  });
};
