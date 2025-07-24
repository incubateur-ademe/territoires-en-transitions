'use client';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsLandingUrl,
} from '@/app/app/paths';
import { PiloteOrReferentLabel } from '@/app/plans/plans/components/PiloteOrReferentLabel';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { Plan } from '@/domain/plans/plans';
import { Spacer, VisibleWhen } from '@/ui';
import { Header } from '../components/header';
import { checkAxeHasFiche } from '../utils';
import { Actions } from './actions';
import { ContentPanelWithHeader } from './content-panel-with-header';
import { useGetPlan } from './data/use-get-plan';
import { EditPlanButtons } from './edit-plan.buttons';
import { FiltersMenuButton } from './filters';
import { FilteredResults } from './filters/FilteredResults';
import { usePlanFilters } from './filters/plan-filters.context';
import { PlanArborescence } from './plan-arborescence.view.tsx';
import { PlanStatus } from './plan-status.chart';

type Props = {
  currentCollectivite: CurrentCollectivite;
  plan: Plan;
};
const PlanMetadata = ({ plan }: { plan: Plan }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm uppercase text-grey-8 font-normal">
        {plan.type?.type || 'Sans type'}
      </span>
      <VisibleWhen condition={plan.pilotes.length > 0}>
        <div className="border-l-2 border-gray-200 px-2">
          <PiloteOrReferentLabel icon="pilote" personnes={plan.pilotes} />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={plan.referents.length > 0}>
        <div className="border-l-2 border-gray-200 px-2">
          <PiloteOrReferentLabel icon="france" personnes={plan.referents} />
        </div>
      </VisibleWhen>
    </div>
  );
};

export const PlanView = ({
  currentCollectivite,
  plan: initialPlanData,
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
  const plan = useGetPlan(initialPlanData.id, {
    initialData: initialPlanData,
  });
  const rootAxe = plan.axes.find((axe) => axe.parent === null);
  const axeHasFiches = rootAxe ? checkAxeHasFiche(rootAxe, plan.axes) : false;

  const filtersToDisplay = {
    referents: filters.referents,
    statuts: filters.statuts,
    priorites: filters.priorites,
    pilotes: filters.pilotes,
  };

  if (!rootAxe) {
    return <div>Plan non trouvé</div>;
  }

  const planNameOrFallback = rootAxe.nom ?? 'Sans titre';

  return (
    <div className="w-full">
      <Header
        title={planNameOrFallback}
        actionButtons={
          <VisibleWhen condition={currentCollectivite.isReadOnly === false}>
            <Actions plan={plan} axeHasFiches={axeHasFiches} />
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
      >
        <div className="flex flex-col gap-2 grow">
          <PlanMetadata plan={plan} />

          <PlanStatus planId={plan.id} />
        </div>
      </Header>

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
            axes={plan.axes}
            collectivite={currentCollectivite}
          />
        </VisibleWhen>
        <VisibleWhen condition={isFiltered}>
          <FilteredResults
            collectivite={currentCollectivite}
            planId={rootAxe.id}
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
