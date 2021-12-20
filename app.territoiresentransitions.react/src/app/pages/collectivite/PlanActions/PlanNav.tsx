import {Chip} from '@material-ui/core';
import {useParams} from 'react-router-dom';
import {useCollectiviteId} from 'core-logic/hooks';
import {usePlanActionList} from 'core-logic/hooks/plan_action';
import {makeCollectivitePlanActionPath} from 'app/paths';

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
        href={makeCollectivitePlanActionPath({
          collectiviteId: props.collectiviteId,
          planActionUid: props.planUid,
        })}
        color={props.active ? 'primary' : 'default'}
        clickable
      />
    </div>
  );
};

export const PlanNav = () => {
  const {planUid} = useParams<{planUid: string}>();
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
          active={plan.uid === planUid}
          key={plan.uid}
        />
      ))}
    </nav>
  );
};
