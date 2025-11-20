import { ITEM_ALL } from '@tet/ui';
import { TBoundary } from './boundariesToQueryFilter';
import { percentBoundaries } from './FiltrePourcentage';

export type PercentFilterValues =
  | keyof typeof percentBoundaries
  | typeof ITEM_ALL;

export type TFilters = {
  score_realise: PercentFilterValues[];
  score_programme: PercentFilterValues[];
  phase: string[];
};

export type TSetFilters = (newFilter: TFilters | null) => void;

// valeurs par défaut des filtres
export const initialFilters: TFilters = {
  score_realise: ['0', '1'],
  score_programme: [ITEM_ALL],
  phase: ['bases'],
};

export const noFilters: TFilters = {
  score_realise: [ITEM_ALL],
  score_programme: [ITEM_ALL],
  phase: [ITEM_ALL],
};

// mapping nom des filtres => params dans l'url
export const nameToShortNames = {
  score_realise: 'r',
  score_programme: 'p',
  phase: 'v',
};

export type TFiltreProps = {
  className?: string;
  filters: TFilters;
  setFilters: TSetFilters;
};

export type TValueToBoundary = Record<string, TBoundary>;

export const filterToBoundaries = (
  filter: string[],
  valueToBoundary: TValueToBoundary
): TBoundary[] => {
  if (!filter || filter.includes(ITEM_ALL)) {
    return [];
  }

  return filter.map((option) => valueToBoundary[option]);
};

export const getFilterInfoMessage = (filtersCount: number, maxDepth: number) =>
  filtersCount > 0
    ? `Les filtres s'appliquent au niveau des sous-actions (${Array(maxDepth)
        .fill('x')
        .join('.')})`
    : null;
