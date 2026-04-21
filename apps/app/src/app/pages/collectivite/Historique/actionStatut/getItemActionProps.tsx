import { makeReferentielTacheUrl } from '@/app/app/paths';
import { ACTION_TYPE_LABELS } from '@/app/referentiels/actions/action-label.constants';
import {
  ActionTypeEnum,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import {
  HistoriqueActionPrecisionItem,
  HistoriqueActionStatutItem,
} from '../types';

/** Retourne le label avec première lettre en majuscule. */
const capitalize = (s: string): string =>
  s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/**
 * Génère les propriétés communes aux modifications (statut, précision) sur les
 * actions du référentiel.
 *
 * Le label du second descripteur est piloté par `actionType` (calculé côté
 * backend via `getActionTypeFromActionId`). `ACTION_TYPE_LABELS` est la source
 * de vérité pour la traduction : sous-action → "Sous-mesure", tache → "Tâche",
 * etc. On retombe sur "Tâche"/"Mesure" quand `actionType` est indisponible.
 */
export const getItemActionProps = (
  item: HistoriqueActionStatutItem | HistoriqueActionPrecisionItem
) => {
  const {
    actionId,
    actionIdentifiant,
    actionNom,
    tacheIdentifiant,
    tacheNom,
    collectiviteId,
    actionType,
  } = item;

  const descriptions: { titre: string; description: string }[] = [];
  const isValidAction = actionIdentifiant && actionNom;
  if (isValidAction) {
    descriptions.push({
      titre: 'Mesure',
      description: `${actionIdentifiant} ${actionNom}`,
    });
  }
  if (tacheIdentifiant && tacheNom) {
    const titre =
      actionType && actionType !== ActionTypeEnum.ACTION
        ? capitalize(ACTION_TYPE_LABELS[actionType])
        : isValidAction
        ? 'Tâche'
        : 'Mesure';

    descriptions.push({
      titre,
      description: `${tacheIdentifiant} ${tacheNom}`,
    });
  }

  const pageLink =
    actionId && collectiviteId !== null
      ? makeReferentielTacheUrl({
          referentielId: getReferentielIdFromActionId(actionId),
          collectiviteId,
          actionId,
        })
      : undefined;

  return { descriptions, pageLink };
};
