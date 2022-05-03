import {useCollectiviteId} from 'core-logic/hooks/params';
// import {labellisationFichierWriteEndpoint} from 'core-logic/api/endpoints/LabellisationFichierWriteEndpoint';
// import {labellisationLienWriteEndpoint} from 'core-logic/api/endpoints/LabellisationLienWriteEndpoint';
import {TAddFileFromLib} from 'ui/shared/ResourceManager/AddFile';
import {TAddLink} from 'ui/shared/ResourceManager/AddLink';

type TAddDocs = (parcours_id: string) => {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
  /** ajoute un lien */
  addLink: TAddLink;
};

/** Renvoie les gestionnaires d'événements du dialogue d'ajout de liens et
 * fichiers au parcours de labellisation en cours */
export const useAddDocs: TAddDocs = (parcours_id: string) => {
  const collectivite_id = useCollectiviteId();

  // associe un fichier sélectionné depuis la bibliothèque
  const addFileFromLib: TAddFileFromLib = filename =>
    collectivite_id
      ? /*labellisationFichierWriteEndpoint.save({
          parcours_id,
          collectivite_id,
          commentaire: '',
          filename,
        })*/ Promise.resolve(true)
      : Promise.resolve(false);

  // associe un lien+titre
  const addLink: TAddLink = (titre, url) =>
    collectivite_id
      ? /*labellisationLienWriteEndpoint
          .save({
            parcours_id,
            collectivite_id,
            titre,
            url,
            commentaire: '',
          })
          .then(lien => Boolean(lien))*/
        Promise.resolve(true)
      : Promise.resolve(false);

  return {
    addFileFromLib,
    addLink,
  };
};
