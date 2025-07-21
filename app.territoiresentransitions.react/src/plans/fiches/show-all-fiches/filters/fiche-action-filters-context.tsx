'use client';

import { useSearchParams } from '@/app/core-logic/hooks/query';
import { Event, useEventTracker } from '@/ui';
import { usePathname } from 'next/navigation';
import { createContext, ReactNode, useContext } from 'react';
import { countActiveFicheFilters } from './count-active-fiche-filters';
import { filtersConverter } from './filter-converter';
import { nameToparams } from './filters-search-parameters-mapper';
import { FilterKeys, Filters, FormFilters } from './types';
import {
  LookupConfig,
  useFicheActionFiltersData,
} from './use-fiche-action-filters-data';

type FicheActionFiltersContextType = {
  filters: FormFilters;
  filterParameters: Filters;
  setFilters: (filters: FormFilters) => void;
  resetFilters: () => void;
  activeFiltersCount: number;
  onDeleteFilterCategory: (key: FilterKeys | FilterKeys[]) => void;
  onDeleteFilterValue: ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: FilterKeys | FilterKeys[];
    valueToDelete: string;
  }) => void;
  getFilterValuesLabels: (
    categoryKey: FilterKeys,
    values: string[] | number[]
  ) => string[];
  ficheType: 'classifiees' | 'non-classifiees' | 'all';
};

const FicheActionFiltersContext =
  createContext<FicheActionFiltersContextType | null>(null);

export const deleteFilterValueForSingleKey = ({
  categoryKey,
  valueToDelete,
  formFilters,
  config,
}: {
  categoryKey: FilterKeys;
  valueToDelete: string;
  formFilters: FormFilters;
  config: LookupConfig | undefined;
}): FormFilters => {
  if (!config) {
    const currentValues = formFilters[categoryKey];
    if (Array.isArray(currentValues)) {
      const updatedSelectedValues = currentValues
        .filter((value) => value.toString() !== valueToDelete.toString())
        .map((v) => v.toString());

      return {
        ...formFilters,
        [categoryKey]:
          updatedSelectedValues.length > 0 ? updatedSelectedValues : undefined,
      };
    } else {
      return {
        ...formFilters,
        [categoryKey]: undefined,
      };
    }
  }

  const { items, valueKey, key } = config;

  const valueToActuallyDelete =
    items?.find((item: any) => item[valueKey] === valueToDelete)?.[key] ??
    valueToDelete;
  const currentValues = formFilters[categoryKey];

  const arrayValues = Array.isArray(currentValues) ? currentValues : [];
  const updatedSelectedValues = arrayValues.filter(
    (currentValue: string | number) =>
      currentValue.toString() !== valueToActuallyDelete.toString()
  );

  return {
    ...formFilters,
    [categoryKey]:
      updatedSelectedValues.length > 0 ? updatedSelectedValues : undefined,
  };
};

export const FicheActionFiltersProvider = ({
  children,
  ficheType,
}: {
  children: ReactNode;
  ficheType: 'classifiees' | 'non-classifiees' | 'all';
}) => {
  const tracker = useEventTracker();
  const pathname = usePathname();
  const { lookupConfig } = useFicheActionFiltersData();

  const [filterParams, setFilterParams] = useSearchParams<Filters>(
    pathname,
    {},
    nameToparams
  );

  const basicFilters: Filters = {
    // Note: noPlan is not in FilterKeys, so we handle it separately
    noPlan:
      ficheType === 'non-classifiees'
        ? true
        : ficheType === 'classifiees'
        ? false
        : undefined,
  };

  const formFilters = filtersConverter.fromApiFormatToFormFormat({
    ...filterParams,
    ...basicFilters,
  });
  const updateURLSearchParameters = (newFilters: Filters) => {
    setFilterParams(newFilters);
    tracker(Event.updateFiltres, {
      filtreValues: newFilters,
    });
  };

  const setFilter = (newFormFilters: FormFilters) => {
    const apiFilters =
      filtersConverter.fromFormFormatToApiFormat(newFormFilters);
    updateURLSearchParameters(apiFilters);
  };

  const resetFilters = () => {
    updateURLSearchParameters(basicFilters);
  };

  const onDeleteFilterCategory = (key: FilterKeys | FilterKeys[]) => {
    const newFilters = { ...formFilters };
    if (Array.isArray(key)) {
      key.forEach((k) => delete newFilters[k]);
    } else {
      delete newFilters[key];
    }
    updateURLSearchParameters(
      filtersConverter.fromFormFormatToApiFormat(newFilters)
    );
  };
  const onDeleteFilterValue = ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: FilterKeys | FilterKeys[];
    valueToDelete: string;
  }) => {
    const deleteValueFromFilters = (
      filters: FormFilters,
      key: FilterKeys
    ): FormFilters =>
      deleteFilterValueForSingleKey({
        categoryKey: key,
        valueToDelete,
        formFilters: filters,
        config: lookupConfig[key],
      });
    const currentFilters = { ...formFilters };
    const updatedFilters = Array.isArray(categoryKey)
      ? categoryKey.reduce(deleteValueFromFilters, currentFilters)
      : deleteValueFromFilters(currentFilters, categoryKey);

    updateURLSearchParameters(
      filtersConverter.fromFormFormatToApiFormat(updatedFilters)
    );
  };

  const getFilterValuesLabels = (
    categoryKey: FilterKeys,
    values: string[] | number[]
  ): string[] => {
    const config = lookupConfig[categoryKey];

    if (!config) {
      return values.map((value) => value.toString());
    }

    return values.map((value) => {
      const foundItem = config.items?.find(
        (item: any) => `${item[config.key]}` === `${value}`
      );
      return (
        foundItem?.[config.valueKey] ?? config.fallbackLabel ?? value.toString()
      );
    });
  };
  return (
    <FicheActionFiltersContext.Provider
      value={{
        filters: formFilters,
        filterParameters:
          filtersConverter.fromFormFormatToApiFormat(formFilters),
        setFilters: setFilter,
        resetFilters,
        activeFiltersCount: countActiveFicheFilters(formFilters),
        onDeleteFilterCategory,
        onDeleteFilterValue,
        getFilterValuesLabels,
        ficheType,
      }}
    >
      {children}
    </FicheActionFiltersContext.Provider>
  );
};

export const useFicheActionFilters = () => {
  const context = useContext(FicheActionFiltersContext);
  if (!context) {
    throw new Error(
      'useFicheActionFilters must be used within a FicheActionFiltersProvider'
    );
  }
  return context;
};
