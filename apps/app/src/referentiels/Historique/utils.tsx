import { makeMaCollectiviteUrl, makeReferentielActionUrl } from '@/app/app/paths';
import { HIGHLIGHTED_QUESTION_PARAM } from '@/app/collectivites/personnalisations/data/use-highlighted-question-id';
import { appLabels } from '@/app/labels/catalog';
import { ACTION_TYPE_LABELS } from '@/app/referentiels/actions/action-label.constants';
import { toPercentString } from '@/app/utils/to-percent-string';
import {
  ActionType,
  ActionTypeEnum,
  getReferentielIdFromActionId,
  HistoriqueActionPrecisionItem,
  HistoriqueActionStatutItem,
  isNewReferentiel,
} from '@tet/domain/referentiels';

/** Retourne le label avec première lettre en majuscule. */
const capitalize = (s: string): string =>
  s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/**
 * Décalage entre un type de nœud et le niveau `action` (mesure). La
 * sous-hiérarchie sous `action` est invariante entre référentiels :
 * action → sous-action → tâche → exemple.
 */
const LEVELS_BELOW_ACTION: Partial<Record<ActionType, number>> = {
  [ActionTypeEnum.SOUS_ACTION]: 1,
  [ActionTypeEnum.TACHE]: 2,
  [ActionTypeEnum.EXEMPLE]: 3,
};

/**
 * Lien vers la page "détail mesure" porteuse du nœud modifié.
 *
 * Cette vue ne sait afficher qu'une mesure (niveau `action`) : on remonte donc
 * l'`actionId` jusqu'à ce niveau via `actionType` (calculé côté backend à
 * partir de la hiérarchie du référentiel), puis on cible le nœud d'origine pour
 * déclencher le défilement. Les deux familles de vues n'ont pas le même
 * mécanisme de scroll : hash pour les anciens référentiels (CAE/ECI),
 * `?actionId=` pour le nouveau (TE).
 */
const makeMesurePageLink = ({
  actionId,
  actionType,
  collectiviteId,
}: {
  actionId: string;
  actionType: ActionType | null;
  collectiviteId: number;
}): string => {
  const referentielId = getReferentielIdFromActionId(actionId);
  const levelsToRollUp = actionType ? LEVELS_BELOW_ACTION[actionType] ?? 0 : 0;
  const segments = actionId.split('.');
  const mesureId = segments
    .slice(0, segments.length - levelsToRollUp)
    .join('.');

  const pathname = makeReferentielActionUrl({
    referentielId,
    collectiviteId,
    actionId: mesureId,
  });

  if (mesureId === actionId) {
    return pathname;
  }

  return isNewReferentiel(referentielId)
    ? `${pathname}?actionId=${actionId}`
    : `${pathname}#${actionId}`;
};

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
      ? makeMesurePageLink({ actionId, actionType, collectiviteId })
      : undefined;

  return { descriptions, pageLink };
};

/**
 * Lien vers une question de personnalisation dans la page "Personnalisation" :
 * filtre + ouvre sa thématique et la met en exergue via `q`
 * (lu par `useHighlightedQuestionId`).
 */
export const makePersonnalisationQuestionLink = ({
  collectiviteId,
  thematiqueId,
  questionId,
}: {
  collectiviteId: number;
  thematiqueId: string | null;
  questionId: string;
}): string =>
  makeMaCollectiviteUrl({
    collectiviteId,
    view: 'personnalisation',
    searchParams: {
      ...(thematiqueId ? { t: thematiqueId, ot: thematiqueId } : {}),
      [HIGHLIGHTED_QUESTION_PARAM]: questionId,
    },
  });

export const formatReponseValue = (value: unknown, type: string | null) => {
  if (value === null || value === undefined) {
    return <i>{appLabels.nonRenseigne}</i>;
  }

  if (type === 'binaire') {
    return value ? 'Oui' : 'Non';
  }

  if (type === 'proportion') {
    return toPercentString(value as number);
  }
  return value as string;
};
