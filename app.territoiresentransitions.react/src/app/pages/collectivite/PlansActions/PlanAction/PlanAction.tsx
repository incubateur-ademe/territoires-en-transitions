import {useCollectiviteId} from 'core-logic/hooks/params';
import {useParams} from 'react-router-dom';
import {TPlanAction} from './data/types/PlanAction';
import {usePlanAction} from './data/usePlanAction';
import PlanActionSousAxe from './PlanActionSousAxe';
import PlanActionHeader from './PlanActionHeader';
import PlanActionAxe from './PlanActionAxe';

type PlanActionProps = {
  plan: TPlanAction;
};

export const PlanAction = ({plan}: PlanActionProps) => {
  const collectivite_id = useCollectiviteId();

  const displaySousAxe = (axe: TPlanAction) => (
    <PlanActionSousAxe
      plan_id={plan.id}
      axe={axe}
      displayAxe={displaySousAxe}
    />
  );

  return (
    <div className="w-full">
      <div className="bg-indigo-400">
        <h4 className="max-w-4xl mx-auto m-0 py-8 px-10 text-white">
          {plan.nom ?? 'Sans titre'}
        </h4>
      </div>
      <div className="max-w-4xl mx-auto px-10">
        <PlanActionHeader plan={plan} collectivite_id={collectivite_id!} />
        {plan.enfants.map(enfant => (
          <PlanActionAxe
            key={enfant.id}
            plan_id={plan.id}
            axe={enfant}
            displayAxe={displaySousAxe}
          />
        ))}
      </div>
    </div>
  );
};

const PlanActionConnected = () => {
  const {planUid} = useParams<{planUid: string}>();

  const data = usePlanAction(parseInt(planUid));

  return data ? <PlanAction plan={data.plan} /> : <div></div>;
};

export default PlanActionConnected;
