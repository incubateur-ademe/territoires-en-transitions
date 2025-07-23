'use client';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { usePersonneListe } from '@/app/ui/dropdownLists/PersonnesDropdown/usePersonneListe';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import { TOption } from '@/app/ui/shared/select/commons';
import { FicheResume } from 'packages/domain/src/plans/fiches/index-domain';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useFichesActionFiltresListe } from '../data/use-fiches-filters-list';
import { Filters } from '../data/use-fiches-filters-list/types';

type PlanActionFiltersContextType = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  isFiltered: boolean;
  filteredResults: FicheResume[];
  resetFilters: () => void;
  onDeleteFilterCategory: (key: keyof Filters) => void;
  personneOptions: TOption[];
  onDeleteFilterValue: ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: keyof Filters;
    valueToDelete: string;
  }) => void;
  getFilterValuesLabels: (values: string[]) => string[];
};

const PlanFiltersContext = createContext<PlanActionFiltersContextType | null>(
  null
);

export const PlanFiltersProvider = ({
  children,
  url,
  collectivite,
  planId,
}: {
  children: ReactNode;
  url: string;
  collectivite: CurrentCollectivite;
  planId: number;
}) => {
  const initialFilters: Filters = {
    collectivite_id: collectivite.collectiviteId,
    axes: [planId],
  };
  const { data: personnes } = usePersonneListe();

  const filters = useFichesActionFiltresListe({
    url,
    initialFilters: {
      collectivite_id: collectivite.collectiviteId,
      axes: [planId],
    },
  });

  // On prend à partir de 2 éléments car les filtres "collectivite_id" et "plan/axe id" sont des constantes
  // Et on le passe au parent pour afficher le plan ou les filtres
  const isFiltered = filters.filtersCount > 2;

  const removeFilterCategory = (key: keyof Filters) => {
    const newFilters = { ...filters.filters };
    delete newFilters[key];
    filters.setFilters(newFilters);
  };

  const personneOptions = useMemo(() => {
    return (
      personnes?.map((personne) => ({
        value: getPersonneStringId(personne),
        label: personne.nom,
      })) ?? []
    );
  }, [personnes]);

  const onDeleteFilterValue = ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: keyof Filters;
    valueToDelete: string;
  }) => {
    const valueToActuallyDelete =
      personneOptions.find((personne) => personne.label === valueToDelete)
        ?.value ?? valueToDelete;

    const updatedFilters: Filters = {
      ...filters.filters,
      [categoryKey]: (filters.filters[categoryKey] as string[]).filter(
        (currentValue) => currentValue !== valueToActuallyDelete
      ),
    };

    filters.setFilters(updatedFilters);
  };

  const getFilterValuesLabels = (values: string[]) => {
    return values.map(
      (value) =>
        personneOptions.find((personne) => personne.value === value)?.label ??
        value
    );
  };

  return (
    <PlanFiltersContext.Provider
      value={{
        filters: filters.filters,
        setFilters: filters.setFilters,
        isFiltered,
        filteredResults: filters.items,
        resetFilters: () => filters.setFilters(initialFilters),
        onDeleteFilterCategory: removeFilterCategory,
        personneOptions,
        onDeleteFilterValue,
        getFilterValuesLabels,
      }}
    >
      {children}
    </PlanFiltersContext.Provider>
  );
};

export const usePlanFilters = () => {
  const context = useContext(PlanFiltersContext);
  if (!context) {
    throw new Error('usePlanFilters must be used within a PlanFiltersProvider');
  }
  return context;
};
