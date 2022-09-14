import {useCollectiviteId} from 'core-logic/hooks/params';
import {TAddFileFromLib} from 'ui/shared/preuves/AddPreuveModal/AddFile';
import {TAddLink} from 'ui/shared/preuves/AddPreuveModal/AddLink';
import {
  useAddPreuveComplementaire,
  useAddPreuveReglementaire,
} from 'ui/shared/preuves/Bibliotheque/useAddPreuves';

type THandlers = {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
  /** ajoute un lien */
  addLink: TAddLink;
};

/** Renvoie les gestionnaires d'événement du dialogue d'ajout de liens et
 * fichiers à une action en tant que preuve complémentaire */
export const useAddPreuveComplementaireToAction = (
  action_id: string
): THandlers => {
  const collectivite_id = useCollectiviteId();
  const {mutate: addPreuveComplementaire} = useAddPreuveComplementaire();

  // associe un fichier sélectionné depuis la bibliothèque à une action
  const addFileFromLib: TAddFileFromLib = fichier_id => {
    if (collectivite_id) {
      addPreuveComplementaire({
        action_id,
        collectivite_id,
        commentaire: '',
        fichier_id,
      });
    }
  };

  // associe un lien+titre à une action
  const addLink: TAddLink = (titre, url) => {
    if (collectivite_id) {
      addPreuveComplementaire({
        action_id,
        collectivite_id,
        commentaire: '',
        titre,
        url,
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
  preuve_id: string
): THandlers => {
  const collectivite_id = useCollectiviteId();
  const {mutate: addPreuveReglementaire} = useAddPreuveReglementaire();

  // associe un fichier sélectionné depuis la bibliothèque à une action
  const addFileFromLib: TAddFileFromLib = fichier_id => {
    if (collectivite_id) {
      addPreuveReglementaire({
        preuve_id,
        collectivite_id,
        commentaire: '',
        fichier_id,
      });
    }
  };

  // associe un lien+titre à une action
  const addLink: TAddLink = (titre, url) => {
    if (collectivite_id) {
      addPreuveReglementaire({
        preuve_id,
        collectivite_id,
        commentaire: '',
        titre,
        url,
      });
    }
  };

  return {
    addFileFromLib,
    addLink,
  };
};
