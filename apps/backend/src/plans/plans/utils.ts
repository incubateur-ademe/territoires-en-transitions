import { FlatAxe, PlanNode } from './plans.schema';

export const flatAxesToPlanNodes = (axes: FlatAxe[]): PlanNode[] => {
  return axes.map(({ ancestors, nom, ...a }) => {
    return {
      ...a,
      parent: ancestors?.length ? ancestors[ancestors.length - 1] : null,
      nom: nom ?? 'Sans titre',
    };
  });
};
