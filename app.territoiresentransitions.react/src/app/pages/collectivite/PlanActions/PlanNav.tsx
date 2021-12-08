import {Chip} from '@material-ui/core';
import {useParams} from 'react-router-dom';
import {useAllStorables} from 'core-logic/hooks';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {planActionStore} from 'core-logic/api/hybridStores';

function PlanNavChip(props: {
  collectiviteId: string;
  planUid: string;
  planNom: string;
  active: boolean;
}) {
  return (
    <div className="mr-2">
      <Chip
        label={props.planNom}
        component="a"
        href={`/epci/${props.collectiviteId}/plan_action/${props.planUid}`}
        color={props.active ? 'primary' : 'default'}
        clickable
      />
    </div>
  );
}

export function PlanNav() {
  const {collectiviteId, planUid} =
    useParams<{collectiviteId: string; planUid: string}>();
  const plans = useAllStorables<PlanActionStorable>(planActionStore);
  plans.sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <nav className="flex flex-row">
      {plans.map(plan => (
        <PlanNavChip
          collectiviteId={collectiviteId}
          planUid={plan.uid}
          planNom={plan.nom}
          active={plan.uid === planUid}
          key={plan.uid}
        />
      ))}
    </nav>
  );
}
