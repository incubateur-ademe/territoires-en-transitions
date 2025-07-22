import {
  ListFichesRequestFilters,
  listFichesRequestFiltersSchema,
  ListFichesSortValue,
} from '@/domain/plans/fiches';
import { WithOrWithoutFilterKeys, WithOrWithoutOptions } from './options';

export type Filters = Omit<
  ListFichesRequestFilters,
  | 'hasBudgetPrevisionnel'
  | 'indicateurIds'
  | 'mesureIds'
  | 'modifiedAfter'
  | 'modifiedSince'
  | 'texteNomOuDescription'
>;
export type FilterKeys = keyof Filters | 'sort';

export type FormFilters = Omit<Filters, WithOrWithoutFilterKeys> & {
  hasIndicateurLies: WithOrWithoutOptions | undefined;
  hasNoteDeSuivi: WithOrWithoutOptions | undefined;
  hasMesuresLiees: WithOrWithoutOptions | undefined;
  hasDateDeFinPrevisionnelle: WithOrWithoutOptions | undefined;
  sort: ListFichesSortValue;
};

export const isFilterKey = (key: string): key is FilterKeys => {
  return Object.keys(listFichesRequestFiltersSchema.shape).includes(key);
};
