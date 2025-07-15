'use client';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { useGetPlanType } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/use-get-plan-type';
import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsLandingUrl,
} from '@/app/app/paths';
import { usePlanFilters } from '@/app/plans/plans/show-detailed-plan/filters/plan-filters.context';
import { TPlanType } from '@/app/types/alias';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { Spacer } from '@/ui/design-system/Spacer';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { Header } from '../components/header';
import { PlanNode } from '../types';
import { checkAxeHasFiche } from '../utils';
import { Actions } from './actions';
import { ContentPanelWithHeader } from './content-panel-with-header';
import { useFetchPlan } from './data/use-fetch-plan';
import { EditPlanButtons } from './edit-plan.buttons';
import { FiltersMenuButton } from './filters';
import { FilteredResults } from './filters/FilteredResults';
import { PlanArborescence } from './plan-arborescence.view.tsx';
import { PlanStatus } from './plan-status.chart';

type Props = {
  currentCollectivite: CurrentCollectivite;
  /** Axe racine du plan d'action (depth = 0) */
  rootAxe: PlanNode;
  /** La liste des axes liés à ce plan d'action */
  axes: PlanNode[];
  /** Type du plan d'action */
  planType: TPlanType | null;
};

export const DetailedPlanView = ({
  rootAxe: initialRootAxe,
  axes: initialAxes,
  currentCollectivite,
  planType: initialPlanType,
}: Props) => {
  const {
    isFiltered,
    filteredResults,
    resetFilters,
    filters,
    onDeleteFilterValue,
    onDeleteFilterCategory,
    getFilterValuesLabels,
  } = usePlanFilters();
  const planType = useGetPlanType({
    planId: initialRootAxe.id,
    collectiviteId: currentCollectivite.collectiviteId,
    initialData: initialPlanType,
  });
  const axes = useFetchPlan(initialRootAxe.id, {
    initialData: initialAxes,
  });
  const rootAxe = axes.find((a) => a.depth === 0) ?? initialRootAxe;
  const axeHasFiches = checkAxeHasFiche(rootAxe, axes);

  const filtersToDisplay = {
    referents: filters.referents,
    statuts: filters.statuts,
    priorites: filters.priorites,
    pilotes: filters.pilotes,
  };
  const planNameOrFallback =
    rootAxe.nom.length > 0 ? rootAxe.nom : 'Sans titre';

  return (
    <div className="w-full">
      <Header
        title={planNameOrFallback}
        actionButtons={
          <VisibleWhen condition={currentCollectivite.isReadOnly === false}>
            <Actions
              plan={rootAxe}
              collectiviteId={currentCollectivite.collectiviteId}
              type={planType}
              axes={axes}
              axeHasFiches={axeHasFiches}
            />
          </VisibleWhen>
        }
        breadcrumbs={[
          {
            label: "Tous les plans d'action",
            href: makeCollectivitePlansActionsLandingUrl({
              collectiviteId: currentCollectivite.collectiviteId,
            }),
          },
          {
            label: planNameOrFallback,
            href: makeCollectivitePlanActionUrl({
              collectiviteId: currentCollectivite.collectiviteId,
              planActionUid: rootAxe.id.toString(),
            }),
          },
        ]}
      />
      <Spacer height={1} />
      <div className="flex flex-col gap-2 grow">
        <span className="text-sm uppercase text-grey-8 font-normal">
          {planType?.type || 'Sans type'}
        </span>
        <PlanStatus planId={rootAxe.id} />
      </div>
      <Spacer height={4} />

      <ContentPanelWithHeader
        title="Détail du plan"
        headerActionButtons={
          <>
            <VisibleWhen condition={currentCollectivite.isReadOnly === false}>
              <EditPlanButtons
                plan={rootAxe}
                collectiviteId={currentCollectivite.collectiviteId}
                availableActions={
                  isFiltered
                    ? ['createFicheResume']
                    : ['addAxe', 'createFicheResume']
                }
              />
            </VisibleWhen>
            <VisibleWhen condition={axeHasFiches}>
              <FiltersMenuButton />
            </VisibleWhen>
          </>
        }
      >
        <VisibleWhen condition={!isFiltered}>
          <PlanArborescence
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
      </ContentPanelWithHeader>
      <Spacer height={2} />
      <ScrollTopButton />
    </div>
  );
};
