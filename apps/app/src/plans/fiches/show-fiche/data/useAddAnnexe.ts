import { AddDocumentTabsHandlers } from '@/app/collectivites/documents/add-document/add-document.tabs';
import { useInvalidateDocuments } from '@/app/collectivites/documents/use-invalidate-documents';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

type AddAnnexeHandlers = Required<AddDocumentTabsHandlers> & {
  isLoading: boolean;
  isError: boolean;
};

export const useAddAnnexe = (ficheId: number): AddAnnexeHandlers => {
  const trpc = useTRPC();
  const invalidateDocuments = useInvalidateDocuments();

  const {
    mutate: addAnnexeSync,
    mutateAsync: addAnnexe,
    isPending,
    isError,
  } = useMutation(
    trpc.plans.fiches.addAnnexe.mutationOptions({
      onSuccess: () => {
        void invalidateDocuments({ type: 'ficheAction' });
      },
    })
  );

  return {
    addFile: async (fichierId) => {
      const annexe = await addAnnexe({ ficheId, commentaire: '', fichierId });
      return { documentId: annexe.id };
    },
    addLink: (titre, url) => {
      addAnnexeSync({ ficheId, commentaire: '', lien: { titre, url } });
    },
    isLoading: isPending,
    isError,
  };
};
