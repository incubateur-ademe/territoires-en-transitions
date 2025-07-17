import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Membre } from './types';
import { getQueryKey } from './useCollectiviteMembres';

type RemoveMembreResponse = {
  message?: string;
};

const removeMembre = async (
  supabase: DBClient,
  collectiviteId: number,
  userEmail: string
): Promise<RemoveMembreResponse | null> => {
  const { data, error } = await supabase.rpc(
    'remove_membre_from_collectivite',
    {
      email: userEmail,
      collectivite_id: collectiviteId,
    }
  );

  if (error || !data) {
    return null;
  }
  return data as unknown as RemoveMembreResponse;
};

/**
 * Retire un membre de la collectivité courante
 * Utilise le endpoint tRPC pour les invitations en attente et la fonction PostgreSQL pour les vrais utilisateurs
 */
export const useRemoveFromCollectivite = () => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const supabase = useSupabase();

  const deletePendingInvitationMutation =
    trpc.users.invitations.deletePending.useMutation();

  const { isPending, mutate } = useMutation({
    mutationFn: async (membre: Membre) => {
      if (!collectiviteId) return null;

      // Si c'est une invitation en attente
      if (membre.invitation_id) {
        const wasDeleted = await deletePendingInvitationMutation.mutateAsync({
          email: membre.email,
          collectiviteId,
        });

        if (wasDeleted) {
          return { message: "L'invitation a été supprimée." };
        } else {
          return { message: 'Aucune invitation en attente trouvée.' };
        }
      } else {
        // Si c'est un vrai utilisateur, utilise la fonction PostgreSQL
        // (en attendant de migrer vers un appel backend)
        return removeMembre(supabase, collectiviteId, membre.email);
      }
    },

    onSuccess: () => {
      // recharge la liste après avoir retiré l'utilisateur de la collectivité
      queryClient.invalidateQueries({ queryKey: getQueryKey(collectiviteId) });

      utils.collectivites.membres.list.invalidate({ collectiviteId });
      utils.collectivites.tags.personnes.list.invalidate({
        collectiviteId,
      });
    },
  });

  return {
    isLoading: isPending || deletePendingInvitationMutation.isPending,
    removeFromCollectivite: mutate,
  };
};
