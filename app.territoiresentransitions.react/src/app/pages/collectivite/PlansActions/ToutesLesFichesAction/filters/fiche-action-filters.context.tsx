'use client';

import { useSearchParams } from '@/app/core-logic/hooks/query';
import { Event, useEventTracker } from '@/ui';
import { usePathname } from 'next/navigation';
import { createContext, ReactNode, useContext } from 'react';
import { nameToparams } from './filters-search-parameters-mapper';
import { FilterKeys, Filters } from './types';
import { useFicheActionFiltersData } from './use-fiche-action-filters-data';

type FicheActionFiltersContextType = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  resetFilters: () => void;
  isFiltered: boolean;
  onDeleteFilterCategory: (key: FilterKeys | FilterKeys[]) => void;
  onDeleteFilterValue: ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: FilterKeys;
    valueToDelete: string;
  }) => void;
  getFilterValuesLabels: (
    categoryKey: FilterKeys,
    values: string[] | number[]
  ) => string[];
};

/** Convertit les paramètres d'URL en Filters */
const convertParamsToFilters = (paramFilters: Filters) => {
  const filters = { ...paramFilters };

  // Helper function to convert array to single value
  const convertArrayToSingle = (value: any) =>
    Array.isArray(value) ? value[0] : value;

  // Helper function to convert string array to boolean
  const convertStringArrayToBoolean = (value: any) => {
    if (!Array.isArray(value)) return value;
    const stringValue = value[0];
    return stringValue === undefined ? undefined : stringValue === 'true';
  };

  // Convert array values to single values for date-related fields
  const dateFields = [
    'modifiedSince',
    'debutPeriode',
    'finPeriode',
    'typePeriode',
  ] as const;
  dateFields.forEach((field) => {
    filters[field] = convertArrayToSingle(filters[field]);
  });

  // Convert boolean fields from string arrays to booleans
  const booleanFields = [
    'restreint',
    'doesBelongToSeveralPlans',
    'noPriorite',
    'noTag',
    'noStatut',
    'noReferent',
    'noServicePilote',
    'noPilote',
    'ameliorationContinue',
  ] as const;
  booleanFields.forEach((field) => {
    filters[field] = convertStringArrayToBoolean(filters[field]);
  });

  return filters;
};

const FicheActionFiltersContext =
  createContext<FicheActionFiltersContextType | null>(null);

export const FicheActionFiltersProvider = ({
  children,
  showFichesWithPlan,
}: {
  children: ReactNode;
  showFichesWithPlan: boolean;
}) => {
  const tracker = useEventTracker();
  const pathname = usePathname();
  const { lookupConfig } = useFicheActionFiltersData();

  const [filterParams, setFilterParams] = useSearchParams<Filters>(
    pathname,
    {},
    nameToparams
  );

  const basicFilters = {
    noPlan: showFichesWithPlan ? false : true,
  };
  const filters = {
    ...convertParamsToFilters(filterParams),
    ...basicFilters,
  };
  const setFilters = (newFilters: Filters) => {
    setFilterParams(newFilters);
    tracker(Event.updateFiltres, {
      filtreValues: newFilters,
    });
  };

  const resetFilters = () => {
    setFilters(basicFilters);
  };

  // Check if there are any active filters (excluding noPlan which is set based on type)
  const isFiltered = Object.keys(filters).length > 1;

  const onDeleteFilterCategory = (key: FilterKeys | FilterKeys[]) => {
    const newFilters = { ...filters };
    if (Array.isArray(key)) {
      key.forEach((k) => delete newFilters[k]);
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
  };

  const onDeleteFilterValue = ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: FilterKeys;
    valueToDelete: string;
  }) => {
    const config = lookupConfig[categoryKey];
    if (!config) {
      return;
    }
    const { items, valueKey, key } = config;

    const valueToActuallyDelete =
      items?.find((item: any) => item[valueKey] === valueToDelete)?.[key] ??
      valueToDelete;

    const currentValues = filters[categoryKey];
    const arrayValues = Array.isArray(currentValues) ? currentValues : [];
    const updatedFilters: Filters = {
      ...filters,
      [categoryKey]: arrayValues.filter(
        (currentValue: string | number) =>
          currentValue.toString() !== valueToActuallyDelete.toString()
      ),
    };

    setFilters(updatedFilters);
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
        filters,
        setFilters,
        resetFilters,
        isFiltered,
        onDeleteFilterCategory,
        onDeleteFilterValue,
        getFilterValuesLabels,
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
