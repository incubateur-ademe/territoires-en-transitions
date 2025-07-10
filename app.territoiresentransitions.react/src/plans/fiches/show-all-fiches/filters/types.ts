import { ListFichesRequestFilters } from '@/domain/plans/fiches';
import { WithOrWithoutOptions } from './options';

export type FilterKeys = keyof ListFichesRequestFilters;
export type Filters = ListFichesRequestFilters;

export type FormFilters = Omit<
  Filters,
  | 'hasIndicateurLies'
  | 'hasNoteDeSuivi'
  | 'hasMesuresLiees'
  | 'hasDateDeFinPrevisionnelle'
> & {
  hasIndicateurLies: WithOrWithoutOptions | undefined;
  hasNoteDeSuivi: WithOrWithoutOptions | undefined;
  hasMesuresLiees: WithOrWithoutOptions | undefined;
  hasDateDeFinPrevisionnelle: WithOrWithoutOptions | undefined;
};
