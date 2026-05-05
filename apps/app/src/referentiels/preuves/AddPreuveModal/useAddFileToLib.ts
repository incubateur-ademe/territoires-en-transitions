import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/** Ajoute le fichier dans la bibliothèque */
export const useAddFileToLib = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { isPending, mutateAsync } = useMutation(
    trpc.collectivites.documents.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.documents.list.queryKey(),
        });
      },
    })
  );
  return { isPending, addFileToLib: mutateAsync };
};
