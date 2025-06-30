import { Axe } from '@/backend/plans/fiches/index-domain';
import { Header } from '../components/Header';
import { Actions } from './components/Actions';
import { PlansList } from './components/PlansList';

type Props = {
  plans: Axe[];
  collectiviteId: number;
  panierId: string | undefined;
};

export const AllPlansView = ({ plans, collectiviteId, panierId }: Props) => {
  return (
    <>
      <Header
        title="Tous les plans"
        actionButtons={
          <Actions collectiviteId={collectiviteId} panierId={panierId} />
        }
      />
      <div className="min-h-[50vh]">
        <PlansList collectiviteId={collectiviteId} plans={plans} />
      </div>
    </>
  );
};
