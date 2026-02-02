import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { useSendInvitation } from './use-invite-member';

export type InvitationData =
  | {
      email: string;
      added: boolean;
      invitationId?: string | null;
      error?: string;
    }
  | undefined;

export const useCreateInvitation = (
  collectiviteId: number,
  collectiviteNom: string,
  user: UserWithRolesAndPermissions
) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutate: sendInvitation } = useSendInvitation(
    collectiviteId,
    collectiviteNom,
    user
  );

  const { setToast } = useToastContext();

  return useMutation(
    trpc.users.invitations.create.mutationOptions({
      onSuccess: async (data, variables) => {
        // envoi le mail que l'utilisateur existe déjà ou non
        sendInvitation({
          email: variables.email,
          invitationId: data ?? undefined,
        });

        // affiche directement une notification si l'utilisateur a déjà un
        // compte sur la plateforme, sinon l'affichage sera fait après l'envoi
        // de l'invitation
        if (!data) {
          setToast(
            'success',
            'Nouveau membre ajouté avec succès à la collectivité !'
          );
        }

        queryClient.invalidateQueries({
          queryKey: ['collectivite_membres', collectiviteId],
        });

        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.membres.list.queryKey({
            collectiviteId,
          }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.tags.personnes.list.queryKey({
            collectiviteId,
          }),
        });
      },
      onError: async (error) => {
        // on peut recevoir un message déjà formaté
        // TODO: utiliser le pattern Result<> dans le service pour distinguer de
        // manière explicite le cas où l'utilisateur est déjà rattaché à la
        // collectivité
        setToast(
          'error',
          error.message ||
            "L'utilisateur n'a pas pu être ajouté à la collectivité"
        );
      },
      meta: {
        disableToast: true,
      },
    })
  );
};
