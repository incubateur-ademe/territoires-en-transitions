import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import {
  ActionTypeEnum,
  flatMapActionsEnfants,
  StatutAvancementEnum,
} from '@/domain/referentiels';

/**
 * Vérifie si une action est non renseigné ou contient des sous-actions ou taches non renseignées ou pas de sous actions ou taches
 */
export function hasNonInformedActionOrNonInformedChild(action: ActionDetailed): boolean {
  return flatMapActionsEnfants(action).some((act) => {
    const isSousAction = act.actionType === ActionTypeEnum.SOUS_ACTION;
    if (isSousAction === false) {
      return false;
    }
    const isConcerned = act.score.concerne === true;
    if (isConcerned === false) {
      return false;
    }
    const isNotRenseigne = act.score.renseigne === false || act.score.avancement === StatutAvancementEnum.NON_RENSEIGNE;
    if (isNotRenseigne === false) {
      return false;
    }


    const hasNoChildren = act.actionsEnfant.length === 0;
    const hasNonRenseigneChild = act.actionsEnfant.some(
      (a: ActionDetailed) => a.score.concerne === true && a.score.renseigne === false
    );
    return (hasNoChildren || hasNonRenseigneChild);
  });
}

/**
 * Vérifie si une sous action est détaillée ou si une de ses taches est détaillée
 */
export function hasDetailedSousActionOrInformedTache(action: ActionDetailed): boolean {
  return flatMapActionsEnfants(action).some((act) => {
    const isDetaille = act.score.avancement === StatutAvancementEnum.DETAILLE;
    const isSousAction = act.actionType === ActionTypeEnum.SOUS_ACTION;
    const isConcerned = act.score.concerne === true;
    const isNotRenseigne = act.score.renseigne === false;
    const hasRenseigneChild = act.actionsEnfant.some(
      (a: ActionDetailed) => a.score.concerne === true && a.score.renseigne === true
    );

    return isDetaille || (isSousAction && isConcerned && isNotRenseigne && hasRenseigneChild);
  });
}

/**
 * Filtre les axes, sous-axes et actions par statut
 * @param action L'action à tester
 * @param statuts Liste des statuts à filtrer
 * @returns true si l'action correspond aux filtres
 */
export function filterAxeOrSousAxeOrAction(
  action: ActionDetailed,
  statuts: string[]
): boolean {
  // Axe / Sous-axe / Action qui contient
  // une sous-action ou une tâche non concernée
  if (
    statuts.includes(StatutAvancementEnum.NON_CONCERNE) &&
    flatMapActionsEnfants(action).some((a) => a.score.concerne === false)
  ) {
    return true;
  }
  // Axe / Sous-axe / Action qui contient
  // une sous-action ou une tâche non renseignée
  // (si au moins une tâche d'une sous-action est non
  // renseignée, alors la sous-action est non renseignée)
  if (statuts.includes(StatutAvancementEnum.NON_RENSEIGNE)) {
    if (hasNonInformedActionOrNonInformedChild(action)) {
      return true;
    }
  }
  // Axe / Sous-axe / Action qui contient
  // une sous-action ou une tâche détaillée
  // (une sous-action peut être considérée détaillée si
  // elle est non renseignée mais avec au moins une tâche renseignée)
  if (statuts.includes(StatutAvancementEnum.DETAILLE)) {
    if (hasDetailedSousActionOrInformedTache(action)) {
      return true;
    }
  }
  // Axe / Sous-axe / Action qui contient une sous-action
  // ou une tâche de statut égal à un des filtres
  // (hors sous-actions / tâches non concernées non renseignées)
  if (
    flatMapActionsEnfants(action).some(
      (a) =>
        a.score.concerne === true &&
        a.score.renseigne === true &&
        a.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE &&
        statuts.includes(a.score.avancement ?? '')
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Filtre les sous-actions par statut
 * @param action La sous-action à tester
 * @param statuts Liste des statuts à filtrer
 * @returns true si la sous-action correspond aux filtres
 */
export function filterSousAction(
  action: ActionDetailed,
  statuts: string[]
): boolean {
  // Sous-action non concernée, ou contenant une tâche non concernée
  if (
    statuts.includes(StatutAvancementEnum.NON_CONCERNE) &&
    (action.score.concerne === false ||
      action.actionsEnfant.some((a) => a.score.concerne === false))
  ) {
    return true;
  }
  // Sous-action non renseignée, ou contenant une tâche non renseignée
  // (si au moins une tâche d'une sous-action est non
  // renseignée, alors la sous-action est non renseignée)
  if (statuts.includes(StatutAvancementEnum.NON_RENSEIGNE)) {
    if (hasNonInformedActionOrNonInformedChild(action)) {
      return true;
    }
  }
  // Sous action détaillée
  // - avec statut détaillé
  // - OU avec statut non renseigné, et des tâches renseignées
  // ou sous-action contenant une tâche au statut détaillé
  if (statuts.includes(StatutAvancementEnum.DETAILLE)) {
    const isDetaille = action.score.avancement === StatutAvancementEnum.DETAILLE;
    const hasDetailleChild = action.actionsEnfant.some(
      (a) => a.score.avancement === StatutAvancementEnum.DETAILLE
    );
    const isConcerned = action.score.concerne === true;
    const isNotRenseigne = action.score.renseigne === false;
    const hasRenseigneChild = action.actionsEnfant.some(
      (a) => a.score.concerne === true && a.score.renseigne === true
    );

    const isSousActionWithPartialTaches = isConcerned && isNotRenseigne && hasRenseigneChild;
    const isDetailedSousAction = isDetaille || hasDetailleChild || isSousActionWithPartialTaches;

    if (isDetailedSousAction) {
      return true;
    }
  }
  // Sous action dont le statut est égal à un des filtres
  // ou contenant une tâche de statut égal à un des filtres
  const isConcerned = action.score.concerne === true;
  const isRenseigne = action.score.renseigne === true;
  const hasValidAvancement = !!action.score.avancement;
  const isNotNonRenseigne = hasValidAvancement && action.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE;
  const hasAvancement = !!action.score.avancement;
  const avancementMatches = hasAvancement && statuts.includes(action.score.avancement ?? '');
  const hasMatchingChild = !hasAvancement && action.actionsEnfant.some((a) =>
    statuts.includes(a.score.avancement ?? '')
  );

  if (isConcerned && isRenseigne && isNotNonRenseigne && (avancementMatches || hasMatchingChild)) {
    return true;
  }
  return false;
}

/**
 * Filtre les tâches par statut
 * @param action La tâche à tester
 * @param statuts Liste des statuts à filtrer
 * @returns true si la tâche correspond aux filtres
 */
export function filterTache(
  action: ActionDetailed,
  statuts: string[]
): boolean {
  // Tâche non concernée
  if (
    statuts.includes(StatutAvancementEnum.NON_CONCERNE) &&
    action.score.concerne === false
  ) {
    return true;
  }
  // Tâche non renseignée
  if (
    statuts.includes(StatutAvancementEnum.NON_RENSEIGNE) &&
    action.score.concerne === true &&
    action.score.renseigne === false
  ) {
    return true;
  }
  // Tâche concernée, de statut égal à un des filtres
  if (
    statuts.includes(action.score.avancement ?? '') &&
    action.score.concerne === true &&
    action.score.renseigne === true
  ) {
    return true;
  }
  return false;
}

/**
 * Fonction de filtrage des actions par statut
 * @param action L'action à tester
 * @param statuts Liste des statuts à filtrer
 * @returns true si l'action correspond aux filtres
 */
export function actionMatchingFilter(
  action: ActionDetailed,
  statuts: string[]
): boolean {
  // Filtre tous les statuts
  if (statuts.includes('tous')) {
    return true;
  }

  switch (action.actionType) {
    case ActionTypeEnum.AXE:
    case ActionTypeEnum.SOUS_AXE:
    case ActionTypeEnum.ACTION: {
      return filterAxeOrSousAxeOrAction(action, statuts);
    }
    case ActionTypeEnum.SOUS_ACTION: {
      return filterSousAction(action, statuts);
    }
    case ActionTypeEnum.TACHE: {
      return filterTache(action, statuts);
    }
    default:
      return false;
  }
}
