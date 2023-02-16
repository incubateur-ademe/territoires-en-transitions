import {TPlanActionAxeRow} from './types/alias';
import {TPlanAction} from './types/PlanAction';
import {TProfondeurAxe} from './types/profondeurPlan';

/**
 * Fonction récursive qui trouve un axe dans un plan et le retourne.
 * @param plan plan action complet
 * @param axe axe à récupérer
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
 * @param plan plan ou axe sous forme de TPlanAction
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
 * @return plan as TPlanAction | undefined
 */
export const removeAxeFromPlan = (
  plan: TPlanAction,
  axe_id: number
): TPlanAction | undefined => {
  if (plan.axe.id === axe_id) {
    return undefined;
  }
  if (plan.enfants && plan.enfants.length > 0) {
    plan.enfants = plan.enfants.filter(enfant => {
      if (enfant.axe.id !== axe_id) {
        if (enfant.enfants && enfant.enfants.length > 0) {
          removeAxeFromPlan(enfant, axe_id);
        }
        return enfant;
      }
      return false;
    });
  }
  return plan;
};
