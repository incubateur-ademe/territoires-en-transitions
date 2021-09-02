import {v4 as uuid} from 'uuid';
import {EpciStorable} from 'storables/EpciStorable';
import {epciStore} from 'core-logic/api/hybridStores';
import {
  addDroits,
  currentUtilisateurDroits,
} from 'core-logic/api/authentication';

const createNewEpci = async (nom: string) => {
  const allEpcis = await epciStore.retrieveAll();
  if (allEpcis.find(epciStorable => epciStorable.nom === nom))
    throw Error('Le nom de cette collectivité est déjà utilisé. ');

  const newEpci = new EpciStorable({
    uid: uuid(),
    nom: nom.trim(),
    insee: '',
    siren: '',
  });
  await epciStore.store(newEpci);
  await currentUtilisateurDroits(true);
};

const addEpciToMyList = async (epciId: string): Promise<boolean> =>
  addDroits(epciId, true);

export const epcis = {createNewEpci, addEpciToMyList};
