import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { UserWithCollectiviteAccesses } from '@tet/domain/users';
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
  user: UserWithCollectiviteAccesses,
  onResponse: (data: InvitationData) => void
) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutate: sendInvitation } = useSendInvitation(
    collectiviteId,
    collectiviteNom,
    user
  );

  return useMutation(
    trpc.users.invitations.create.mutationOptions({
      onSuccess: async (data, variables) => {
        if (typeof data === 'string' || data === null) {
          await sendInvitation({
            email: variables.email,
            invitationId: data ?? undefined,
          });
        }

        onResponse({
          email: variables.email,
          invitationId: data ?? undefined,
          added: data === null,
        });

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
      onError: (error, variables) => {
        onResponse({
          email: variables.email,
          added: false,
          error: error.message,
        });
      },
      meta: {
        disableToast: true,
      },
    })
  );
};
