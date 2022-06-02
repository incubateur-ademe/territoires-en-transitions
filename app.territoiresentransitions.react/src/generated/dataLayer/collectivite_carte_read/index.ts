/**
 * Element de la liste `collectivite_card`, utilisée par la vue toutes les
 * collectivités.
 */
export type CollectiviteCarteRead = {
  collectivite_id: number;
  nom: string;
  type_collectivite: TypeCollectiviteCarteRead;
  code_siren_insee: string;
  region_code: string;
  departement_code: string;
  population: number;
  etoiles_cae: number;
  etoiles_eci: number;
  etoiles_all: number;
  score_fait_cae: number;
  score_fait_eci: number;
  score_fait_max: number;
  score_programme_cae: number;
  score_programme_eci: number;
  score_programme_max: number;
  completude_cae: number;
  completude_eci: number;
  completude_max: number;
};

export type TypeCollectiviteCarteRead =
  | 'CA'
  | 'CU'
  | 'EPT'
  | 'METRO'
  | 'CC'
  | 'PETR'
  | 'syndicat'
  | 'commune';
