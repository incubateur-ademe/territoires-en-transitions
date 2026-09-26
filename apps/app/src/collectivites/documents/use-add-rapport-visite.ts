import { AddFileHandler } from './add-document/add-file';
import { AddLinkHandler } from './add-document/add-link';
import { invalidateQueries } from './use-add-preuves';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

type AddRapportVisiteHandlers = {
  addFile: AddFileHandler;
  addLink: AddLinkHandler;
};

export const useAddRapportVisite = (date: string): AddRapportVisiteHandlers => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutate } = useMutation(
    trpc.collectivites.documents.addRapportVisite.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidateQueries({
          queryClient,
          collectiviteId: variables.collectiviteId,
          trpc,
        });
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
