'use client';
import { CreatePlanButton } from '@/app/plans/plans/create-plan/components/create-plan.button';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { ListPlansEmptyCard } from '@/app/plans/plans/list-all-plans/list-plans.empty-card';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Spacer, VisibleWhen } from '@tet/ui';
import { useQueryStates } from 'nuqs';
import { Header } from '../components/header';
import { PlanCardWithFiltersList } from './plan-card-with-filters.list';
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

  const { plans, isLoading } = useListPlans(collectiviteId, {
    sort: sortParams,
  });

  const plansAvailable = !isLoading && plans.length > 0;
  const noPlanAvailable = !isLoading && plans.length === 0;
  return (
    <>
      <Header
        title="Tous les plans"
        actionButtons={
          <div className="flex gap-2">
            <VisibleWhen
              condition={
                plansAvailable && hasCollectivitePermission('plans.mutate')
              }
            >
              <CreatePlanButton
                collectiviteId={collectiviteId}
                panierId={panierId}
              />
            </VisibleWhen>
          </div>
        }
      />
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
        <Spacer height={1} />
        <PlanCardWithFiltersList
          collectiviteId={collectiviteId}
          plans={plans}
          sort={sortParams}
          setSortParams={setSortParams}
        />
      </VisibleWhen>
    </>
  );
};
