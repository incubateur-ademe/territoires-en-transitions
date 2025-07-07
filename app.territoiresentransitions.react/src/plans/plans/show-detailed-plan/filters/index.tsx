import { Badge } from '@/ui';
import { ButtonMenu } from '@/ui/design-system/Button';
import { Menu } from './Menu';

import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { useState } from 'react';
import { Filters } from '../data/use-fiches-filters-list/types';
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
  const [isOpen, setIsOpen] = useState(false);
  const { filters } = usePlanFilters();

  const activeFiltersCount = countActiveFilters(filters);

  return (
    <div className="relative">
      <ButtonMenu
        icon="equalizer-line"
        size="xs"
        openState={{
          isOpen,
          setIsOpen,
        }}
        menuPlacement="bottom-end"
      >
        <div className="p-4 min-w-[400px]">
          <Menu />
        </div>
      </ButtonMenu>
      <VisibleWhen condition={activeFiltersCount > 0}>
        <Badge
          className="absolute -top-2 -right-2 rounded-full border-2 border-white"
          title={activeFiltersCount}
          state="info"
          size="sm"
        />
      </VisibleWhen>
    </div>
  );
};
