import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** Ajoute le fichier dans la bibliothèque */
export const useAddFileToLib = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { isPending, mutateAsync } = useMutation(
    trpc.collectivites.documents.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['bibliotheque_fichier'],
        });
      },
    })
  );
  return { isPending, addFileToLib: mutateAsync };
};
