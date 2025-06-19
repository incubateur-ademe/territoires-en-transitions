import { Badge } from '@/ui';
import { ButtonMenu } from '@/ui/design-system/Button';
import { Menu } from './Menu';

import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { useState } from 'react';
import { PlanNode } from '../data/types';
import { usePlanActionFilters } from './context/PlanActionFiltersContext';

// Function to count active filters (excluding collectivite_id and axes which are always present)
const countActiveFilters = (filters: any) => {
  let count = 0;

  // Count filters that have values
  if (filters.pilotes && filters.pilotes.length > 0) count++;
  if (filters.referents && filters.referents.length > 0) count++;
  if (filters.statuts && filters.statuts.length > 0) count++;
  if (filters.priorites && filters.priorites.length > 0) count++;
  if (filters.sans_pilote) count++;
  if (filters.sans_referent) count++;
  if (filters.sans_statut) count++;
  if (filters.sans_niveau) count++;
  if (filters.echeance) count++;
  if (filters.sans_plan) count++;

  return count;
};

type Props = {
  currentPlan: PlanNode;
  axe: PlanNode;
  isAxePage: boolean;
  collectivite: CollectiviteNiveauAcces;
};

export const FiltresMenuButton = ({}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { filters } = usePlanActionFilters();

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
