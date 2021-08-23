import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';

export const defaultCategorie = new FicheActionCategorieStorable({
  uid: '',
  epci_id: '',
  nom: 'sans categorie',
  parent_uid: '',
  fiche_actions_uids: [],
});
