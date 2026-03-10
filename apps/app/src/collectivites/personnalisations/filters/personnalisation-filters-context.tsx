'use client';

import { createContext, ReactNode, useContext } from 'react';
import { countActivePersonnalisationFiltersForMenu } from './count-active-personnalisation-filters';
import { usePersonnalisationFiltersFromUrl } from './personnalisation-filters-converter';
import type {
  PersonnalisationFilterKeys,
  PersonnalisationFilters,
} from './personnalisation-filters.types';

type PersonnalisationFiltersContextType = {
  filters: PersonnalisationFilters;
  setFilters: (filters: Partial<PersonnalisationFilters>) => void;
  resetFilters: () => void;
  activeFiltersCount: number;
  onDeleteFilterCategory: (key: PersonnalisationFilterKeys) => void;
  onDeleteFilterValue: ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: PersonnalisationFilterKeys;
    valueToDelete: string;
  }) => void;
};

const PersonnalisationFiltersContext =
  createContext<PersonnalisationFiltersContextType | null>(null);

export const PersonnalisationFiltersProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { filters, setFilters: setFilterParams } =
    usePersonnalisationFiltersFromUrl();

  const setFilters = (newFilters: Partial<PersonnalisationFilters>) => {
    setFilterParams({ ...filters, ...newFilters });
  };

  const resetFilters = () => {
    setFilterParams({
      thematiqueIds: undefined,
      referentielIds: undefined,
      actionIds: undefined,
    });
  };

  const onDeleteFilterCategory = (key: PersonnalisationFilterKeys) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilterParams(newFilters);
  };

  const onDeleteFilterValue = ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: PersonnalisationFilterKeys;
    valueToDelete: string;
  }) => {
    const currentValues = filters[categoryKey];
    if (!Array.isArray(currentValues)) {
      return;
    }
    const updatedValues = currentValues.filter(
      (v) => v.toString() !== valueToDelete.toString()
    );
    setFilters({
      [categoryKey]: updatedValues.length > 0 ? updatedValues : undefined,
    });
  };

  return (
    <PersonnalisationFiltersContext.Provider
      value={{
        filters,
        setFilters,
        resetFilters,
        activeFiltersCount: countActivePersonnalisationFiltersForMenu(filters),
        onDeleteFilterCategory,
        onDeleteFilterValue,
      }}
    >
      {children}
    </PersonnalisationFiltersContext.Provider>
  );
};

export const usePersonnalisationFilters = () => {
  const context = useContext(PersonnalisationFiltersContext);
  if (!context) {
    throw new Error(
      'usePersonnalisationFilters must be used within a PersonnalisationFiltersProvider'
    );
  }
  return context;
};
