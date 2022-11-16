import {ITEM_ALL} from 'ui/shared/select/commons';

export type TFilters = {
  ordre_du_jour: string[];
  statut: string[];
};

export type TSetFilters = (newFilter: TFilters | null) => void;

// valeurs par défaut des filtres
export const initialFilters: TFilters = {
  ordre_du_jour: [ITEM_ALL],
  statut: [ITEM_ALL],
};

export const noFilters: TFilters = initialFilters;

// mapping nom des filtres => params dans l'url
export const nameToShortNames = {
  ordre_du_jour: 'o',
  statut: 's',
};

export type TFiltreProps = {
  className?: string;
  filters: TFilters;
  setFilters: TSetFilters;
};
