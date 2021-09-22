import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';

export const deprecatedDefaultCategorie = new FicheActionCategorieStorable({
  uid: 'default',
  epci_id: '',
  nom: 'Sans catégorie',
  parent_uid: '',
  fiche_actions_uids: [],
});
