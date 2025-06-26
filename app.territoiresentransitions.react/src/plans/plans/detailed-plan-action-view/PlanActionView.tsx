'use client';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { AxeActions } from '@/app/plans/plans/detailed-plan-action-view/AxeActions';
import Arborescence from '@/app/plans/plans/detailed-plan-action-view/DragAndDropNestedContainers/Arborescence';
import { EmptyPlanAction } from '@/app/plans/plans/detailed-plan-action-view/EmptyPlanAction';
import { TPlanType } from '@/app/types/alias';
import { Spacer } from '@/ui/design-system/Spacer';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { PlanNode } from '../types';
import { checkAxeHasFiche } from '../utils';
import { usePlanAction } from './data/use-fetch-plan-action';
import { FiltresMenuButton } from './Filtres';
import { usePlanActionFilters } from './Filtres/context/PlanActionFiltersContext';
import { FilteredResults } from './Filtres/FilteredResults';
import { Header } from './Header';

const DetailedPlanActionPanel = ({
  children,
  currentCollectivite,
  rootAxe,
  axeHasFiche,
}: {
  children: React.ReactNode;
  currentCollectivite: CurrentCollectivite;
  rootAxe: PlanNode;
  axeHasFiche: boolean;
}) => {
  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg text-primary-9 font-bold">
          Liste des actions
        </div>
        <div className="flex items-center align-middle gap-4">
          <VisibleWhen condition={currentCollectivite.isReadOnly === false}>
            <AxeActions
              plan={rootAxe}
              collectiviteId={currentCollectivite.collectiviteId}
            />
          </VisibleWhen>
          <VisibleWhen condition={axeHasFiche}>
            <FiltresMenuButton />
          </VisibleWhen>
        </div>
      </div>
      {children}
    </div>
  );
};

type Props = {
  currentCollectivite: CurrentCollectivite;
  /** Axe racine du plan d'action (depth = 0) */
  rootAxe: PlanNode;
  /** La liste des axes liés à ce plan d'action */
  axes: PlanNode[];
  /** Type du plan d'action */
  planType: TPlanType | null;
};

const DetailedPlanAction = ({
  currentCollectivite,
  rootAxe,
  axes,
}: {
  currentCollectivite: CurrentCollectivite;
  rootAxe: PlanNode;
  axes: PlanNode[];
}) => {
  const {
    isFiltered,
    filteredResults,
    resetFilters,
    filters,
    onDeleteFilterValue,
    onDeleteFilterCategory,
    getFilterValuesLabels,
  } = usePlanActionFilters();

  const axeHasFiche = checkAxeHasFiche(rootAxe, axes);

  const filtersToDisplay = {
    referents: filters.referents,
    statuts: filters.statuts,
    priorites: filters.priorites,
    pilotes: filters.pilotes,
  };

  return (
    <DetailedPlanActionPanel
      currentCollectivite={currentCollectivite}
      rootAxe={rootAxe}
      axeHasFiche={axeHasFiche}
    >
      <VisibleWhen condition={!isFiltered}>
        <Arborescence
          plan={rootAxe}
          axes={axes}
          collectivite={currentCollectivite}
        />
      </VisibleWhen>
      <VisibleWhen condition={isFiltered}>
        <FilteredResults
          collectivite={currentCollectivite}
          planId={rootAxe.id.toString()}
          filteredResults={filteredResults}
          resetFilters={resetFilters}
          filters={filtersToDisplay}
          onDeleteFilterValue={onDeleteFilterValue}
          onDeleteFilterCategory={onDeleteFilterCategory}
          getFilterValuesLabels={getFilterValuesLabels}
        />
      </VisibleWhen>
    </DetailedPlanActionPanel>
  );
};

export const PlanActionView = ({
  rootAxe: initialRootAxe,
  axes: initialAxes,
  currentCollectivite,
  planType,
}: Props) => {
  const axes = usePlanAction(initialRootAxe.id, {
    initialData: initialAxes,
  });
  const rootAxe = axes.find((a) => a.depth === 0) ?? initialRootAxe;
  const axeHasFiches = checkAxeHasFiche(rootAxe, axes);

  return (
    <div data-test="PlanAction" className="w-full">
      <Header
        collectivite={currentCollectivite}
        plan={rootAxe}
        axes={axes}
        planType={planType}
        axeHasFiches={axeHasFiches}
      />
      <Spacer height={4} />
      <VisibleWhen condition={axes.length === 0}>
        <EmptyPlanAction
          currentCollectivite={currentCollectivite}
          plan={rootAxe}
        />
      </VisibleWhen>
      <VisibleWhen condition={axes.length !== 0}>
        <DetailedPlanAction
          currentCollectivite={currentCollectivite}
          rootAxe={rootAxe}
          axes={axes}
        />
      </VisibleWhen>
    </div>
  );
};
