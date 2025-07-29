import { FiltersMenuButton as GenericFiltersMenuButton } from '@/app/ui/lists/filter-badges';
import { Filters } from '../data/use-fiches-filters-list/types';
import { Menu } from './Menu';
import { usePlanFilters } from './plan-filters.context';

// Function to count active filters (excluding collectivite_id and axes which are always present)
const countActiveFilters = (filters: Filters) => {
  const filterKeys: (keyof Filters)[] = [
    'pilotes',
    'referents',
    'statuts',
    'priorites',
  ] as const;

  const activeFilters = filterKeys.filter((key) => {
    const value = filters[key];
    return Array.isArray(value) && value.length > 0;
  });

  return activeFilters.length;
};

export const FiltersMenuButton = () => {
  const { filters } = usePlanFilters();

  return (
    <GenericFiltersMenuButton
      activeFiltersCount={countActiveFilters(filters)}
      size="xs"
    >
      <Menu />
    </GenericFiltersMenuButton>
  );
};
