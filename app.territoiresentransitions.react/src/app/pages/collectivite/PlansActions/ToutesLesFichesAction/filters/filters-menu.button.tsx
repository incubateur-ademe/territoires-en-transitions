import { FiltersMenuButton as GenericFiltersMenuButton } from '@/app/ui/lists/filter-badges';
import MenuFiltresToutesLesFichesAction from '../MenuFiltresToutesLesFichesAction';
import { useFicheActionFilters } from './fiche-action-filters.context';
import { countActiveFicheActionFilters } from './fiche-action-filters.utils';

export const FiltersMenuButton = () => {
  const { filters, setFilters } = useFicheActionFilters();

  return (
    <GenericFiltersMenuButton
      activeFiltersCount={countActiveFicheActionFilters(filters)}
      size="sm"
    >
      <MenuFiltresToutesLesFichesAction
        filters={filters}
        setFilters={setFilters}
      />
    </GenericFiltersMenuButton>
  );
};
