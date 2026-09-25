import { AddFileHandler } from '@/app/collectivites/documents/add-document/add-file';
import { AddLinkHandler } from '@/app/collectivites/documents/add-document/add-link';
import { useAddPreuveRapport } from '@/app/collectivites/documents/use-add-preuves';
import { useCollectiviteId } from '@tet/api/collectivites';

type AddRapportVisiteHandlers = {
  addFile: AddFileHandler;
  addLink: AddLinkHandler;
};

export const useAddRapportVisite = (date: string): AddRapportVisiteHandlers => {
  const collectiviteId = useCollectiviteId();
  const { mutate: addPreuve } = useAddPreuveRapport();

  const addFile: AddFileHandler = (fichierId) => {
    if (collectiviteId) {
      addPreuve({
        collectiviteId,
        commentaire: '',
        fichierId,
        date: new Date(date).toISOString(),
      });
    }
  };

  const addLink: AddLinkHandler = (titre, url) => {
    if (collectiviteId) {
      addPreuve({
        collectiviteId,
        commentaire: '',
        lien: { titre, url },
        date: new Date(date).toISOString(),
      });
    }
  };

  return {
    addFile,
    addLink,
  };
};
