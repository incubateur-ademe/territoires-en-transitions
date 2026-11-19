import { isNil } from 'es-toolkit';

type ActionPoints = {
  actionId: string;
  parentId: string | null;
  isTache: boolean;
  points?: number | null;
  pourcentage?: number | null;
};

/**
 * Vérifie que les points (ou pourcentages) des tâches d'une même sous-action
 * sont renseignés de façon homogène : soit aucune tâche n'en a (répartition
 * équitable), soit toutes en ont, sans mélange de points et de pourcentages.
 * Une tâche sans valeur au milieu de tâches valorisées compterait pour 0 point.
 *
 * La somme n'est pas vérifiée : elle peut légitimement différer des points de la
 * sous-action quand des tâches sont désactivables (ex. 3.4.6.3.a / 3.4.6.3.b).
 *
 * Renvoie la liste des erreurs détectées (vide si tout est cohérent).
 */
export function validateTachesPoints(actions: ActionPoints[]): string[] {
  const tachesByParentId = new Map<string, ActionPoints[]>();
  actions.forEach((action) => {
    if (action.isTache && action.parentId) {
      const taches = tachesByParentId.get(action.parentId) ?? [];
      taches.push(action);
      tachesByParentId.set(action.parentId, taches);
    }
  });

  const errors: string[] = [];
  tachesByParentId.forEach((taches, parentId) => {
    const withPoints = taches.filter((tache) => !isNil(tache.points));
    const withPourcentage = taches.filter((tache) => !isNil(tache.pourcentage));
    if (!withPoints.length && !withPourcentage.length) {
      return;
    }

    if (withPoints.length && withPourcentage.length) {
      errors.push(`Les tâches de ${parentId} mélangent points et pourcentages`);
      return;
    }

    const withValue = withPoints.length ? withPoints : withPourcentage;
    if (withValue.length !== taches.length) {
      const missing = taches
        .filter((tache) => !withValue.includes(tache))
        .map((tache) => tache.actionId);
      errors.push(
        `Les tâches de ${parentId} doivent toutes avoir des ${
          withPoints.length ? 'points' : 'pourcentages'
        } (manquant pour : ${missing.join(', ')})`
      );
    }
  });

  return errors;
}
