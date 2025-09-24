import {
  ListFichesRequestQueryOptions,
  ListFichesSortValue,
} from '@/domain/plans/fiches';
import { Option } from '@/ui';
import { useRouter, useSearchParams } from 'next/navigation';
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

const isSortableField = (
  field: string | undefined
): field is SortByOptions['field'] => {
  return sortByProperties.some((o) => o.field === field);
};

export function useFicheActionSorting(defaultSort: ListFichesSortValue) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortFieldFromSearchParams = searchParams.get('sort');
  const currentSortField = isSortableField(sortFieldFromSearchParams ?? '')
    ? sortFieldFromSearchParams
    : defaultSort;

  const currentSortSettings = useMemo(
    () =>
      sortByProperties.find((o) => o.field === currentSortField) ||
      sortByProperties[0],
    [currentSortField]
  );

  const handleSortChange = (value: string | undefined) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('sort', isSortableField(value) ? value : '');
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return {
    sort: currentSortSettings,
    sortOptions,
    handleSortChange,
  };
}
