import {
  ListFichesRequestFilters,
  listFichesRequestFiltersSchema,
  ListFichesSortValue,
} from '@/domain/plans/fiches';

export const WITH = 'WITH' as const;
export const WITHOUT = 'WITHOUT' as const;
export type WithOrWithoutOptions = typeof WITH | typeof WITHOUT;

export type Filters = Omit<
  ListFichesRequestFilters,
  | 'hasBudgetPrevisionnel'
  | 'mesureIds'
  | 'modifiedAfter'
  | 'modifiedSince'
  | 'texteNomOuDescription'
>;
export type FilterKeys = keyof Filters | 'sort';

export const WITH_OR_WITHOUT_FILTERS_KEYS = [
  'hasNoteDeSuivi',
  'hasIndicateurLies',
  'hasMesuresLiees',
  'hasDateDeFinPrevisionnelle',
] as const;

export type WithOrWithoutFilterKeys =
  (typeof WITH_OR_WITHOUT_FILTERS_KEYS)[number];

export const isFilterKey = (key: string): key is FilterKeys => {
  return Object.keys(listFichesRequestFiltersSchema.shape).includes(key);
};

export type FormFilters = Omit<Filters, WithOrWithoutFilterKeys> & {
  indicateurIds?: number[];
  hasIndicateurLies?: WithOrWithoutOptions;
  hasNoteDeSuivi?: WithOrWithoutOptions;
  hasMesuresLiees?: WithOrWithoutOptions;
  hasDateDeFinPrevisionnelle?: WithOrWithoutOptions;
  sort: ListFichesSortValue;
};
