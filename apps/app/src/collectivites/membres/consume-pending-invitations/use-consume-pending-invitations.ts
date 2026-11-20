import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { ConsumedInvitations } from './consume-pending-invitations.landing';

/**
 * Reprend les invitations adressées à l'email du compte qui vient de se
 * connecter sans passer par le lien du mail. Ne bloque jamais la suite du
 * parcours : un échec vaut « aucune invitation reprise ».
 */
export const useConsumePendingInvitations = () => {
  const trpc = useTRPC();
  const { mutateAsync } = useMutation(
    trpc.collectivites.membres.invitations.consumePendings.mutationOptions({
      meta: { disableToast: true },
    })
  );

  return async (): Promise<ConsumedInvitations> => {
    try {
      return await mutateAsync();
    } catch {
      return [];
    }
  };
};
