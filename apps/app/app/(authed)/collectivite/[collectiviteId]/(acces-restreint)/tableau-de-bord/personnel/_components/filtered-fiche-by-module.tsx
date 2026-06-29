import { useState } from 'react';

import { FicheActionViewType } from '@/app/plans/fiches/list-all-fiches/filters/fiche-action-filters-context';
import { FichesActionModule } from '@/app/tableaux-de-bord/plans-action/fiches-action/fiches-action.module';
import { QueryKey } from '@tanstack/react-query';
import { ModuleFicheActionsSelect } from '@tet/api/plan-actions';
import React from 'react';
import { getQueryKey } from '../_hooks/use-tdb-perso-fetch-modules';
import { getModuleEditActions } from './get-module-edit-actions';

type Props = {
  module: ModuleFicheActionsSelect;
  isEditionEnabled: boolean;
  onFilterChange: () => void;
  bottomLinkViewType?: FicheActionViewType;
  ModalComponent: React.ComponentType<{
    module: ModuleFicheActionsSelect;
    openState: { isOpen: boolean; setIsOpen: (open: boolean) => void };
    keysToInvalidate: QueryKey[];
  }>;
};

export const FilteredFichesByModule = ({
  module,
  onFilterChange,
  isEditionEnabled,
  ModalComponent,
}: Props) => {
  const collectiviteId = module.collectiviteId;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const openFilters = () => {
    setIsEditModalOpen(true);
    onFilterChange();
  };

  return (
    <>
      <FichesActionModule
        module={module}
        {...getModuleEditActions(isEditionEnabled, openFilters)}
      />
      <ModalComponent
        module={module}
        openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
        keysToInvalidate={[getQueryKey(collectiviteId)]}
      />
    </>
  );
};
