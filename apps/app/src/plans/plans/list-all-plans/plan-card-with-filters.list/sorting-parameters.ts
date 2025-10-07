import { parseAsStringLiteral } from 'nuqs';

export const sortField = ['nom', 'createdAt'] as const;
export const isSortValue = (value: any): value is SortField => {
  return sortField.includes(value as SortField);
};
export type SortField = (typeof sortField)[number];
export const sortDirections = ['asc', 'desc'] as const;
export type SortDirection = (typeof sortDirections)[number];

export type SortByOption = {
  label: string;
  value: SortField;
  direction: SortDirection;
};

export const sortByOptions: SortByOption[] = [
  {
    label: 'Ordre alphabétique',
    value: 'nom',
    direction: 'asc',
  },
  {
    label: 'Date de création',
    value: 'createdAt',
    direction: 'desc',
  },
];

export const sortURLParametersParser = {
  field: parseAsStringLiteral(['nom', 'createdAt']).withDefault('nom'),
  direction: parseAsStringLiteral(sortDirections).withDefault('asc'),
};

export const sortURLParametersNames = {
  field: 'field',
  direction: 'direction',
};
