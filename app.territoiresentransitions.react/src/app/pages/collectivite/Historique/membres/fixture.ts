import {THistoriqueItem} from './fakeTypes';

export const fakeBaseHistorique: THistoriqueItem = {
  collectivite_id: 1,
  type: 'action_statut',
  modified_by_id: '123e4567-e89b-12d3-a456-426614174000',
  modified_by_nom: 'Richard Evans',
  modified_at: '2022-08-08T15:12:22.940172+00:00',
  previous_modified_by: null,
  previous_modified_at: null,
  action_id: null,
  action_identifiant: null,
  action_nom: null,
  tache_id: null,
  tache_identifiant: null,
  tache_nom: null,
  avancement: null,
  previous_avancement: null,
  avancement_detaille: null,
  previous_avancement_detaille: null,
  concerne: null,
  previous_concerne: null,
  precision: null,
  previous_precision: null,
  question_type: null,
  question_id: null,
  question_formulation: null,
  thematique_id: null,
  thematique_nom: null,
  reponse: null,
  previous_reponse: null,
  membre_concerne: null,
  previous_membre_acces: null,
  new_membre_acces: null,
  champ_modifie: null,
  previous_champ_modifie: null,
  new_champ_modifie: null,
};

/* Ajout d'un membre */
export const fakeMembreAjouteHistorique: THistoriqueItem = {
  ...fakeBaseHistorique,
  membre_concerne: 'Yala Dada',
  new_membre_acces: 'edition',
};

/** Retrait d'un membre */
export const fakeMembreRetireHistorique: THistoriqueItem = {
  ...fakeBaseHistorique,
  membre_concerne: 'Yala Dada',
};

/** Ajout de la fonction d'un membre */
export const fakeMembreAjoutFonctionHistorique: THistoriqueItem = {
  ...fakeBaseHistorique,
  membre_concerne: 'Yala Dada',
  champ_modifie: 'fonction',
  new_champ_modifie: 'Équipe technique',
};

/** Modification de la fonction d'un membre */
export const fakeMembreModifieFonctionHistorique: THistoriqueItem = {
  ...fakeBaseHistorique,
  membre_concerne: 'Yala Dada',
  champ_modifie: 'fonction',
  previous_champ_modifie: 'Partenaire',
  new_champ_modifie: 'Équipe technique',
};

/** Ajout du champ d'intervention d'un membre */
export const fakeMembreAjoutChampInterventionHistorique: THistoriqueItem = {
  ...fakeBaseHistorique,
  membre_concerne: 'Yala Dada',
  champ_modifie: 'champ_intervention',
  new_champ_modifie: 'Climat Air Énergie',
};

/** Modification de la fonction d'un membre */
export const fakeMembreModifieChampInterventionHistorique: THistoriqueItem = {
  ...fakeBaseHistorique,
  membre_concerne: 'Yala Dada',
  champ_modifie: 'champ_intervention',
  previous_champ_modifie: 'Climat Air Énergie',
  new_champ_modifie: 'Économie circulaire',
};

/** Ajout détails fonction d'un membre */
export const fakeMembreAjoutDetailsFonctionHistorique: THistoriqueItem = {
  ...fakeBaseHistorique,
  membre_concerne: 'Yala Dada',
  champ_modifie: 'details_fonction',
  new_champ_modifie:
    'Consultant assistance à maîtrise d’ouvrage - Bureau d’études Green',
};

/** Modification détails fonction d'un membre */
export const fakeMembreModifieDetailsFonctionHistorique: THistoriqueItem = {
  ...fakeBaseHistorique,
  membre_concerne: 'Yala Dada',
  champ_modifie: 'details_fonction',
  previous_champ_modifie:
    'Consultant assistance à maîtrise d’ouvrage - Bureau d’études Green',
  new_champ_modifie:
    "Vice-Président à l'aménagement durable du territoire de la CC du Pays de Château-Gontier",
};

/** Modification détails fonction d'un membre */
export const fakeMembreModifieAccesHistorique: THistoriqueItem = {
  ...fakeBaseHistorique,
  membre_concerne: 'Yala Dada',
  champ_modifie: 'acces',
  previous_champ_modifie: 'edition',
  new_champ_modifie: 'lecture',
};
