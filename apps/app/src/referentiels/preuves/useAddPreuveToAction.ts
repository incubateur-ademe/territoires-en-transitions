import { useCollectiviteId } from '@tet/api/collectivites';
import { AddFileFromLibHandler } from './AddPreuveModal/AddFile';
import { AddLinkHandler } from './AddPreuveModal/AddLink';
import {
  useAddPreuveComplementaire,
  useAddPreuveReglementaire,
} from './useAddPreuves';

type AddPreuveHandlers = {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: AddFileFromLibHandler;
  /** ajoute un lien */
  addLink: AddLinkHandler;
};

/** Renvoie les gestionnaires d'événement du dialogue d'ajout de liens et
 * fichiers à une action en tant que preuve complémentaire */
export const useAddPreuveComplementaireToAction = (
  actionId: string
): AddPreuveHandlers => {
  const collectiviteId = useCollectiviteId();
  const {
    mutate: addPreuveComplementaireSync,
    mutateAsync: addPreuveComplementaire,
  } = useAddPreuveComplementaire();

  // associe un fichier sélectionné depuis la bibliothèque à une action
  const addFileFromLib: AddFileFromLibHandler = async (fichier_id) => {
    if (collectiviteId) {
      const preuve = await addPreuveComplementaire({
        actionId,
        collectiviteId,
        commentaire: '',
        fichierId: fichier_id,
      });

      return { preuveId: preuve.id };
    }
  };

  // associe un lien+titre à une action
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
    addFileFromLib,
    addLink,
  };
};

/** Renvoie les gestionnaires d'événement du dialogue d'ajout de liens et
 * fichiers à une action en tant que preuve réglementaire */
export const useAddPreuveReglementaireToAction = (
  preuveId: string
): AddPreuveHandlers => {
  const collectiviteId = useCollectiviteId();
  const {
    mutate: addPreuveReglementaireSync,
    mutateAsync: addPreuveReglementaire,
  } = useAddPreuveReglementaire();

  // associe un fichier sélectionné depuis la bibliothèque à une action
  const addFileFromLib: AddFileFromLibHandler = async (fichier_id) => {
    if (collectiviteId) {
      const preuve = await addPreuveReglementaire({
        preuveId,
        collectiviteId,
        commentaire: '',
        fichierId: fichier_id,
      });

      return { preuveId: preuve.id };
    }
  };

  // associe un lien+titre à une action
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
    addFileFromLib,
    addLink,
  };
};
