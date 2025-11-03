'use client';

import { useUser } from '@/api/users/user-context/user-provider';
import { Event, useEventTracker } from '@/ui';
import { createContext, ReactNode, useContext } from 'react';
import { countActiveFicheFilters } from './count-active-fiche-filters';
import { useFicheFiltersFromUrl } from './filter-converter';
import { FilterKeys, FormFilters } from './types';
import {
  LookupConfig,
  useFicheActionFiltersData,
} from './use-fiche-action-filters-data';

export type FicheActionViewType =
  | 'classifiees'
  | 'non-classifiees'
  | 'all'
  | 'mes-fiches';

type FicheActionFiltersContextType = {
  filters: FormFilters;
  readonlyFilters: Partial<FormFilters>;
  setFilters: (filters: Partial<FormFilters>) => void;
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
  ficheType: FicheActionViewType;
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
  ficheType = 'all',
}: {
  children: ReactNode;
  ficheType?: 'classifiees' | 'non-classifiees' | 'all' | 'mes-fiches';
}) => {
  const tracker = useEventTracker();
  const { lookupConfig } = useFicheActionFiltersData();
  const user = useUser();

  const { filters: filterParams, setFilters: setFilterParams } =
    useFicheFiltersFromUrl();

  const basicFilters: Partial<FormFilters> = {
    // noPlan is not in the search parameters, so we handle it here using the props
    noPlan: {
      'non-classifiees': true,
      classifiees: false,
      all: undefined,
      'mes-fiches': undefined,
    }[ficheType],
    utilisateurPiloteIds: {
      'non-classifiees': undefined,
      classifiees: undefined,
      all: undefined,
      'mes-fiches': [user.id],
    }[ficheType],
  };

  const formFilters = {
    ...filterParams,
    ...basicFilters,
  };

  const updateURLSearchParameters = (newFilters: Partial<FormFilters>) => {
    setFilterParams(newFilters);
    tracker(Event.updateFiltres, {
      filtreValues: newFilters,
    });
  };

  const setFilters = (newFormFilters: Partial<FormFilters>) => {
    updateURLSearchParameters(newFormFilters);
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
    updateURLSearchParameters(newFilters);
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
    updateURLSearchParameters(updatedFilters);
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
        readonlyFilters: basicFilters,
        setFilters,
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
