import { UserDetails } from '@/api/users/user-details.fetch.server';
import { trpc } from '@/api/utils/trpc/client';
import { useSendInvitation } from '@/app/app/pages/collectivite/Users/useSendInvitation';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
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
  collectivite: CurrentCollectivite,
  user: UserDetails,
  onResponse: (data: InvitationData) => void
) => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const { mutate: sendInvitation } = useSendInvitation(collectivite, user);

  const { mutate } = trpc.invitations.create.useMutation({
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

      if (collectivite.collectiviteId)
        queryClient.invalidateQueries([
          'collectivite_membres',
          collectivite.collectiviteId,
        ]);

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
