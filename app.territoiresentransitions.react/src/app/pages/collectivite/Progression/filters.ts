import {ITEM_ALL} from 'ui/shared/select/commons';
import {TBoundary} from 'ui/shared/boundariesToQueryFilter';

export type TFilters = {
  score_realise: string[];
  score_programme: string[];
  score_realise_plus_programme: string[];
  score_pas_fait: string[];
  score_non_renseigne: string[];
};

export type TSetFilters = (newFilter: TFilters | null) => void;

// valeurs par défaut des filtres
export const initialFilters: TFilters = {
  score_realise: [],
  score_programme: [],
  score_realise_plus_programme: [],
  score_pas_fait: [],
  score_non_renseigne: [],
};

export const noFilters: TFilters = initialFilters;

// mapping nom des filtres => params dans l'url
export const nameToShortNames: Record<keyof TFilters, string> = {
  score_realise: 'r',
  score_programme: 'p',
  score_realise_plus_programme: 'rp',
  score_pas_fait: 'pf',
  score_non_renseigne: 'nr',
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
