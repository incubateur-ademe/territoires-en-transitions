import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';

export const defaultCategorie = new FicheActionCategorieStorable({
  uid: 'default',
  epci_id: '',
  nom: 'Fiches actions non classées',
  parent_uid: '',
  fiche_actions_uids: [],
});
