import { PlanNode } from '@tet/domain/plans';
import { AxeNode } from '../../types';
import { childrenOfPlanNodes } from '../../utils';

export const toAxeNode = (node: PlanNode, allAxes: PlanNode[]): AxeNode => {
  const children = childrenOfPlanNodes(node, allAxes);

  return {
    axe: { id: node.id, nom: node.nom },
    depth: node.depth,
    enfants: children.map((child) => toAxeNode(child, allAxes)),
  };
};

export const toRootAxeNode = (axes: PlanNode[]): AxeNode | null => {
  const rootAxe = axes.find(({ parent }) => parent === null);
  return rootAxe ? toAxeNode(rootAxe, axes) : null;
};
