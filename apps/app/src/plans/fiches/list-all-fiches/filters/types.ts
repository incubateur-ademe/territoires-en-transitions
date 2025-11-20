import {
  ListFichesRequestFilters,
  listFichesRequestFiltersSchema,
} from '@tet/domain/plans';
import { SortValue } from '../data/use-list-fiches';

export const WITH = 'WITH';
export const WITHOUT = 'WITHOUT';
export const WITH_RECENT = 'WITH_RECENT';
export const WITHOUT_RECENT = 'WITHOUT_RECENT';
export type WithOrWithoutOptions = typeof WITH | typeof WITHOUT;

export type Filters = Omit<
  ListFichesRequestFilters,
  | 'hasBudgetPrevisionnel'
  | 'mesureIds'
  | 'modifiedAfter'
  | 'modifiedSince'
  | 'texteNomOuDescription'
  | 'parentsId'
  | 'withChildren'
>;
export type FilterKeys = keyof Filters | 'sort';

export const WITH_OR_WITHOUT_FILTERS_KEYS = [
  'hasIndicateurLies',
  'hasMesuresLiees',
  'hasDateDeFinPrevisionnelle',
  'hasBudget',
] as const;

export type WithOrWithoutFilterKeys =
  (typeof WITH_OR_WITHOUT_FILTERS_KEYS)[number];

export const isFilterKey = (key: string): key is FilterKeys => {
  return Object.keys(listFichesRequestFiltersSchema.shape).includes(key);
};

export type FormFilters = Omit<
  Filters,
  | 'hasIndicateurLies'
  | 'hasMesuresLiees'
  | 'hasDateDeFinPrevisionnelle'
  | 'hasBudget'
> & {
  indicateurIds?: number[];
  hasIndicateurLies?: WithOrWithoutOptions;
  hasMesuresLiees?: WithOrWithoutOptions;
  hasDateDeFinPrevisionnelle?: WithOrWithoutOptions;
  hasBudget?: WithOrWithoutOptions;
  sort: SortValue;
};
