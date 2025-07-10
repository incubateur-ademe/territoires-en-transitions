import { FiltersMenuButton as GenericFiltersMenuButton } from '@/app/ui/lists/filter-badges';
import { ToutesLesFichesFiltersForm } from '../toutes-les-fiches-filters.form';
import { countActiveFicheFilters } from './count-active-fiche-filters';
import { useFicheActionFilters } from './fiche-action-filters.context';

export const FiltersMenuButton = () => {
  const { filters, setFilters } = useFicheActionFilters();

  return (
    <GenericFiltersMenuButton
      activeFiltersCount={countActiveFicheFilters(filters)}
      size="sm"
    >
      <ToutesLesFichesFiltersForm filters={filters} setFilters={setFilters} />
    </GenericFiltersMenuButton>
  );
};
