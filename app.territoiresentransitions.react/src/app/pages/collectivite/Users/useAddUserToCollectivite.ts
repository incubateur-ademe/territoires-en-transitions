import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { trpc } from '@/api/utils/trpc/client';
import { useSendInvitation } from '@/app/app/pages/collectivite/Users/useSendInvitation';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { TNiveauAcces } from '@/app/types/alias';
import { UserDetails } from '@/app/users/fetch-user-details.server';
import { useMutation, useQueryClient } from 'react-query';

type AddUserToCollectiviteArgs = {
  email: string;
  niveau: TNiveauAcces;
};

export interface AddUserToCollectiviteResponse {
  invitationUrl?: string;
  error?: string;
  added: boolean;
}

interface AddUserToCollectiviteError {
  error?: string;
}

interface AddUserToCollectiviteData {
  invitation_id?: string;
  added: boolean;
}

/**
 * Ajoute un utilisateur à une collectivité donnée
 */
export const useAddUserToCollectivite = (
  collectivite: CurrentCollectivite,
  user: UserDetails
) => {
  const { collectiviteId: collectiviteId } = collectivite;
  const queryClient = useQueryClient();
  const { mutate: sendInvitation } = useSendInvitation(collectivite, user);
  const utils = trpc.useUtils();

  return useMutation(
    async ({ email: rawEmail, niveau }: AddUserToCollectiviteArgs) => {
      const email = rawEmail.toLowerCase();
      const { data, error } = await supabaseClient.rpc('add_user', {
        collectivite_id: collectiviteId,
        email,
        niveau,
      });

      if (error) {
        return {
          error: (error as AddUserToCollectiviteError).error,
          email,
          added: false,
        };
      }

      const response = data as unknown as AddUserToCollectiviteData;
      const invitationId = response?.invitation_id;

      // envoi le mail d'invitation ou un mail de notification du rattachement à la collectivité
      if (invitationId || response.added) {
        await sendInvitation({ email, invitationId });
      }

      return {
        added: response?.added ?? false,
        email,
        invitationId,
      };
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['collectivite_membres', collectiviteId]);
        if (collectiviteId)
          utils.collectivites.membres.list.invalidate({ collectiviteId });
      },
      meta: {
        disableToast: true,
      },
    }
  );
};
