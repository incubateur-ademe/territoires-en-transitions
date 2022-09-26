import {Chip} from '@material-ui/core';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {usePlanActionList} from 'core-logic/hooks/plan_action';
import {makeCollectivitePlanActionUrl} from 'app/paths';

const PlanNavChip = (props: {
  collectiviteId: number;
  planUid: string;
  planNom: string;
  active: boolean;
}) => {
  return (
    <div className="mr-2">
      <Chip
        label={props.planNom}
        component="a"
        href={makeCollectivitePlanActionUrl({
          collectiviteId: props.collectiviteId,
          planActionUid: props.planUid,
        })}
        color={props.active ? 'primary' : 'default'}
        clickable
      />
    </div>
  );
};

export const PlanNav = (props: {planActionUid: string}) => {
  const collectiviteId = useCollectiviteId()!;
  const plans = usePlanActionList(collectiviteId);
  plans.sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <nav className="flex flex-row">
      {plans.map(plan => (
        <PlanNavChip
          collectiviteId={collectiviteId}
          planUid={plan.uid}
          planNom={plan.nom}
          active={plan.uid === props.planActionUid}
          key={plan.uid}
        />
      ))}
    </nav>
  );
};
