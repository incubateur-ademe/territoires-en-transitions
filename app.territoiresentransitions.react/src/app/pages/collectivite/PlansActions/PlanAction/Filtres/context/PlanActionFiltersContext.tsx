'use client';

import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { TFilters } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/filters';
import { PlanNode } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/types';
import { FicheResume } from 'packages/domain/src/plans/fiches/index-domain';
import { createContext, ReactNode, useContext } from 'react';
import { useFichesActionFiltresListe } from '../../../FicheAction/data/useFichesActionFiltresListe';

type PlanActionFiltersContextType = {
  filters: TFilters;
  setFilters: (filters: TFilters) => void;
  isFiltered: boolean;
  url: string;
  filteredResults: FicheResume[];
  resetFilters: () => void;
};

const PlanActionFiltersContext =
  createContext<PlanActionFiltersContextType | null>(null);

export const PlanActionFiltersProvider = ({
  children,
  url,
  collectivite,
  axe,
}: {
  children: ReactNode;
  url: string;
  collectivite: CollectiviteNiveauAcces;
  axe: PlanNode;
}) => {
  const initialFilters: TFilters = {
    collectivite_id: collectivite.collectiviteId,
    axes: [axe.id],
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
        url,
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
