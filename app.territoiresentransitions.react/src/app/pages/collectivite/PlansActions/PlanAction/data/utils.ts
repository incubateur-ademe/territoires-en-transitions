import {FlatAxe, PlanNode} from './types';
import {TProfondeurAxe} from './types';

/**
 * Fonction récursive qui trouve un axe dans un plan et le retourne.
 * @param plan plan action complet
 * @param axe axe à récupérer
 * @return axe as PlanAction | null
 */
export const getAxeInPlan = (
  plan: PlanNode,
  axeId: number
): PlanNode | null => {
  if (plan.id === axeId) {
    return plan;
  }
  if (plan.children && plan.children.length > 0) {
    for (let i = 0; i < plan.children.length; i++) {
      if (plan.children[i] && plan.children[i].id === axeId) {
        return plan.children[i];
      } else if (plan.children[i].children) {
        const resultat = getAxeInPlan(plan.children[i], axeId);
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
 * @return plan d'action complet sans l'axe as PlanAction | undefined
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
 * Convertit une liste d'axes ordonnancés en une liste de plans.
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

/**
 * Fonction recursive qui supprime une fiche d'un axe et l'ajoute dans l'axe de réception.
 * @param axe axe racine qui contient les l'ancien et le nouvel axe pour la fiche
 * @param fiche_id id de la fiche à bouger
 * @param old_axe_id id de l'axe à où il faut supprimer la fiche
 * @param new_axe_id id de l'axe à où il faut ajouter la fiche
 * @return l'axe racine avec les fiche déplacée dans le bon axe
 */
export const ficheChangeAxeDansPlan = (
  axe: PlanNode,
  fiche_id: number,
  old_axe_id: number,
  new_axe_id: number
): PlanNode | undefined => {
  const tempAxe = deleteFicheFromAxe(axe, fiche_id, old_axe_id);
  const newAxe = tempAxe && addFicheToAxe(tempAxe, fiche_id, new_axe_id);
  return newAxe;
};

/** Permet de façon récursive de supprimer la fiche d'un axe */
const deleteFicheFromAxe = (
  axe: PlanNode,
  fiche_id: number,
  old_axe_id: number
) => {
  if (axe.id === old_axe_id) {
    return {...axe, fiches: axe.fiches.filter(f => f !== fiche_id)};
  }
  if (axe.children && axe.children.length > 0) {
    axe.children.forEach(enfant => {
      if (enfant.id === old_axe_id) {
        if (enfant.fiches && enfant.fiches.length > 0) {
          enfant.fiches = enfant.fiches.filter(fiche => fiche !== fiche_id);
        }
      } else {
        if (enfant.children && enfant.children.length > 0) {
          deleteFicheFromAxe(enfant, fiche_id, old_axe_id);
        }
      }
    });
  }
  return axe;
};

/** Permet de façon récursive d'ajouter la fiche à un axe */
const addFicheToAxe = (axe: PlanNode, fiche_id: number, new_axe_id: number) => {
  const newAxe = axe;
  if (axe.id === new_axe_id) {
    if (axe.fiches) {
      newAxe.fiches = [...axe.fiches, fiche_id];
    } else {
      newAxe.fiches = [fiche_id];
    }
  }
  if (axe.children && axe.children.length > 0) {
    for (let index = 0; index < axe.children.length; index++) {
      const element = axe.children[index];
      if (element.id !== new_axe_id) {
        if (element.children && element.children.length > 0) {
          addFicheToAxe(element, fiche_id, new_axe_id);
        }
      } else {
        if (element.fiches) {
          element.fiches = [...element.fiches, fiche_id];
        } else {
          element.fiches = [fiche_id];
        }
        axe.children[index] = element;
      }
    }
  }
  return newAxe;
};
