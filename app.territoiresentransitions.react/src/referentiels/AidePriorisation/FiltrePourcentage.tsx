import { ITEM_ALL } from '@/app/ui/shared/filters/commons';
import {
  MultiSelectFilter,
  MultiSelectFilterTitle,
} from '@/app/ui/shared/select/MultiSelectFilter';
import { TFilters, TFiltreProps } from './filters';

export const SCORE_REALISE = 'score_realise';

export const percentItems = [
  { value: ITEM_ALL, label: 'Tous' },
  { value: '0', label: '0 %' },
  { value: '1', label: '1 à 34 %' },
  { value: '35', label: '35 à 49 %' },
  { value: '50', label: '50 à 64 %' },
  { value: '65', label: '65 à 74 %' },
  { value: '75', label: '75 à 100 %' },
];
export const percentBoundaries = {
  '0': { lower: 0, upper: 0.1, include: 'lower' },
  '1': { lower: 0.1, upper: 0.35, include: 'lower' },
  '35': { lower: 0.35, upper: 0.5, include: 'lower' },
  '50': { lower: 0.5, upper: 0.65, include: 'lower' },
  '65': { lower: 0.65, upper: 0.75, include: 'lower' },
  '75': { lower: 0.75, upper: 1.001, include: 'both' },
} as const;

export const makeFiltrePourcentage = (filterKey: string, label: string) =>
  function FiltrePourcentage(props: TFiltreProps) {
    const { filters, setFilters } = props;

    return (
      <MultiSelectFilter
        values={filters[filterKey as keyof TFilters]}
        options={percentItems}
        onSelect={(newValues) =>
          setFilters({ ...filters, [filterKey]: newValues })
        }
        renderSelection={(values) => (
          <MultiSelectFilterTitle values={values} label={label} />
        )}
      />
    );
  };
