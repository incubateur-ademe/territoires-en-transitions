import { AddFileHandler } from './add-document/add-file';
import { AddLinkHandler } from './add-document/add-link';
import { useInvalidateDocuments } from './use-invalidate-documents';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

type AddRapportVisiteHandlers = {
  addFile: AddFileHandler;
  addLink: AddLinkHandler;
};

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

  const addFile: AddFileHandler = (fichierId) =>
    mutate({ collectiviteId, date, fichierId });

  const addLink: AddLinkHandler = (titre, url) =>
    mutate({ collectiviteId, date, lien: { titre, url } });

  return {
    addFile,
    addLink,
  };
};
