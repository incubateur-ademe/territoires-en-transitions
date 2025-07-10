import {
  ListFichesRequestQueryOptions,
  ListFichesSortValue,
} from '@/domain/plans/fiches';
import { useState } from 'react';

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

const sortByOptions: SortByOptions[] = [
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
];

export const useFicheActionSorting = (
  sortSettings: SortFicheActionSettings
) => {
  const [sort, setSort] = useState(
    sortByOptions.find((o) => o.field === sortSettings.defaultSort)!
  );

  const getSortOptions = () => {
    const optionsDisplayed = sortSettings.sortOptionsDisplayed;

    if (optionsDisplayed) {
      return sortByOptions
        .filter((o) => optionsDisplayed.includes(o.field))
        .map((o) => ({ label: o.label, value: o.field }));
    } else {
      return sortByOptions.map((o) => ({ label: o.label, value: o.field }));
    }
  };

  const sortOptions = getSortOptions();

  const handleSortChange = (value?: any) => {
    if (value && typeof value === 'string') {
      const newSort = sortByOptions.find((o) => o.field === value);
      if (newSort) {
        setSort(newSort);
      }
    }
  };

  return {
    sort,
    sortOptions,
    handleSortChange,
  };
};
