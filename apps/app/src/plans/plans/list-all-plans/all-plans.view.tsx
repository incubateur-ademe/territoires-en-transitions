'use client';
import { appLabels } from '@/app/labels/catalog';
import { CreatePlanButton } from '@/app/plans/plans/create-plan/components/create-plan.button';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { ListPlansEmptyCard } from '@/app/plans/plans/list-all-plans/list-plans.empty-card';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { PageHeader, Spacer, VisibleWhen } from '@tet/ui';
import { useQueryStates } from 'nuqs';
import { Filters } from './plan-card-with-filters.list/filters';
import { PlanCardList } from './plan-card-with-filters.list/plan-card.list';
import {
  sortURLParametersNames,
  sortURLParametersParser,
} from './plan-card-with-filters.list/sorting-parameters';
type Props = {
  panierId: string | undefined;
};

export const AllPlansView = ({ panierId }: Props) => {
  const collectivite = useCurrentCollectivite();
  const { collectiviteId, hasCollectivitePermission } = collectivite;

  const [sortParams, setSortParams] = useQueryStates(sortURLParametersParser, {
    urlKeys: sortURLParametersNames,
  });

  const { plans, totalCount, isLoading } = useListPlans(collectiviteId, {
    sort: sortParams,
  });

  const plansAvailable = !isLoading && plans.length > 0;
  const noPlanAvailable = !isLoading && plans.length === 0;
  return (
    <>
      <PageHeader>
        <PageHeader.Title>{appLabels.tousLesPlans}</PageHeader.Title>
        {plansAvailable && hasCollectivitePermission('plans.mutate') && (
          <PageHeader.Actions>
            <CreatePlanButton
              collectiviteId={collectiviteId}
              panierId={panierId}
            />
          </PageHeader.Actions>
        )}
        {plansAvailable && (
          <PageHeader.Metadata>
            <Filters
              plansCount={totalCount}
              sortedBy={sortParams.field}
              onChangeSort={(field, direction) =>
                setSortParams({ field, direction })
              }
            />
          </PageHeader.Metadata>
        )}
      </PageHeader>
      <VisibleWhen condition={isLoading}>
        <div className="flex justify-center items-center h-96">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={noPlanAvailable}>
        <Spacer height={3} />
        <ListPlansEmptyCard collectivite={collectivite} panierId={panierId} />
      </VisibleWhen>
      <VisibleWhen condition={plansAvailable}>
        <PlanCardList plans={plans} collectiviteId={collectiviteId} />
      </VisibleWhen>
    </>
  );
};
