import { FiltersMenuButton as GenericFiltersMenuButton } from '@/app/ui/lists/filter-badges';
import MenuFiltresToutesLesFichesAction from '../MenuFiltresToutesLesFichesAction';
import { useFicheActionFilters } from './fiche-action-filters.context';
import { countActiveFicheFilters } from './count-active-fiche-filters';

export const FiltersMenuButton = () => {
  const { filters, setFilters } = useFicheActionFilters();

  return (
    <GenericFiltersMenuButton
      activeFiltersCount={countActiveFicheFilters(filters)}
      size="sm"
    >
      <MenuFiltresToutesLesFichesAction
        filters={filters}
        setFilters={setFilters}
      />
    </GenericFiltersMenuButton>
  );
};
