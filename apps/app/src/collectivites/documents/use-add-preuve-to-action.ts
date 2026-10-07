import { useCollectiviteId } from '@tet/api/collectivites';
import { AddDocumentTabsHandlers } from './add-document/add-document.tabs';
import {
  useAddPreuveComplementaire,
  useAddPreuveReglementaire,
} from './use-add-preuves';

type AddPreuveHandlers = Required<AddDocumentTabsHandlers>;

export const useAddPreuveComplementaireToAction = (
  actionId: string
): AddPreuveHandlers => {
  const collectiviteId = useCollectiviteId();
  const { mutate, mutateAsync } = useAddPreuveComplementaire();
  const input = { actionId, collectiviteId, commentaire: '' };

  return {
    addFile: async (fichierId) => {
      const preuve = await mutateAsync({ ...input, fichierId });
      return { documentId: preuve.id };
    },
    addLink: (titre, url) => mutate({ ...input, lien: { titre, url } }),
  };
};

export const useAddPreuveReglementaireToAction = (
  preuveId: string
): AddPreuveHandlers => {
  const collectiviteId = useCollectiviteId();
  const { mutate, mutateAsync } = useAddPreuveReglementaire();
  const input = { preuveId, collectiviteId, commentaire: '' };

  return {
    addFile: async (fichierId) => {
      const preuve = await mutateAsync({ ...input, fichierId });
      return { documentId: preuve.id };
    },
    addLink: (titre, url) => mutate({ ...input, lien: { titre, url } }),
  };
};
