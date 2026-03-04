import { ITEM_ALL } from '@tet/ui';
import { parseAsArrayOf, parseAsString, UrlKeys } from 'nuqs';

export type TFilters = {
  statut: string[];
};

export type TSetFilters = (newFilter: TFilters) => void;

export const initialFilters: TFilters = {
  statut: ['non_renseigne'],
};

export const noFilters: TFilters = {
  statut: [ITEM_ALL],
};

export const filtersParsers = {
  statut: parseAsArrayOf(parseAsString).withDefault(initialFilters.statut),
};

export const filtersUrlKeys: UrlKeys<typeof filtersParsers> = {
  statut: 's',
} as const;

export type TFiltreProps = {
  className?: string;
  filters: TFilters;
  setFilters: TSetFilters;
};
