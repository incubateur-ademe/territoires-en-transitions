import { ImportPlanHierarchy } from '@tet/backend/plans/plans/import-plan-aggregate/validators/import-plan-hierarchy.rules';
import { PlanRecap } from '../notify-plan-imported/plan-recap';

/** Compte ce que la création du plan va produire, axes dédupliqués comme elle le fait. */
export const countPlanContent = (planInput: {
  actions: { axisPath?: string[] }[];
}): PlanRecap => {
  const axes = ImportPlanHierarchy.extractAxes(
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
