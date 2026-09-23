import { useCollectiviteId } from '@tet/api/collectivites';
import { AddFileHandler } from './add-document/add-file';
import { AddLinkHandler } from './add-document/add-link';
import {
  useAddPreuveComplementaire,
  useAddPreuveReglementaire,
} from './use-add-preuves';

type AddPreuveHandlers = {
  addFile: AddFileHandler;
  addLink: AddLinkHandler;
};

export const useAddPreuveComplementaireToAction = (
  actionId: string
): AddPreuveHandlers => {
  const collectiviteId = useCollectiviteId();
  const {
    mutate: addPreuveComplementaireSync,
    mutateAsync: addPreuveComplementaire,
  } = useAddPreuveComplementaire();

  const addFile: AddFileHandler = async (fichierId) => {
    if (collectiviteId) {
      const preuve = await addPreuveComplementaire({
        actionId,
        collectiviteId,
        commentaire: '',
        fichierId,
      });

      return { documentId: preuve.id };
    }
  };

  const addLink: AddLinkHandler = (titre, url) => {
    if (collectiviteId) {
      addPreuveComplementaireSync({
        actionId,
        collectiviteId,
        commentaire: '',
        lien: { titre, url },
      });
    }
  };

  return {
    addFile,
    addLink,
  };
};

export const useAddPreuveReglementaireToAction = (
  preuveId: string
): AddPreuveHandlers => {
  const collectiviteId = useCollectiviteId();
  const {
    mutate: addPreuveReglementaireSync,
    mutateAsync: addPreuveReglementaire,
  } = useAddPreuveReglementaire();

  const addFile: AddFileHandler = async (fichierId) => {
    if (collectiviteId) {
      const preuve = await addPreuveReglementaire({
        preuveId,
        collectiviteId,
        commentaire: '',
        fichierId,
      });

      return { documentId: preuve.id };
    }
  };

  const addLink: AddLinkHandler = (titre, url) => {
    if (collectiviteId) {
      addPreuveReglementaireSync({
        preuveId,
        collectiviteId,
        commentaire: '',
        lien: { titre, url },
      });
    }
  };

  return {
    addFile,
    addLink,
  };
};
