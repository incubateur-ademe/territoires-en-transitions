import { Plan } from '@/domain/plans/plans';
import { Header } from '../components/header';
import { EditPlanButtons } from './edit-plan.buttons';
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
          <EditPlanButtons
            collectiviteId={collectiviteId}
            panierId={panierId}
          />
        }
      />
      <div className="min-h-[50vh]">
        <PlanCardWithFiltersList
          collectiviteId={collectiviteId}
          plans={plans}
        />
      </div>
    </>
  );
};
