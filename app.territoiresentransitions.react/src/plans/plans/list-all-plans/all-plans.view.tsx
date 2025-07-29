import { CreatePlanButton } from '@/app/plans/plans/create-plan/components/create-plan.button';
import { EmptyAllPlansView } from '@/app/plans/plans/list-all-plans/empty-all-plans.view';
import { Plan } from '@/domain/plans/plans';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { Header } from '../components/header';
import { PlanCardWithFiltersList } from './plan-card-with-filters.list';

type Props = {
  plans: Plan[];
  collectiviteId: number;
  panierId: string | undefined;
};

export const AllPlansView = ({ plans, collectiviteId, panierId }: Props) => {
  return (
    <>
      <Header
        title="Tous les plans"
        actionButtons={
          <VisibleWhen condition={plans.length !== 0}>
            <CreatePlanButton
              collectiviteId={collectiviteId}
              panierId={panierId}
            >
              {"Créer un plan d'action"}
            </CreatePlanButton>
          </VisibleWhen>
        }
      />
      <VisibleWhen condition={plans.length === 0}>
        <div className="min-h-[60vh]">
          <EmptyAllPlansView
            collectiviteId={collectiviteId}
            panierId={panierId}
          />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={plans.length !== 0}>
        <div className="min-h-[50vh]">
          <PlanCardWithFiltersList
            collectiviteId={collectiviteId}
            plans={plans}
          />
        </div>
      </VisibleWhen>
    </>
  );
};
