import { PlanNode } from '@tet/domain/plans';

export type AxeNode = {
  axe: Pick<PlanNode, 'id' | 'nom'>;
  depth: number;
  enfants: AxeNode[];
};
