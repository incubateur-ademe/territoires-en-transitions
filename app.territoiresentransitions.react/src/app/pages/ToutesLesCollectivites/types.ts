import {Database} from 'types/database.types';

/**
 * Element de la liste `collectivite_card`, utilisée par la vue toutes les
 * collectivités.
 * Ce type est issue d'une vue matérialisée qui n'est pas exporté par `supabase gen types`.
 */
export type TCollectiviteCarte = {
  collectivite_id: number;
  nom: string;
  type_collectivite: TTypeCollectivite;
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
  population_intervalle: string;
  completude_cae_intervalle: string;
  completude_eci_intervalle: string;
  completude_intervalles: string;
  fait_cae_intervalle: string;
  fait_eci_intervalle: string;
  fait_intervalles: string;
};

export type TTypeCollectivite =
  Database['public']['Enums']['filterable_type_collectivite'];

export type TSelectOption<T extends string> = {
  id: T;
  libelle: string;
};

export type TPopulationFiltreOption =
  | '<20000'
  | '20000-50000'
  | '50000-100000'
  | '100000-200000'
  | '>200000';

export type TNiveauLabellisationFiltreOption =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5';

export type TReferentielFiltreOption = 'eci' | 'cae';

export type TTauxRemplissageFiltreOption =
  | '0'
  | '0-49'
  | '50-79'
  | '80-99'
  | '100';

export type TRealiseCourantFiltreOption =
  | '0-34'
  | '35-49'
  | '50-64'
  | '65-74'
  | '75-100';

export type TTrierParFiltreOption = 'score' | 'completude' | 'nom';
