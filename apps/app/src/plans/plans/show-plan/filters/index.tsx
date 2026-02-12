import { FiltersMenuButton as GenericFiltersMenuButton } from '@/app/ui/lists/DEPRECATED_filter-badges';
import { Menu } from './Menu';
import { usePlanFilters } from './plan-filters.context';

export const FiltersMenuButton = () => {
  const { filtersCount } = usePlanFilters();

  return (
    <GenericFiltersMenuButton activeFiltersCount={filtersCount} size="sm">
      <Menu />
    </GenericFiltersMenuButton>
  );
};
