import { FiltersMenuButton as GenericFiltersMenuButton } from '@/app/ui/lists/filter-badges';
import { useFicheActionFilters } from './fiche-action-filters-context';
import { ToutesLesFichesFiltersForm } from './toutes-les-fiches-filters.form';

export const FiltersMenuButton = () => {
  const { filters, setFilters, activeFiltersCount, readonlyFilters } =
    useFicheActionFilters();

  return (
    <GenericFiltersMenuButton activeFiltersCount={activeFiltersCount} size="sm">
      <ToutesLesFichesFiltersForm
        filters={filters}
        readonlyFilters={readonlyFilters}
        setFilters={setFilters}
      />
    </GenericFiltersMenuButton>
  );
};
