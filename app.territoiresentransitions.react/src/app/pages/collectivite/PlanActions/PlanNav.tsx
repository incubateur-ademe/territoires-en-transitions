import {Chip} from '@material-ui/core';
import {useParams} from 'react-router-dom';
import {useAllStorables} from 'core-logic/hooks';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {planActionStore} from 'core-logic/api/hybridStores';
import {useState} from 'react';

function PlanNavChip(props: {
  epciId: string;
  planUid: string;
  planNom: string;
  active: boolean;
}) {
  return (
    <div className="mr-2">
      <Chip
        label={props.planNom}
        component="a"
        href={`/collectivite/${props.epciId}/plan_action/${props.planUid}`}
        color={props.active ? 'primary' : 'default'}
        clickable
      />
    </div>
  );
}

export function PlanNav() {
  const {epciId, planUid} = useParams<{epciId: string; planUid: string}>();
  const plans = useAllStorables<PlanActionStorable>(planActionStore);
  // const [editing, setEditing] = useState<boolean>(false);
  plans.sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <nav className="flex flex-row">
      {plans.map(plan => (
        <PlanNavChip
          epciId={epciId}
          planUid={plan.uid}
          planNom={plan.nom}
          active={plan.uid === planUid}
          key={plan.uid}
        />
      ))}
    </nav>
  );
}
