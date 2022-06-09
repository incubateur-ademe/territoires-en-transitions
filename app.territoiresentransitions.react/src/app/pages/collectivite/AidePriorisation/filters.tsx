import {ITEM_ALL} from 'ui/shared/MultiSelectFilter';
import {TBoundary} from 'ui/shared/boundariesToQueryFilter';

export type TFilters = {
  score_realise: string[];
  score_programme: string[];
  phase: string[];
};

export type TSetFilters = (newFilter: TFilters | null) => void;

// valeurs par défaut des filtres
export const initialFilters: TFilters = {
  score_realise: [ITEM_ALL],
  score_programme: [ITEM_ALL],
  phase: [ITEM_ALL],
};

// mapping nom des filtres => params dans l'url
export const nameToShortNames = {
  score_realise: 'r',
  score_programme: 'p',
  phase: 'v',
};

export type TFiltreProps = {
  className?: string;
  filters: TFilters;
  setFilters: TSetFilters;
};

export type TValueToBoundary = Record<string, TBoundary>;

export const filterToBoundaries = (
  filter: string[],
  valueToBoundary: TValueToBoundary
): TBoundary[] => {
  if (!filter || filter.includes(ITEM_ALL)) {
    return [];
  }

  return filter.map(option => valueToBoundary[option]);
};
