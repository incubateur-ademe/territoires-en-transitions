import { useState } from 'react';

import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { nameToparams } from '@/app/plans/fiches/list-all-fiches/filters/filters-search-parameters-mapper';
import { FichesActionModule } from '@/app/tableaux-de-bord/plans-action/fiches-action/fiches-action.module';
import { ModifiedSince } from '@/domain/utils';
import { QueryKey } from '@tanstack/react-query';
import React from 'react';
import { getQueryKey } from '../_hooks/use-tdb-perso-fetch-modules';

type Props = {
  module: ModuleFicheActionsSelect;
  hideEditAction?: boolean;
  onFilterChange: () => void;
  ModalComponent: React.ComponentType<{
    module: ModuleFicheActionsSelect;
    openState: { isOpen: boolean; setIsOpen: (open: boolean) => void };
    keysToInvalidate: QueryKey[];
  }>;
};

const getDateFromModifiedSince = (modifiedSince: ModifiedSince) => {
  const days: Record<ModifiedSince, number> = {
    'last-90-days': 90,
    'last-60-days': 60,
    'last-30-days': 30,
    'last-15-days': 15,
  };
  return new Date(Date.now() - days[modifiedSince] * 24 * 60 * 60 * 1000);
};

const buildFilterSearchParameters = (module: ModuleFicheActionsSelect) => {
  const params = new URLSearchParams();

  if (module.options.filtre.modifiedSince) {
    params.set(nameToparams.typePeriode, 'modification');
    params.set(
      nameToparams.debutPeriode,
      getDateFromModifiedSince(
        module.options.filtre.modifiedSince
      ).toISOString()
    );
  }

  if (module.options.filtre.utilisateurPiloteIds) {
    params.set(
      nameToparams.utilisateurPiloteIds,
      module.options.filtre.utilisateurPiloteIds.join(',')
    );
  }

  return params;
};

export const FilteredFichesByModule = ({
  module,
  onFilterChange,
  hideEditAction,
  ModalComponent,
}: Props) => {
  const collectiviteId = module.collectiviteId;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const openFilters = () => {
    setIsEditModalOpen(true);
    onFilterChange();
  };

  const filterSearchParameters = buildFilterSearchParameters(module);

  return (
    <>
      <FichesActionModule
        module={module}
        menuActions={
          hideEditAction
            ? []
            : [
                {
                  label: 'Modifier',
                  icon: 'edit-line',
                  onClick: openFilters,
                },
              ]
        }
        emptyButtons={
          hideEditAction
            ? []
            : [
                {
                  children: 'Modifier le filtre',
                  size: 'sm',
                  onClick: openFilters,
                },
              ]
        }
        footerLink={`${makeCollectiviteToutesLesFichesUrl({
          collectiviteId,
        })}?${filterSearchParameters.toString()}`}
      />
      <ModalComponent
        module={module}
        openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
        keysToInvalidate={[getQueryKey(collectiviteId)]}
      />
    </>
  );
};
