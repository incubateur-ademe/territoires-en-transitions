import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import { trpc } from '@/api/utils/trpc/client';
import { useSendInvitation } from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/users/_components/use-invite-member';
import { useQueryClient } from 'react-query';

export type InvitationData =
  | {
      email: string;
      added: boolean;
      invitationId?: string | null;
      error?: string;
    }
  | undefined;

export const useCreateInvitation = (
  collectivite: CollectiviteNiveauAcces,
  user: UserDetails,
  onResponse: (data: InvitationData) => void
) => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const { mutate: sendInvitation } = useSendInvitation(
    collectivite,
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

      queryClient.invalidateQueries(['collectivite_membres', collectivite.collectiviteId]);

      utils.collectivites.membres.list.invalidate({
        collectiviteId: collectivite.collectiviteId,
      });

      utils.collectivites.tags.personnes.list.invalidate({
        collectiviteId: collectivite.collectiviteId,
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
