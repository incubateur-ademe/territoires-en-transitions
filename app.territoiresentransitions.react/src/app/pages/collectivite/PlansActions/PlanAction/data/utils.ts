import {FlatAxe, PlanNode} from './types';
import {TProfondeurAxe} from './types';

/**
 * Fonction récursive qui trouve un axe dans un plan et le retourne.
 * @param plan plan action complet
 * @param axe axe à récupérer
 * @return axe as PlanAction | null
 */
export const getAxeinPlan = (plan: PlanNode, axe: FlatAxe): PlanNode | null => {
  if (plan.id === axe.id) {
    return plan;
  }
  if (plan.children && plan.children.length > 0) {
    for (let i = 0; i < plan.children.length; i++) {
      if (plan.children[i] && plan.children[i].id === axe.id) {
        return plan.children[i];
      } else if (plan.children[i].children) {
        const resultat = getAxeinPlan(plan.children[i], axe);
        if (resultat) {
          return resultat;
        }
      }
    }
  }
  return null;
};

/**
 * Fonction récursive qui vérifie si des fiches sont présentes dans un axe et ses sous-axes.
 * Dès que le script rencontre une fiche dans l'arbre, il retourne `true`.
 * @param plan plan ou axe sous forme de PlanAction
 * @return true si existe, sinon undefined
 */
export const checkAxeHasFiche = (
  plan?: PlanNode | null
): boolean | undefined => {
  if (plan && plan.fiches && plan.fiches?.length > 0) {
    return true;
  }
  if (plan && plan.children && plan.children.length > 0) {
    for (let i = 0; i < plan.children.length; i++) {
      if (checkAxeHasFiche(plan.children[i])) {
        return true;
      }
    }
  }
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
      plan.enfants.forEach(enfant => {
        ids = ids.concat(getAllAxeIds(enfant));
      });
    }
    return ids;
  };

  return getAllAxeIds(plan).includes(axeId);
};

/**
 * Fonction recursive qui supprime un axe et son arborescence d'un plan.
 * @param plan plan d'action complet
 * @param axe_id id de l'axe à supprimer
 * @return plan d'action complet dans l'axe as PlanAction | undefined
 */
export const removeAxeFromPlan = (
  plan: PlanNode,
  axe_id: number
): PlanNode | undefined => {
  if (plan.id === axe_id) {
    return undefined;
  }
  if (plan.children && plan.children.length > 0) {
    plan.children = plan.children.filter(enfant => {
      if (enfant.id !== axe_id) {
        if (enfant.children && enfant.children.length > 0) {
          removeAxeFromPlan(enfant, axe_id);
        }
        return enfant;
      }
      return false;
    });
  }
  return plan;
};

/**
 * Convertit une liste d'axes ordonnancée en une liste de plans.
 * @param axes
 * @returns
 */
export const buildPlans = (axes: FlatAxe[]): PlanNode[] => {
  let plans: PlanNode[] = [];
  let nodes = {} as {[key: number]: PlanNode};

  for (let i = 0; i < axes.length; i++) {
    let axe: PlanNode = {...axes[i], children: []};
    nodes[axe.id] = axe;
    if (axe.depth === 0) plans.push(axe);
    else nodes[axe.ancestors[axe.ancestors.length - 1]].children.push(axe);
  }

  return plans;
};
