import { UserDetails } from '@/api/users/user-details.fetch.server';
import { trpc } from '@/api/utils/trpc/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSendInvitation } from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/users/_components/use-invite-member';

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
  user: UserDetails,
  onResponse: (data: InvitationData) => void
) => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const { mutate: sendInvitation } = useSendInvitation(
    collectiviteId,
    collectiviteNom,
    user
  );

  const { mutate } = trpc.users.invitations.create.useMutation({
    onSuccess: async (data, variables) => {
      if (typeof data === 'string' || data === null) {
        await sendInvitation({
          email: variables.email,
          invitationId: data ?? undefined,
        });
      }

      onResponse({
        email: variables.email,
        invitationId: data,
        added: data === null,
      });

      queryClient.invalidateQueries({
        queryKey: ['collectivite_membres', collectiviteId],
      });

      utils.collectivites.membres.list.invalidate({
        collectiviteId,
      });

      utils.collectivites.tags.personnes.list.invalidate({
        collectiviteId,
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
  });

  return { mutate };
};
