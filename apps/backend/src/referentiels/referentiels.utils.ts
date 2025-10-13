import { divisionOrZero } from '../utils/number.utils';
import { ScoreFinal } from './compute-score/score.dto';
import {
  StatutAvancement,
  StatutAvancementEnum,
} from './models/action-statut.table';
import { ActionTypeIncludingExemple } from './models/action-type.enum';
import {
  referentielIdEnumSchema,
  type ReferentielId,
} from './models/referentiel-id.enum';

export class ReferentielException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReferentielException';
  }
}

export function getReferentielIdFromActionId(actionId: string) {
  const unsafeReferentielId = actionId.split('_')[0];

  const parsing = referentielIdEnumSchema.safeParse(unsafeReferentielId);
  if (parsing.success) {
    return parsing.data;
  }

  throw new ReferentielException(
    `Invalid referentielId ${unsafeReferentielId} for actionId '${actionId}'`
  );
}

export function getAxeFromActionId(actionId: string): number {
  let identifiant = actionId;

  if (actionId.includes('_')) {
    identifiant = actionId.split('_')[1];
  }

  const identifiantParts = identifiant.split('.');
  const axe = parseInt(identifiantParts[0]);

  if (isNaN(axe)) {
    throw new ReferentielException(
      `Invalid actionId '${actionId}', axe not found`
    );
  }

  return axe;
}

export function getActionTypeFromActionId(
  actionId: string,
  orderedActionTypes: ActionTypeIncludingExemple[]
): ActionTypeIncludingExemple {
  const level = getLevelFromActionId(actionId);

  if (level >= orderedActionTypes.length) {
    throw new ReferentielException(
      `Action level ${level} non consistent with referentiel action types: ${orderedActionTypes.join(
        ','
      )}`
    );
  }

  return orderedActionTypes[level];
}

export function getIdentifiantFromActionId(actionId: string): string | null {
  const actionParts = actionId.split('_');

  if (actionParts.length !== 2) {
    return null;
  }

  return actionParts[1];
}

export function getLevelFromActionId(actionId: string) {
  const level = actionId.split('.').length;
  if (level === 1) {
    // If it contains an underscore, it's an Axe (level 1)
    if (actionId.includes('_')) {
      return 1;
    }
    // If it's just a number, it's also an Axe (level 1)
    if (!isNaN(parseInt(actionId))) {
      return 1;
    }
    // Otherwise it's a Referentiel (level 0)
    return 0;
  }

  return level;
}

export function getParentIdFromActionId(actionId: string): string | null {
  const actionIdParts = actionId.split('.');
  if (actionIdParts.length <= 1) {
    const firstPart = actionIdParts[0];
    const firstPartParts = firstPart.split('_');
    if (firstPartParts.length > 1) {
      return firstPartParts[0];
    } else {
      return null;
    }
  } else {
    return actionIdParts.slice(0, -1).join('.');
  }
}

/**
 * Détermine le statut d'avancement d'une action (inclus le "non concerné")
 * en fonction des autres propriétés provenant du score calculé de l'action.
 * C'est à dire après le calcul des points tenant compte de la personnalisation.
 */
export function getStatutAvancement({
  avancement,
  desactive,
  concerne,
}: {
  avancement?: StatutAvancement;
  desactive: boolean | undefined;
  concerne: boolean | undefined;
}) {
  // statut "non concerné" quand l'action est désactivée par la personnalisation
  // ou que l'option "non concerné" a été sélectionnée explicitement par l'utilisateur
  if (desactive || concerne === false) {
    return StatutAvancementEnum.NON_CONCERNE;
  }

  if (avancement === undefined) {
    return StatutAvancementEnum.NON_RENSEIGNE;
  }

  return avancement;
}

/**
 * Détermine le statut d'avancement d'une action en incluant le statut "non concerné"
 * et en fonction des avancements des actions enfants.
 */
export const getStatutAvancementBasedOnChildren = (
  action: {
    avancement?: StatutAvancement;
    desactive: boolean;
    concerne: boolean;
  },
  childrenStatuts: StatutAvancement[] | undefined
) => {
  const statutEtendu = getStatutAvancement(action);

  const hasAtLeastOneChildWithStatutRenseigne = childrenStatuts?.some(
    (statut) => statut && statut !== StatutAvancementEnum.NON_RENSEIGNE
  );

  const isStatutNonRenseigne =
    !statutEtendu || statutEtendu === StatutAvancementEnum.NON_RENSEIGNE;

  // Une sous-action "non renseigné" mais avec au moins une tâche renseignée a
  // le statut "détaillé"
  if (hasAtLeastOneChildWithStatutRenseigne && isStatutNonRenseigne) {
    return StatutAvancementEnum.DETAILLE;
  }

  return statutEtendu ?? StatutAvancementEnum.NON_RENSEIGNE;
};

export function getScoreRatios({
  pointFait,
  pointProgramme,
  pointPasFait,
  pointNonRenseigne,
  pointPotentiel,
  completedTachesCount,
  totalTachesCount,
  pasFaitTachesAvancement,
  faitTachesAvancement,
  programmeTachesAvancement,
}: ScoreFinal) {
  return {
    ratioFait:
      pointPotentiel === 0
        ? divisionOrZero(faitTachesAvancement, totalTachesCount)
        : divisionOrZero(pointFait, pointPotentiel),
    ratioProgramme:
      pointPotentiel === 0
        ? divisionOrZero(programmeTachesAvancement, totalTachesCount)
        : divisionOrZero(pointProgramme, pointPotentiel),
    ratioPasFait:
      pointPotentiel === 0
        ? divisionOrZero(pasFaitTachesAvancement, totalTachesCount)
        : divisionOrZero(pointPasFait, pointPotentiel),
    ratioNonRenseigne:
      pointPotentiel === 0
        ? divisionOrZero(
            totalTachesCount - completedTachesCount,
            totalTachesCount
          )
        : divisionOrZero(pointNonRenseigne, pointPotentiel),
    ratioTachesCount: divisionOrZero(completedTachesCount, totalTachesCount),
  };
}

/**
 * Equivalent to a `reduce` function but for a list of actions and their children.
 */
export function reduceActions<A extends { actionsEnfant?: A[] }, T>(
  actions: A[],
  initialValue: T,
  callbackfn: (previousValue: T, currentValue: A) => T
): T {
  return actions.reduce((previousValue, action) => {
    const newValue = callbackfn(previousValue, action);

    if (action.actionsEnfant && action.actionsEnfant.length > 0) {
      return reduceActions(action.actionsEnfant, newValue, callbackfn);
    }

    return newValue;
  }, initialValue);
}

export function flatMapActionsEnfants<A extends { actionsEnfant?: A[] }>(
  action: A
): A[] {
  return reduceActions([action], [] as A[], (allActionsEnfants, action) => [
    ...allActionsEnfants,
    action,
  ]);
}

export function findActionInTree<A extends { actionsEnfant?: A[] }>(
  actions: A[],
  predicate: (action: A) => boolean
): A | undefined {
  for (const action of actions) {
    if (predicate(action)) {
      return action;
    }

    if (action.actionsEnfant) {
      const foundAction = findActionInTree(action.actionsEnfant, predicate);
      if (foundAction) {
        return foundAction;
      }
    }
  }

  return undefined;
}

export function findActionById<
  A extends { actionId: string; actionsEnfant?: A[] }
>(actionTree: A, actionId: string): A {
  const action = findActionInTree(
    [actionTree],
    (action) => action.actionId === actionId
  );

  if (!action) {
    throw new ReferentielException(
      `Action with id ${actionId} not found in action tree`
    );
  }

  return action;
}

export function parseSnapshotName(snapshotName: string) {
  if (!snapshotName.length) return null;
  const [year, name] = snapshotName.split(' - ');
  return year && name ? { year, name } : null;
}

/**
 * Normalizes a search text to match referentiel identifier format
 * Supports cae, eci, crte prefixes
 * Examples:
 *   cae18 -> cae_18
 *   cae_18 -> cae_18
 *   cae18a -> cae_18.a
 *   cae_1.a -> cae_1.a
 *   cae 1 a -> cae_1.a
 *   cae49a-hab -> cae_49.a-hab
 *   eci2 -> eci_2
 *   crte1.1 -> crte_1.1
 * Returns null if the text doesn't look like a referentiel identifier
 */
export function normalizeIdentifiantReferentiel(text: string): string | null {
  const trimmedText = text.trim().toLowerCase();

  // Check if text matches referentiel identifier pattern
  // Allows letters, hyphens, and dots in the suffix part
  const match = trimmedText.match(
    /^(cae|eci|crte)[\s_]*(\d+(?:[\s._]+\d+)*)[\s._]*([a-z][a-z.-]*)?$/
  );

  if (!match) {
    return null;
  }

  const prefix = match[1];
  const numbersRaw = match[2];
  const suffix = match[3]; // e.g., "a", "ca", "a-hab"

  // Clean up numbers: remove spaces and underscores, keep only dots
  const numbers = numbersRaw.replace(/[\s_]/g, '');

  // Build normalized identifier: prefix_numbers or prefix_numbers.suffix
  let normalized = `${prefix}_${numbers}`;
  if (suffix) {
    normalized += `.${suffix}`;
  }

  return normalized;
}

/**
 * Business rule: Determines if an action is a "sous-mesure" (sub-measure) based on
 * the referentiel structure and the identifiant format.
 *
 * Rules:
 * - Referentiels with "sous-axe" in hierarchy (CAE, TE, TE-test): sous-mesure has 4 parts (e.g., "1.1.1.1")
 * - Referentiels without "sous-axe" (ECI): sous-mesure has 3 parts (e.g., "1.1.1")
 *
 *
 * @param actionId - The full action ID (e.g., "cae_1.1.1.1" or "eci_1.1.1")
 * @param referentielId - The referentiel identifier
 * @returns true if the action is a sous-mesure, false otherwise
 */
export function isSousMesure(
  actionId: string,
  referentielId: ReferentielId
): boolean {
  const identifiant = getIdentifiantFromActionId(actionId);
  if (!identifiant) {
    return false;
  }

  const identifiantParts = identifiant.split('.');
  const identifiantPartsCount = identifiantParts.length;
  if (referentielId === 'eci') {
    return identifiantPartsCount === 3;
  }
  return identifiantPartsCount === 4;
}
