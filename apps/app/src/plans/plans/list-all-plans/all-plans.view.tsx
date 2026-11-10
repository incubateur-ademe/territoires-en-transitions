'use client';
import { makeCollectivitePlanImportsUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CreatePlanButton } from '@/app/plans/plans/create-plan/components/create-plan.button';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { ListPlansEmptyCard } from '@/app/plans/plans/list-all-plans/list-plans.empty-card';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { planStatusValues } from '@tet/domain/plans';
import {
  Button,
  Event,
  PageHeader,
  Spacer,
  useEventTracker,
  VisibleWhen,
} from '@tet/ui';
import { isNotNil } from 'es-toolkit';
import { useQueryStates } from 'nuqs';
import { useState } from 'react';
import { PlanCardDisplay } from '../components/card/plan.card';
import { Filters } from './plan-card-with-filters.list/filters';
import { PlanCardList } from './plan-card-with-filters.list/plan-card.list';
import {
  sortURLParametersNames,
  sortURLParametersParser,
} from './plan-card-with-filters.list/sorting-parameters';
export const AllPlansView = () => {
  const tracker = useEventTracker();
  const collectivite = useCurrentCollectivite();
  const { collectiviteId, hasCollectivitePermission } = collectivite;

  const [sortParams, setSortParams] = useQueryStates(sortURLParametersParser, {
    urlKeys: sortURLParametersNames,
  });

  const [planCardDisplay, setPlanCardDisplay] =
    useState<PlanCardDisplay>('row');

  const { plans, totalCount, isLoading, error, refetch } = useListPlans(
    collectiviteId,
    { sort: sortParams, statuses: planStatusValues }
  );

  const hasFailed = isNotNil(error);
  const plansAvailable = !isLoading && !hasFailed && plans.length > 0;
  const noPlanAvailable = !isLoading && !hasFailed && plans.length === 0;
  return (
    <>
      <PageHeader>
        <PageHeader.Title>{appLabels.plans}</PageHeader.Title>
        <PageHeader.Actions>
          <div className="flex flex-wrap items-center gap-2">
            {plansAvailable && hasCollectivitePermission('plans.mutate') && (
              <CreatePlanButton collectiviteId={collectiviteId} />
            )}
            {hasCollectivitePermission('plans.fiches.import') && (
              <Button
                size="sm"
                variant="outlined"
                href={makeCollectivitePlanImportsUrl({ collectiviteId })}
                onClick={() =>
                  tracker(Event.plans.importIa.historique, {
                    origine: 'liste_plans',
                  })
                }
              >
                {appLabels.importPlanIaHistorique}
              </Button>
            )}
          </div>
        </PageHeader.Actions>
        {plansAvailable && (
          <PageHeader.Metadata>
            <Filters
              plansCount={totalCount}
              sortedBy={sortParams.field}
              onChangeSort={(field, direction) =>
                setSortParams({ field, direction })
              }
              display={planCardDisplay}
              onChangeDisplay={(display) => setPlanCardDisplay(display)}
            />
          </PageHeader.Metadata>
        )}
      </PageHeader>
      <VisibleWhen condition={isLoading}>
        <div className="flex justify-center items-center h-96">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={hasFailed}>
        <Spacer height={3} />
        <ErrorCard
          title={appLabels.uneErreurEstSurvenue}
          retry={() => refetch()}
        />
      </VisibleWhen>
      <VisibleWhen condition={noPlanAvailable}>
        <Spacer height={3} />
        <ListPlansEmptyCard collectivite={collectivite} />
      </VisibleWhen>
      <VisibleWhen condition={plansAvailable}>
        <PlanCardList
          plans={plans}
          collectiviteId={collectiviteId}
          display={planCardDisplay}
        />
      </VisibleWhen>
    </>
  );
};
