import { PlanNode } from '@tet/domain/plans';
import { childrenOfPlanNodes } from '../../utils';

export const getChildrenAxeIds = (
  axe: PlanNode,
  axes: PlanNode[]
): number[] => {
  const children = childrenOfPlanNodes(axe, axes);
  const childrenIds = children.map((child: PlanNode) => child.id);

  const nestedChildrenIds = children.flatMap((child: PlanNode) =>
    getChildrenAxeIds(child, axes)
  );

  return [...childrenIds, ...nestedChildrenIds];
};
