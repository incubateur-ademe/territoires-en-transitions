import { TAxeRow } from '@/app/types/alias';
import { PlanNode } from '@tet/domain/plans';
import { TProfondeurAxe } from '../../types';
import { childrenOfPlanNodes } from '../../utils';

/**
 * Convertit un PlanNode en TProfondeurAxe récursivement
 */
export const planNodeToProfondeurAxe = (
  node: PlanNode,
  allAxes: PlanNode[]
): TProfondeurAxe => {
  const children = childrenOfPlanNodes(node, allAxes);

  // crée un objet TAxeRow minimal avec seulement les propriétés nécessaires
  const axeRow: TAxeRow = {
    id: node.id,
    nom: node.nom,
  } as TAxeRow;

  return {
    axe: axeRow,
    profondeur: node.depth,
    enfants: children.map((child) => planNodeToProfondeurAxe(child, allAxes)),
  };
};
