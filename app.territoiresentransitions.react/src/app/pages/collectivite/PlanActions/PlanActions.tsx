import {useAllStorables, useStorable} from 'core-logic/hooks';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {planActionStore} from 'core-logic/api/hybridStores';
import {useParams} from 'react-router-dom';
import {Chip} from '@material-ui/core';

function PlanNavChip(props: {
  epciId: string;
  planId: string;
  planNom: string;
  active: boolean;
}) {
  return (
    <div className="mr-2">
      <Chip
        label={props.planNom}
        component="a"
        href={`/collectivite/${props.epciId}/referentiel/${props.planId}`}
        color={props.active ? 'primary' : 'default'}
        clickable
      />
    </div>
  );
}

function PlanNav() {
  const {epciId, planUid} = useParams<{epciId: string; planUid: string}>();
  const plans = useAllStorables<PlanActionStorable>(planActionStore);
  plans.sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <nav>
      {plans.map(plan => (
        <PlanNavChip
          epciId={epciId}
          planId={plan.id}
          planNom={plan.nom}
          active={plan.uid === planUid}
        />
      ))}
    </nav>
  );
}

function Plan(props: {plan: PlanActionStorable}) {
  return <div>dodo</div>;
}

const PlanActions = function () {
  const {epciId, planUid} = useParams<{epciId: string; planUid: string}>();
  const planId = PlanActionStorable.buildId(epciId, planUid);
  const current = useStorable<PlanActionStorable>(planId, planActionStore);

  return (
    <main className="fr-container mt-9 mb-16">
      <h1 className="fr-h1 mb-3">Plans d'action</h1>
      <PlanNav />
      {current && <Plan plan={current} />}
    </main>
  );
};

export default PlanActions;
