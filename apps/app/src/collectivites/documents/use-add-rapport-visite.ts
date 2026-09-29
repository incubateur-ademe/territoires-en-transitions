import { AddDocumentTabsHandlers } from './add-document/add-document.tabs';
import { useInvalidateDocuments } from './use-invalidate-documents';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

type AddRapportVisiteHandlers = Required<AddDocumentTabsHandlers>;

export const useAddRapportVisite = (date: string): AddRapportVisiteHandlers => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const invalidateDocuments = useInvalidateDocuments();

  const { mutate } = useMutation(
    trpc.collectivites.documents.addRapportVisite.mutationOptions({
      onSuccess: () => {
        void invalidateDocuments({ type: 'rapportVisite' });
      },
    })
  );

  return {
    addFile: (fichierId) => mutate({ collectiviteId, date, fichierId }),
    addLink: (titre, url) =>
      mutate({ collectiviteId, date, lien: { titre, url } }),
  };
};
