import { FiltersMenuButton as GenericFiltersMenuButton } from '@/app/ui/lists/filter-badges';
import { useFicheActionFilters } from './fiche-action-filters-context';
import { ToutesLesFichesFiltersForm } from './toutes-les-fiches-filters.form';

export const FiltersMenuButton = () => {
  const { filters, setFilters, activeFiltersCount } = useFicheActionFilters();

  return (
    <GenericFiltersMenuButton activeFiltersCount={activeFiltersCount} size="sm">
      <ToutesLesFichesFiltersForm filters={filters} setFilters={setFilters} />
    </GenericFiltersMenuButton>
  );
};
