import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

export type SendInvitationArgs = {
  email: string;
  invitationId?: string;
};

/**
 * Envoi le mail d'invitation à rejoindre une collectivité donnée.
 *
 * Le backend reconstruit l'URL, le contenu du mail et l'identité de
 * l'expéditeur (IDs only côté client — ORHUS-302 / pentest V3).
 */
export const useSendInvitation = () => {
  const trpc = useTRPC();
  const { collectiviteId } = useCurrentCollectivite();
  const { setToast } = useToastContext();

  const mutation = useMutation(
    trpc.collectivites.membres.invitations.send.mutationOptions({
      onSuccess: (_data, variables) => {
        if (variables.urlType === 'invitation') {
          setToast(
            'success',
            "L'invitation à rejoindre la collectivité a été envoyée"
          );
        }
      },
      meta: {
        error:
          "L'invitation à rejoindre la collectivité n'a pas pu être envoyée",
      },
    })
  );

  return {
    ...mutation,
    mutate: (args: SendInvitationArgs) => {
      if (args.invitationId) {
        return mutation.mutate({
          urlType: 'invitation',
          invitationId: args.invitationId,
        });
      }
      return mutation.mutate({
        urlType: 'rattachement',
        collectiviteId,
        to: args.email.toLowerCase(),
      });
    },
  };
};
