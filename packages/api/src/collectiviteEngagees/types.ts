/**
 * Element de la liste `collectivite_card`, utilisée par la vue toutes les
 * collectivités.
 */

// export type CollectiviteCarte = {
//   code_siren_insee: string;
//   collectivite_id: number;
//   completude_cae: number;
//   completude_cae_intervalle: string;
//   completude_eci: number;
//   completude_eci_intervalle: string;
//   completude_intervalles: string[];
//   completude_max: number;
//   completude_min: number;
//   departement_code: string;
//   etoiles_all: number[];
//   etoiles_cae: number;
//   etoiles_eci: number;
//   fait_cae_intervalle: string;
//   fait_eci_intervalle: string;
//   fait_intervalles: string[];
//   nom: string;
//   population: number;
//   population_intervalle: string;
//   region_code: string;
//   score_fait_cae: number;
//   score_fait_eci: number;
//   score_fait_max: number;
//   score_fait_min: number;
//   score_fait_sum: number;
//   score_programme_cae: number;
//   score_programme_eci: number;
//   score_programme_max: number;
//   score_programme_sum: number;
//   type_collectivite: string;
// };

export type FilterPlan = {
  typesPlan: number[];
};
export type FilterCollectivite = {
  nom?: string;
  regions: string[];
  departments: string[];
  typesCollectivite: string[];
  population: string[];
};
export type Filters = {
  referentiel: string[];
  niveauDeLabellisation: string[];
  realiseCourant: string[];
  tauxDeRemplissage: string[];
  trierPar?: string[];
  page?: number;
} & FilterCollectivite &
  FilterPlan;

export type RecherchesContact = {
  prenom: string;
  nom: string;
  fonction?: string;
  detailFonction?: string;
  telephone?: string;
  email: string;
};

export type RecherchesCollectivite = {
  collectiviteId: number;
  collectiviteNom: string;
  nbIndicateurs: number;
  nbPlans: number;
  etoilesEci: number;
  etoilesCae: number;
  contacts: RecherchesContact[];
};

export type RecherchesReferentiel = {
  collectiviteId: number;
  collectiviteNom: string;
  collectiviteType: string;
  etoilesCae: number;
  scoreFaitCae: number;
  scoreProgrammeCae: number;
  etoilesEci: number;
  scoreFaitEci: number;
  scoreProgrammeEci: number;
  contacts: RecherchesContact[];
};

export type RecherchesPlan = {
  collectiviteId: number;
  collectiviteNom: string;
  planId: number;
  planNom: string;
  planType?: string;
  contacts: RecherchesContact[];
};
