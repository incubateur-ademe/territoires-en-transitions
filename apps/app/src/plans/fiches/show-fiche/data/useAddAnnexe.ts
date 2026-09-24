import { AddFileHandler } from '@/app/collectivites/documents/add-document/add-file';
import { AddLinkHandler } from '@/app/collectivites/documents/add-document/add-link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

type AddAnnexeHandlers = {
  addFile: AddFileHandler;
  addLink: AddLinkHandler;
  isLoading: boolean;
  isError: boolean;
};

export const useAddAnnexe = (ficheId: number): AddAnnexeHandlers => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const {
    mutate: addAnnexeSync,
    mutateAsync: addAnnexe,
    isPending,
    isError,
  } = useMutation(
    trpc.plans.fiches.addAnnexe.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.ficheAnnexes.pathKey(),
        });
      },
    })
  );

  const addFile: AddFileHandler = async (fichierId) => {
    const annexe = await addAnnexe({
      ficheId,
      commentaire: '',
      fichierId,
    });

    return { documentId: annexe.id };
  };

  const addLink: AddLinkHandler = (titre, url) => {
    addAnnexeSync({ ficheId, commentaire: '', lien: { titre, url } });
  };

  return {
    addFile,
    addLink,
    isLoading: isPending,
    isError,
  };
};
