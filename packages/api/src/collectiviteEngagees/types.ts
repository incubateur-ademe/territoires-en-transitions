import { Database } from '../database.types';
import { NonNullableFields } from '../typeUtils';

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

/**
 * Element de la liste `collectivite_card`, utilisée par la vue toutes les
 * collectivités.
 */
export type TPlanCarte = PlanType & {
  collectivite: CollectiviteCarte;
};

export type PlanType = Omit<
  Database['public']['Tables']['axe']['Row'],
  'type'
> & {
  type?: Database['public']['Tables']['plan_action_type']['Row'];
};
export type CollectiviteCarte = NonNullableFields<
  Database['public']['Views']['collectivite_card']['Row']
>;
