import { Plan } from '@tet/domain/plans';

/** Les axes choisis et leurs sous-axes, à tous les niveaux */
export const withSousAxes = (
  plan: Pick<Plan, 'axes'>,
  axeIds: number[]
): number[] => {
  const sousAxeIds = plan.axes
    .filter((axe) => axe.parent !== null && axeIds.includes(axe.parent))
    .map((axe) => axe.id);
  const newIds = sousAxeIds.filter((id) => !axeIds.includes(id));
  return newIds.length ? withSousAxes(plan, [...axeIds, ...newIds]) : axeIds;
};
