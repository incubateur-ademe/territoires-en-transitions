import { extractUniqueAxes } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.rules';
import { PlanRecap } from '../notify-plan-imported/plan-recap';

/** Compte ce que la création du plan va produire, axes dédupliqués comme elle le fait. */
export const countPlanContent = (planInput: {
  actions: { axisPath?: string[] }[];
}): PlanRecap => {
  const axes = extractUniqueAxes(
    planInput.actions.flatMap((action) =>
      action.axisPath ? [action.axisPath] : []
    )
  );
  const axesCount = axes.filter((axe) => axe.depth === 1).length;
  return {
    axesCount,
    sousAxesCount: axes.length - axesCount,
    fichesCount: planInput.actions.length,
  };
};
