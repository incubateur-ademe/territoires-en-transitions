import { ITEM_ALL } from '@tet/ui';

export type TFilters = {
  ordreDuJour: string[];
  statut: string[];
};

export type TSetFilters = (newFilter: TFilters | null) => void;

// valeurs par défaut des filtres
export const initialFilters: TFilters = {
  ordreDuJour: [ITEM_ALL],
  statut: [ITEM_ALL],
};

export const noFilters: TFilters = initialFilters;

// mapping nom des filtres => params dans l'url
export const nameToShortNames = {
  ordreDuJour: 'o',
  statut: 's',
};

export type TFiltreProps = {
  className?: string;
  filters: TFilters;
  setFilters: TSetFilters;
};
