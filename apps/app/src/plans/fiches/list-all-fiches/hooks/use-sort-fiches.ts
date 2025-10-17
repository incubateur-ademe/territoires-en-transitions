import { ListFichesSortValue } from '@/domain/plans';
import { Option } from '@/ui';
import { parseAsString, useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { sortByProperties } from '../../utils';

type SortSettings<T> = {
  defaultSort: T;
  sortOptionsDisplayed?: T[];
};

export type SortFichesSettings = SortSettings<ListFichesSortValue>;

const sortOptions: Option[] = sortByProperties.map((o) => ({
  label: o.label,
  value: o.field,
}));

export function useSortFiches(defaultSort: ListFichesSortValue) {
  const [currentSort, setCurrentSort] = useQueryState(
    'sort',
    parseAsString.withDefault(defaultSort)
  );

  const currentSortSettings = useMemo(
    () =>
      sortByProperties.find((o) => o.field === currentSort) ||
      sortByProperties[0],
    [currentSort]
  );

  return {
    sort: currentSortSettings,
    sortOptions,
    handleSortChange: setCurrentSort,
  };
}
