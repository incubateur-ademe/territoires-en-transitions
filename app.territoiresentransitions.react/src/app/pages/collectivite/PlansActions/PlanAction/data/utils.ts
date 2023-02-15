import {TPlanActionAxeRow} from './types/alias';
import {TPlanAction} from './types/PlanAction';
import {TProfondeurAxe} from './types/profondeurPlan';

/**
 * Fonction récursive qui trouve un axe dans un plan et le retourne.
 * @param plan
 * @param axe
 * @return axe as TPlanAction | null
 */
export const getAxeinPlan = (
  plan: TPlanAction,
  axe: TPlanActionAxeRow
): TPlanAction | null => {
  if (plan.axe.id === axe.id) {
    return plan;
  }
  if (plan.enfants && plan.enfants.length > 0) {
    for (let i = 0; i < plan.enfants.length; i++) {
      if (plan.enfants[i].axe && plan.enfants[i].axe.id === axe.id) {
        return plan.enfants[i];
      } else if (plan.enfants[i].enfants) {
        const resultat = getAxeinPlan(plan.enfants[i], axe);
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
 * @param plan
 * @return boolean
 */
export const checkAxeHasFiche = (plan?: TPlanAction | null): boolean => {
  if (plan && plan.fiches && plan.fiches?.length > 0) {
    return true;
  }
  if (plan && plan.enfants && plan.enfants.length > 0) {
    for (let i = 0; i < plan.enfants.length; i++) {
      return checkAxeHasFiche(plan.enfants[i]);
    }
  }
  return false;
};

/**
 * Fonction recursive qui vérifie si un axe est présent dans un plan.
 * @param plan
 * @param axeId
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
