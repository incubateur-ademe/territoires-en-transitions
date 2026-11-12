import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useSaveCollectivite = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.collectivites.collectivites.upsert.mutationOptions({
      // Le résultat (succès ou erreur) s'affiche à côté du bouton : pas de toast.
      meta: { disableToast: true },
    })
  );
};
