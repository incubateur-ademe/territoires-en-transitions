import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {FlatAxe, PlanAction, PlanNode} from './types';

function buildPlan(axes: FlatAxe[]): PlanNode {
  let plan = {...axes[0]!, children: []};
  let nodes = {} as {[key: number]: PlanNode};
  nodes[plan.id] = plan;

  if (axes.length > 1) {
    for (let i = 1; i < axes.length; i++) {
      let axe: PlanNode = {...axes[i], children: []};
      nodes[axe.id] = axe;
      nodes[axe.ancestors[axe.ancestors.length - 1]].children.push(axe);
    }
  }
  return plan;
}

export const usePlanAction = (plan_id: number) => {
  return useQuery(['plan_action', plan_id], async () => {
    const {data} = await supabaseClient.rpc('flat_axes', {plan_id});
    return buildPlan(data as unknown as FlatAxe[]) as unknown as PlanNode;
  });
};

export const usePlanActionExport = (plan_id: number) => {
  return useQuery(['plan_action_export', plan_id], async () => {
    const {data} = await supabaseClient.rpc('plan_action_export', {
      id: plan_id,
    });
    return data as unknown as PlanAction;
  });
};
