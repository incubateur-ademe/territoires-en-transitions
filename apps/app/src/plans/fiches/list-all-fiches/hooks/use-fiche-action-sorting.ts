import {
  ListFichesRequestQueryOptions,
  ListFichesSortValue,
} from '@/domain/plans/fiches';
import { Option } from '@/ui';
import { parseAsString, useQueryState } from 'nuqs';
import { useMemo } from 'react';

export type SortByOptions = NonNullable<
  ListFichesRequestQueryOptions['sort']
>[number] & {
  label: string;
};

type SortSettings<T> = {
  defaultSort: T;
  sortOptionsDisplayed?: T[];
};

export type SortFicheActionSettings = SortSettings<ListFichesSortValue>;

const sortByProperties: SortByOptions[] = [
  {
    label: 'Date de modification',
    field: 'modified_at',
    direction: 'desc',
  },
  {
    label: 'Date de création',
    field: 'created_at',
    direction: 'desc',
  },
  {
    label: 'Ordre alphabétique',
    field: 'titre',
    direction: 'asc',
  },
  {
    label: 'Date de début',
    field: 'dateDebut',
    direction: 'asc',
  },
];

const sortOptions: Option[] = sortByProperties.map((o) => ({
  label: o.label,
  value: o.field,
}));

export function useFicheActionSorting(defaultSort: ListFichesSortValue) {
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
