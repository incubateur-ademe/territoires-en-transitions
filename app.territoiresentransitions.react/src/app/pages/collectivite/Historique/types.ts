import {TFilters, TInitialFilters} from './filters';
import {Database} from 'types/database.types';

/* type de modification enregistrée dans l'historique */
export type HistoriqueType =
  | 'action_statut'
  | 'action_precision'
  | 'reponse'
  | 'justification'
  | 'preuve'
  | 'membre'
  | 'indicateur'
  | 'plan_action_arborescence'
  | 'plan_action_fiche';

/** un item de l'historique */
export type THistoriqueItem =
  Database['public']['Views']['historique']['Row'] & {
    collectivite_id: number;
    type: HistoriqueType;
    modified_at: string;
  };

export type THistoriqueItemProps = {
  item: THistoriqueItem;
};

export type THistoriqueProps = {
  items: THistoriqueItem[];
  total: number;
  initialFilters: TInitialFilters;
  filters: TFilters;
  filtersCount: number;
  setFilters: (filters: TFilters) => void;
};
