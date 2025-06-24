'use client';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { TFilters } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/filters';
import { useFichesActionFiltresListe } from '@/app/plans/plans/detailed-plan-action-view/data/useFichesActionFiltresListe';
import { FicheResume } from 'packages/domain/src/plans/fiches/index-domain';
import { createContext, ReactNode, useContext } from 'react';

type PlanActionFiltersContextType = {
  filters: TFilters;
  setFilters: (filters: TFilters) => void;
  isFiltered: boolean;
  filteredResults: FicheResume[];
  resetFilters: () => void;
};

const PlanActionFiltersContext =
  createContext<PlanActionFiltersContextType | null>(null);

export const PlanActionFiltersProvider = ({
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
  const initialFilters: TFilters = {
    collectivite_id: collectivite.collectiviteId,
    axes: [planId],
  };

  const filters = useFichesActionFiltresListe({
    url,
    initialFilters,
  });

  // On prend à partir de 2 éléments car les filtres "collectivite_id" et "plan/axe id" sont des constantes
  // Et on le passe au parent pour afficher le plan ou les filtres
  const isFiltered = filters.filtersCount > 2;

  return (
    <PlanActionFiltersContext.Provider
      value={{
        filters: filters.filters,
        setFilters: filters.setFilters,
        isFiltered,
        filteredResults: filters.items,
        resetFilters: () => filters.setFilters(initialFilters),
      }}
    >
      {children}
    </PlanActionFiltersContext.Provider>
  );
};

export const usePlanActionFilters = () => {
  const context = useContext(PlanActionFiltersContext);
  if (!context) {
    throw new Error(
      'usePlanActionFilters must be used within a PlanActionFiltersProvider'
    );
  }
  return context;
};
