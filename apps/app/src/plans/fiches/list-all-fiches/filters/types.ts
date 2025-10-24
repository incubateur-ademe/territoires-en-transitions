import {
  ListFichesRequestFilters,
  listFichesRequestFiltersSchema,
  ListFichesSortValue,
} from '@/domain/plans';

export const WITH = 'WITH' as const;
export const WITHOUT = 'WITHOUT' as const;
export const WITH_RECENT = 'WITH_RECENT' as const;
export const WITHOUT_RECENT = 'WITHOUT_RECENT' as const;
export type WithOrWithoutOptions = typeof WITH | typeof WITHOUT;
export type NotesDeSuiviOptions =
  | typeof WITH
  | typeof WITHOUT
  | typeof WITH_RECENT
  | typeof WITHOUT_RECENT;

export type Filters = Omit<
  ListFichesRequestFilters,
  | 'hasBudgetPrevisionnel'
  | 'mesureIds'
  | 'modifiedAfter'
  | 'modifiedSince'
  | 'texteNomOuDescription'
  | 'hasNoteDeSuiviRecente'
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
  WithOrWithoutFilterKeys | 'hasNoteDeSuivi'
> & {
  indicateurIds?: number[];
  hasIndicateurLies?: WithOrWithoutOptions;
  hasNoteDeSuivi?: NotesDeSuiviOptions;
  hasMesuresLiees?: WithOrWithoutOptions;
  hasDateDeFinPrevisionnelle?: WithOrWithoutOptions;
  hasBudget?: WithOrWithoutOptions;
  sort: ListFichesSortValue;
};
