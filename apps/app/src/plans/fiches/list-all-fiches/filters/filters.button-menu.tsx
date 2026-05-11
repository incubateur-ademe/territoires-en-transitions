import { FiltersGenericButtonMenu } from '@/app/ui/lists/filters.generic-button-menu';
import { useFicheActionFilters } from './fiche-action-filters-context';
import { ToutesLesFichesFiltersForm } from './toutes-les-fiches-filters.form';

export const FiltersButtonMenu = () => {
  const { filters, setFilters, activeFiltersCount, readonlyFilters } =
    useFicheActionFilters();

  return (
    <FiltersGenericButtonMenu
      activeFiltersCount={activeFiltersCount}
      menuClassName="max-w-3xl"
    >
      <ToutesLesFichesFiltersForm
        filters={filters}
        readonlyFilters={readonlyFilters}
        setFilters={setFilters}
      />
    </FiltersGenericButtonMenu>
  );
};
