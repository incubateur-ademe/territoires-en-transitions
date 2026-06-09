import { divisionOrZero } from '../utils/number.utils';
import { ActionGenealogy } from './action-with-score.schema';
import { ActionId } from './actions/action-definition.schema';
import {
  StatutAvancement,
  StatutAvancementEnum,
} from './actions/action-statut-avancement.enum.schema';
import { ActionType, ActionTypeEnum } from './actions/action-type.enum';
import { ReferentielId, referentielIdEnumSchema } from './referentiel-id.enum';
import { ActionScoreFinal } from './scores/action-score.schema';

export class ReferentielException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReferentielException';
  }
}

export function getReferentielIdFromActionId(actionId: string): ReferentielId {
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
  orderedActionTypes: ActionType[]
): ActionType {
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

export function getParentId({
  actionId,
}: {
  actionId: ActionId;
}): ActionId | null {
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
 * Remonte un actionId jusqu'au nœud de type `action` lorsque le nœud courant
 * est plus profond dans `hierarchie` (ex. sous-action, tâche).
 */
export function rollUpActionIdToActionLevel(
  actionId: string,
  hierarchie: ActionType[]
): string {
  const actionLevelIndex = hierarchie.indexOf(ActionTypeEnum.ACTION);
  if (actionLevelIndex === -1) {
    return actionId;
  }

  let current = actionId;
  const initial = actionId;

  while (true) {
    const type = getActionTypeFromActionId(current, hierarchie);
    const typeIndex = hierarchie.indexOf(type);
    if (typeIndex === -1 || typeIndex <= actionLevelIndex) {
      return current;
    }
    const parent = getParentId({ actionId: current });
    if (parent === null) {
      return initial;
    }
    current = parent;
  }
}

export function isActionHidden(
  desactive: boolean | undefined,
  referentielTeEnabled: boolean
): boolean {
  return Boolean(desactive) && referentielTeEnabled;
}

export function isNewReferentiel(referentielId: string): boolean {
  return referentielId === 'te' || referentielId === 'te-test';
}

const resolveVisibleNavigationId = <
  A extends {
    nextId: ActionId | null;
    previousId: ActionId | null;
  }
>({
  startId,
  visibleIds,
  actions,
  direction,
}: {
  startId: ActionId | null;
  visibleIds: Set<ActionId>;
  actions: Record<ActionId, A>;
  direction: 'next' | 'previous';
}): ActionId | null => {
  if (startId === null || visibleIds.has(startId)) {
    return startId;
  }

  const visited = new Set<ActionId>();
  let current: ActionId | null = startId;

  while (current !== null && !visibleIds.has(current)) {
    if (visited.has(current)) {
      return null;
    }
    visited.add(current);

    const action: A | undefined = actions[current];
    if (action === undefined) {
      return null;
    }

    current = direction === 'next' ? action.nextId : action.previousId;
  }

  return current;
};

/**
 * Filtre les mesures désactivées par la personnalisation (référentiel TE)
 */
export function filterHiddenActionsFromGroupedById<
  A extends {
    actionId: ActionId;
    childrenIds: string[];
    nextId: ActionId | null;
    previousId: ActionId | null;
    score: { desactive?: boolean };
  }
>(actions: Record<ActionId, A>): Record<ActionId, A> {
  const visibleIds = new Set<ActionId>();

  for (const actionId in actions) {
    if (
      Object.prototype.hasOwnProperty.call(actions, actionId) &&
      !isActionHidden(actions[actionId].score.desactive, true)
    ) {
      visibleIds.add(actionId);
    }
  }
  const filtered = {} as Record<ActionId, A>;

  // met à jour `childrenIds`, `nextId` et `previousId` pour ignorer les mesures masquées
  for (const actionId of visibleIds) {
    const action = actions[actionId];
    filtered[actionId] = {
      ...action,
      childrenIds: action.childrenIds.filter((id) => visibleIds.has(id)),
      nextId: resolveVisibleNavigationId({
        startId: action.nextId,
        visibleIds,
        actions,
        direction: 'next',
      }),
      previousId: resolveVisibleNavigationId({
        startId: action.previousId,
        visibleIds,
        actions,
        direction: 'previous',
      }),
    };
  }

  return filtered;
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
}: ActionScoreFinal) {
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
 * Supports both regular properties and getters for actionsEnfant.
 */
export function reduceActions<
  A extends { actionsEnfant: A[] } | { get actionsEnfant(): A[] },
  T
>(
  actions: A[],
  initialValue: T,
  callbackfn: (previousValue: T, currentValue: A) => T
): T {
  return actions.reduce((previousValue, action) => {
    const newValue = callbackfn(previousValue, action);

    // Access actionsEnfant - works for both regular properties and getters
    const actionsEnfant = (action as { actionsEnfant?: A[] }).actionsEnfant;

    if (actionsEnfant && actionsEnfant.length > 0) {
      return reduceActions(actionsEnfant, newValue, callbackfn);
    }

    return newValue;
  }, initialValue);
}

/**
 * Equivalent to `reduceActions` but passes each action parent to callback.
 */
export function reduceActionsWithParent<A extends { actionsEnfant: A[] }, T>(
  actions: A[],
  initialValue: T,
  callbackfn: (previousValue: T, currentValue: A, parent?: A) => T,
  parent?: A
): T {
  return actions.reduce((previousValue, action) => {
    const newValue = callbackfn(previousValue, action, parent);

    // Access actionsEnfant - works for both regular properties and getters
    const actionsEnfant = (action as { actionsEnfant?: A[] }).actionsEnfant;

    if (actionsEnfant && actionsEnfant.length > 0) {
      return reduceActionsWithParent(
        actionsEnfant,
        newValue,
        callbackfn,
        action
      );
    }

    return newValue;
  }, initialValue);
}

export function flatMapActionsEnfants<
  A extends { actionsEnfant: A[] } | { get actionsEnfant(): A[] }
>(action: A): A[] {
  return reduceActions([action], [] as A[], (allActionsEnfants, action) => [
    ...allActionsEnfants,
    action,
  ]);
}

export function reduceActionsById<A extends { childrenIds: string[] }, T>(
  actionsById: Record<string, A>,
  action: A,
  initialValue: T,
  callbackfn: (previousValue: T, currentValue: A) => T
): T {
  return action.childrenIds.reduce((previousValue, actionId) => {
    const newValue = callbackfn(previousValue, actionsById[actionId]);

    if (actionsById[actionId]) {
      return reduceActionsById(
        actionsById,
        actionsById[actionId],
        newValue,
        callbackfn
      );
    }

    return newValue;
  }, initialValue);
}

export function flatMapChildren<A extends { childrenIds: string[] }>(
  actionsById: Record<string, A>,
  action: A
): A[] {
  return reduceActionsById(
    actionsById,
    action,
    [] as A[],
    (allChildren, action) => [...allChildren, action]
  );
}

export function filterActionsBy<Action>(
  actions: Record<ActionId, Action>,
  predicate: (action: Action) => boolean
): Record<ActionId, Action> {
  return Object.fromEntries(
    Object.entries(actions).filter(([_, action]) => predicate(action))
  );
}

/**
 * Construit, à partir d'une arborescence d'actions issue d'un snapshot, un
 * index `Record<ActionId, ...>` enrichi de leur généalogie :
 * - `parentId` / `childrenIds` : structure hiérarchique fidèle à l'arbre ;
 * - `nextId` / `previousId` : navigation linéaire entre actions de **même
 *   profondeur**, franchissant les frontières de parent.
 *
 * Exemples (niveau 2) :
 * - `eci_2.1` → next: `eci_2.2`, previous: `eci_1.3`
 * - `eci_2.5` (dernier) → next: `eci_3.1`, previous: `eci_2.4`
 *
 * `includeDesactive: false` (référentiels TE) : les actions désactivées sont
 * ignorées pour `nextId` / `previousId`. `includeDesactive: true` (anciens
 * référentiels) : la navigation suit l'ordre strict de l'arbre. `childrenIds`
 * reste fidèle à l'arbre dans les deux cas.
 */
export function scoreSnapshotTreeToActionsWithGenealogyGroupedById<
  ActionWithTree extends {
    actionId: ActionId;
    actionsEnfant: ActionWithTree[];
    score: { desactive: boolean | undefined };
  }
>(
  snapshotRootAction: ActionWithTree,
  options: { includeDesactive: boolean } = { includeDesactive: false }
): Record<ActionId, ActionGenealogy & Omit<ActionWithTree, 'actionsEnfant'>> {
  const { nextById, previousById } = buildSameLevelNavigationMaps(
    snapshotRootAction,
    options
  );

  const initialValue: Record<
    ActionId,
    ActionGenealogy & Omit<ActionWithTree, 'actionsEnfant'>
  > = {};

  return reduceActionsWithParent(
    [snapshotRootAction],
    initialValue,
    (acc, action, parent) => {
      const { actionsEnfant, ...actionWithoutTree } = action;
      const { actionId } = actionWithoutTree;

      acc[actionId] = {
        ...actionWithoutTree,
        parentId: parent ? parent.actionId : null,
        childrenIds: actionsEnfant.map((a) => a.actionId),
        nextId: nextById.get(actionId) ?? null,
        previousId: previousById.get(actionId) ?? null,
      };

      return acc;
    }
  );
}

/**
 * Pour chaque niveau (profondeur) de l'arbre, collecte les actions en ordre
 * de parcours (pré-ordre) puis associe à chaque action le `nextId` et le
 * `previousId` correspondant.
 */
function buildSameLevelNavigationMaps<
  A extends {
    actionId: ActionId;
    actionsEnfant: A[];
    score: { desactive: boolean | undefined };
  }
>(
  rootAction: A,
  { includeDesactive }: { includeDesactive: boolean }
): {
  nextById: Map<ActionId, ActionId | null>;
  previousById: Map<ActionId, ActionId | null>;
} {
  const actionsByLevel = new Map<number, A[]>();

  reduceActions([rootAction], null as null, (_, action) => {
    const level = getLevelFromActionId(action.actionId);
    const siblings = actionsByLevel.get(level) ?? [];
    siblings.push(action);
    actionsByLevel.set(level, siblings);
    return null;
  });

  const nextById = new Map<ActionId, ActionId | null>();
  const previousById = new Map<ActionId, ActionId | null>();

  const findSiblingId = ({
    siblings,
    index,
    step,
    includeDesactive,
  }: {
    siblings: A[];
    index: number;
    step: 1 | -1;
    includeDesactive: boolean;
  }): ActionId | null => {
    if (includeDesactive) {
      return siblings[index]?.actionId ?? null;
    }
    for (let i = index; i >= 0 && i < siblings.length; i += step) {
      if (!siblings[i].score.desactive) {
        return siblings[i].actionId;
      }
    }
    return null;
  };

  for (const siblings of actionsByLevel.values()) {
    for (let index = 0; index < siblings.length; index++) {
      const { actionId } = siblings[index];
      nextById.set(
        actionId,
        findSiblingId({ siblings, index: index + 1, step: 1, includeDesactive })
      );
      previousById.set(
        actionId,
        findSiblingId({
          siblings,
          index: index - 1,
          step: -1,
          includeDesactive,
        })
      );
    }
  }

  return { nextById, previousById };
}

export function findActionInTree<
  A extends { actionsEnfant: A[] } | { get actionsEnfant(): A[] }
>(actions: A[], predicate: (action: A) => boolean): A | undefined {
  for (const action of actions) {
    if (predicate(action)) {
      return action;
    }

    // Access actionsEnfant - works for both regular properties and getters
    const actionsEnfant = (action as { actionsEnfant?: A[] }).actionsEnfant;

    if (actionsEnfant) {
      const foundAction = findActionInTree(actionsEnfant, predicate);
      if (foundAction) {
        return foundAction;
      }
    }
  }

  return undefined;
}

export function findActionById<
  A extends
    | { actionId: string; actionsEnfant: A[] }
    | { actionId: string; get actionsEnfant(): A[] }
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
