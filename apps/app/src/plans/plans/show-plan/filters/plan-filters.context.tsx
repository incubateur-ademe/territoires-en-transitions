'use client';

import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import {
  SousActionsMatches,
  useCountSousActionsMatches,
} from '@/app/plans/fiches/list-all-fiches/data/use-count-sous-actions-matches';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import {
  PrioriteOrNot,
  StatutOrNot,
} from '@/app/plans/fiches/list-all-fiches/filters/types';
import { TOption } from '@/app/ui/shared/select/commons';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Plan } from '@tet/domain/plans';
import { without } from 'es-toolkit';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useFichesActionFiltresListe } from '../data/use-fiches-filters-list';
import { appLabels } from '@/app/labels/catalog';
import { PlanFilterKey, planFilterLabels } from './plan-filters.fields';
import {
  FormFilters,
  SuiviOption,
} from '../data/use-fiches-filters-list/types';
/** Filtres à valeurs, plus le périmètre « Sous-actions incluses » en badge */
export type CurrentFiltersKeys = PlanFilterKey | 'withSousActionsMatches';

type PlanActionFiltersContextType = {
  filters: FormFilters;
  setFilters: (filters: FormFilters) => void;
  isFiltered: boolean;
  isLoading: boolean;
  filtersCount: number;
  filteredResults: FicheListItem[];
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
  /** Sous-actions qui correspondent aux filtres, et leurs actions */
  sousActionsMatches?: SousActionsMatches;
  includeSousActions: () => void;
};

const PlanFiltersContext = createContext<PlanActionFiltersContextType | null>(
  null
);

export const PlanFiltersProvider = ({
  plan,
  children,
}: {
  children: ReactNode;
  plan: Plan;
}) => {
  const collectiviteId = useCollectiviteId();

  const initialFilters: FormFilters = {
    collectiviteId,
    axes: [plan.id],
  };
  const { data: personnes } = usePersonneListe();

  const { filters, setFilters, items, filtersCount, isLoading, queryFilters } =
    useFichesActionFiltresListe({
      parameters: {
        collectiviteId,
        axes: plan.axes.map((axe) => axe.id),
      },
    });

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
    const keys = (
      Array.isArray(categoryKey) ? categoryKey : [categoryKey]
    ).filter((k): k is PlanFilterKey => k !== 'withSousActionsMatches');
    const updatedFilters: FormFilters = { ...filters };
    const valueToActuallyDelete =
      personneOptions.find((personne) => personne.label === valueToDelete)
        ?.value ?? valueToDelete;

    keys.forEach((k) => {
      const currentValues = updatedFilters[k];
      if (currentValues && Array.isArray(currentValues)) {
        const newValues = without(currentValues, valueToActuallyDelete);
        updatedFilters[k] =
          newValues.length > 0
            ? (newValues as PrioriteOrNot[] &
                StatutOrNot[] &
                SuiviOption[] &
                string[])
            : undefined;
      }
    });

    setFilters(updatedFilters);
  };

  const getFilterValuesLabels = (key: keyof FormFilters, values: string[]) => {
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

  const getFilterLabel = (key: CurrentFiltersKeys) =>
    key === 'withSousActionsMatches'
      ? appLabels.filtresSousActionsIncluses
      : planFilterLabels[key];

  const hasNoResult = !isLoading && items.length === 0;
  const sousActionsMatches = useCountSousActionsMatches({
    collectiviteId,
    filters: queryFilters,
    enabled: !!filters.withSousActionsMatches || hasNoResult,
  });

  return (
    <PlanFiltersContext
      value={{
        filters,
        setFilters,
        isFiltered: filtersCount > 0,
        isLoading,
        filtersCount,
        filteredResults: items,
        resetFilters: () => setFilters(initialFilters),
        onDeleteFilterCategory,
        personneOptions,
        onDeleteFilterValue,
        getFilterValuesLabels,
        getFilterLabel,
        sousActionsMatches,
        includeSousActions: () =>
          setFilters({ ...filters, withSousActionsMatches: true }),
      }}
    >
      {children}
    </PlanFiltersContext>
  );
};

export const usePlanFilters = () => {
  const context = useContext(PlanFiltersContext);
  if (!context) {
    throw new Error('usePlanFilters must be used within a PlanFiltersProvider');
  }
  return context;
};
