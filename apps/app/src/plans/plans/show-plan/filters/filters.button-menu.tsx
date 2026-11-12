import { FiltersGenericButtonMenu } from '@/app/ui/lists/filters.generic-button-menu';
import { Alert } from '@tet/ui';
import { PlanFiltersFields } from './plan-filters.fields';
import { usePlanFilters } from './plan-filters.context';

export const FiltersMenuButton = () => {
  const { filtersCount } = usePlanFilters();

  return (
    <FiltersGenericButtonMenu
      activeFiltersCount={filtersCount}
      menuClassName="max-w-lg"
    >
      <MenuContent />
    </FiltersGenericButtonMenu>
  );
};

const MenuContent = () => {
  const { filters, setFilters, personneOptions } = usePlanFilters();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <Alert title="Les filtres s'appliquent uniquement sur les actions" />
        <PlanFiltersFields
          filters={filters}
          setFilters={setFilters}
          personneOptions={personneOptions}
        />
      </div>
    </div>
  );
};
