export type TFilters = {
  statut: string[];
};

export type TSetFilters = (newFilter: TFilters | null) => void;

export const initialFilters: TFilters = {
  statut: ['non_renseigne'],
};

export const nameToShortNames = {
  statut: 's',
};

export type TFiltreProps = {
  className?: string;
  filters: TFilters;
  setFilters: TSetFilters;
};
