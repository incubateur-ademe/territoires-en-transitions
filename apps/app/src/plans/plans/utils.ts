import { naturalSort } from '@/app/utils/naturalSort';
import { PlanNode } from '@tet/domain/plans';
import { TProfondeurAxe } from './types';

/**
 * Fonction récursive qui vérifie si des fiches sont présentes dans un axe et ses sous-axes.
 * Dès que le script rencontre une fiche dans l'arbre, il retourne `true`.
 * @param plan plan ou axe sous forme de PlanAction
 * @return boolean
 */
export const checkAxeHasFiche = (axe: PlanNode, axes: PlanNode[]): boolean => {
  const children = childrenOfPlanNodes(axe, axes);
  if (axe.fiches && axe.fiches?.length > 0) {
    return true;
  }
  if (children) {
    for (let i = 0; i < children.length; i++) {
      if (checkAxeHasFiche(children[i], axes)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Fonction recursive qui vérifie si un axe est présent dans un plan.
 * @param plan plan action complet
 * @param axeId id de l'axe à vérifier
 * @return boolean
 */
export const checkAxeExistInPlanProfondeur = (
  plan: TProfondeurAxe,
  axeId: number
): boolean => {
  const getAllAxeIds = (plan: TProfondeurAxe): number[] => {
    let ids: number[] = [];
    ids.push(plan.axe.id);
    if (plan.enfants) {
      plan.enfants.forEach((enfant) => {
        ids = ids.concat(getAllAxeIds(enfant));
      });
    }
    return ids;
  };

  return getAllAxeIds(plan).includes(axeId);
};

export const sortPlanNodes = (axes: PlanNode[]): PlanNode[] => {
  return [...axes].sort((a: PlanNode, b: PlanNode) => {
    if (!a.nom) return -1;
    if (!b.nom) return 1;
    return naturalSort(a.nom, b.nom);
  });
};

export const childrenOfPlanNodes = (
  axe: PlanNode,
  axes: PlanNode[]
): PlanNode[] => {
  return sortPlanNodes(axes.filter((a) => a.parent === axe.id));
};

type PlanNodeFactory = {
  axes: PlanNode[];
  parentId?: number;
  parentDepth?: number;
  nom?: string | null;
};

export const planNodeFactory = ({
  axes,
  parentId,
  parentDepth,
  nom,
}: PlanNodeFactory): PlanNode => {
  const lowerId = axes?.reduce((a, b) => (a.id < b.id ? a : b), { id: 0 }).id;
  const tempId = Math.min(0, lowerId || 0) - 1;

  return {
    id: tempId,
    nom: nom ?? 'Axe sans titre',
    fiches: [],
    parent: parentId ?? null,
    depth: parentDepth ?? 0,
  };
};
