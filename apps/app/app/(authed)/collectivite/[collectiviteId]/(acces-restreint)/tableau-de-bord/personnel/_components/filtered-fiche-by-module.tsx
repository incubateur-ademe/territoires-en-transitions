import { createSerializer } from 'nuqs';
import { useState } from 'react';

import { ModuleFicheActionsSelect } from '@/api/plan-actions';
import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { FicheActionViewType } from '@/app/plans/fiches/list-all-fiches/filters/fiche-action-filters-context';
import {
  parameterMustBeNull,
  searchParametersParser,
} from '@/app/plans/fiches/list-all-fiches/filters/filter-converter';
import { nameToparams } from '@/app/plans/fiches/list-all-fiches/filters/filters-search-parameters-mapper';
import { FichesActionModule } from '@/app/tableaux-de-bord/plans-action/fiches-action/fiches-action.module';
import { ListFichesRequestFilters as Filtres } from '@/domain/plans';
import { ModifiedSince } from '@/domain/utils';
import { QueryKey } from '@tanstack/react-query';
import { mapValues } from 'es-toolkit/object';
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
  const filters: Filtres = { ...module.options.filtre };

  if (filters.modifiedSince) {
    Object.assign(filters, {
      typePeriode: 'modification',
      debutPeriode: getDateFromModifiedSince(
        filters.modifiedSince
      ).toISOString(),
    });
  }

  const sanitizedFilters = mapValues(filters ?? {}, (value: any) => {
    if (parameterMustBeNull(value)) {
      //nuqs expect null values only when a param is not present
      return null;
    }
    return value;
  });

  const serializer = createSerializer(searchParametersParser as any, {
    urlKeys: nameToparams,
  });

  const searchParamsString = serializer(sanitizedFilters);

  return new URLSearchParams(searchParamsString);
};

export const FilteredFichesByModule = ({
  module,
  bottomLinkViewType,
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

  const filterSearchParameters = buildFilterSearchParameters(module);

  return (
    <>
      <FichesActionModule
        module={module}
        {...getModuleEditActions(isEditionEnabled, openFilters)}
        footerLink={`${makeCollectiviteToutesLesFichesUrl({
          collectiviteId,
          ficheViewType: bottomLinkViewType,
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
