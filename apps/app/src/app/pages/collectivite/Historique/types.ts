import { Views } from '@tet/api';
import { TFilters } from './filters';

/* type de modification enregistrée dans l'historique */
export const historiqueTypeEnumValues = [
  'action_statut',
  'action_precision',
  'reponse',
  'justification',
  'preuve',
  'membre',
  'indicateur',
  'plan_action_arborescence',
  'plan_action_fiche',
] as const;

export type HistoriqueType = (typeof historiqueTypeEnumValues)[number];

/** un item de l'historique */
export type THistoriqueItem = Views<'historique'> & {
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
  filters: TFilters;
  setFilters: (filters: TFilters | null) => void;
  isLoading?: boolean;
};
