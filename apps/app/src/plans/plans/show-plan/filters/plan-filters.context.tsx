'use client';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { usePersonneListe } from '@/app/ui/dropdownLists/PersonnesDropdown/usePersonneListe';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import { TOption } from '@/app/ui/shared/select/commons';
import { FicheResume } from '@/domain/plans/fiches';
import { Plan } from '@/domain/plans/plans';
import { without } from 'es-toolkit';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useFichesActionFiltresListe } from '../data/use-fiches-filters-list';
import {
  Filters,
  PrioriteOrNot,
  StatutOrNot,
} from '../data/use-fiches-filters-list/types';

export type CurrentFilters = Omit<Filters, 'collectivite_id' | 'axes'>;
export type CurrentFiltersKeys = keyof CurrentFilters;

type PlanActionFiltersContextType = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  isFiltered: boolean;
  filteredResults: FicheResume[];
  resetFilters: () => void;
  onDeleteFilterCategory: (
    key: CurrentFiltersKeys | CurrentFiltersKeys[]
  ) => void;
  personneOptions: TOption[];
  onDeleteFilterValue: ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: CurrentFiltersKeys | CurrentFiltersKeys[];
    valueToDelete: string;
  }) => void;
  getFilterValuesLabels: (
    categoryKey: CurrentFiltersKeys,
    values: string[]
  ) => string[];
  getFilterLabel: (key: CurrentFiltersKeys) => string;
};

const PlanFiltersContext = createContext<PlanActionFiltersContextType | null>(
  null
);

const filterLabels: Record<keyof Filters, string> = {
  priorites: 'Niveau de priorité',
  statuts: 'Statut',
  referents: 'Élu·e référent·e',
  pilotes: 'Personne pilote',
  collectivite_id: 'Collectivité',
  axes: 'Axe',
};

export const PlanFiltersProvider = ({
  plan,
  children,
  url,
  collectivite,
}: {
  children: ReactNode;
  url: string;
  collectivite: CurrentCollectivite;
  plan: Plan;
}) => {
  const initialFilters: Filters = {
    collectivite_id: collectivite.collectiviteId,
    axes: [plan.id],
  };
  const { data: personnes } = usePersonneListe();

  const { filters, setFilters, items } = useFichesActionFiltresListe({
    url,
    parameters: {
      collectivite_id: collectivite.collectiviteId,
      axes: plan.axes.map((axe) => axe.id),
    },
  });

  // On prend à partir de 2 éléments car les filtres "collectivite_id" et "plan/axe id" sont des filtres de base
  const isFiltered = Object.keys(filters).length > 2;

  const onDeleteFilterCategory = (
    key: CurrentFiltersKeys | CurrentFiltersKeys[]
  ) => {
    const keys = Array.isArray(key) ? key : [key];
    const newFilters = { ...filters };
    keys.forEach((k) => {
      delete newFilters[k];
    });
    setFilters(newFilters);
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
    categoryKey: CurrentFiltersKeys | CurrentFiltersKeys[];
    valueToDelete: string;
  }) => {
    const keys = Array.isArray(categoryKey) ? categoryKey : [categoryKey];
    const updatedFilters: Filters = { ...filters };
    const valueToActuallyDelete =
      personneOptions.find((personne) => personne.label === valueToDelete)
        ?.value ?? valueToDelete;

    keys.forEach((k) => {
      const currentValues = updatedFilters[k];
      if (currentValues && Array.isArray(currentValues)) {
        const newValues = without(currentValues, valueToActuallyDelete);
        updatedFilters[k] =
          newValues.length > 0
            ? (newValues as PrioriteOrNot[] & StatutOrNot[] & string[])
            : undefined;
      }
    });

    setFilters(updatedFilters);
  };

  const getFilterValuesLabels = (key: keyof Filters, values: string[]) => {
    if (key === 'referents' || key === 'pilotes') {
      return values.map((value) => {
        const personne = personneOptions.find(
          (personne) => personne.value === value
        );
        return personne?.label ?? value;
      });
    }
    return values.map(
      (value) =>
        personneOptions.find((personne) => personne.value === value)?.label ??
        value
    );
  };

  const getFilterLabel = (key: keyof Filters) => {
    return filterLabels[key];
  };

  return (
    <PlanFiltersContext.Provider
      value={{
        filters,
        setFilters: setFilters,
        isFiltered,
        filteredResults: items,
        resetFilters: () => setFilters(initialFilters),
        onDeleteFilterCategory,
        personneOptions,
        onDeleteFilterValue,
        getFilterValuesLabels,
        getFilterLabel,
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
