import { RouterInput, trpc } from '@/api/utils/trpc/client';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import {
  ActionType,
  ActionTypeEnum,
  ReferentielId,
} from '@/domain/referentiels';

const referentielStruct: ActionType[] = [
  ActionTypeEnum.REFERENTIEL,
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
  ActionTypeEnum.ACTION,
] as const;

const actionStruct: ActionType[] = [
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
] as const;

type ActionSummariesInput =
  RouterInput['referentiels']['actions']['listActionSummaries'];

/**
 * Returns a list of actions
 */
export const useActionsList = (
  input: ActionSummariesInput,
  options?: { enabled?: boolean }
): ActionDefinitionSummary[] => {
  const { data } = trpc.referentiels.actions.listActionSummaries.useQuery(
    input,
    options
  );
  return data || [];
};

/**
 * Returns a list of actions from the "action" level down to the "tache" level.
 */
export const useActionDownToTache = (
  referentielId: ReferentielId,
  identifiant: string,
  options?: { enabled?: boolean }
): ActionDefinitionSummary[] => {
  return useActionsList(
    { referentielId, identifiant, actionTypes: actionStruct },
    options
  );
};

/**
 * Returns a list of actions from the root "referentiel" down to the "action"
 * level.
 */
export const useReferentielDownToAction = (
  referentielId: ReferentielId,
  options?: { enabled?: boolean }
): ActionDefinitionSummary[] => {
  return useActionsList(
    { referentielId, actionTypes: referentielStruct },
    options
  );
};

/**
 * Returns the action summaries of the action children.
 *
 * This is how we recurse through the referentiel.
 */
const getChildren = (actions: ActionDefinitionSummary[], children: string[]) =>
  actions.filter((a: ActionDefinitionSummary) => children.includes(a.id));

export const useActionSummaryChildren = (
  action: ActionDefinitionSummary
): ActionDefinitionSummary[] => {
  const isStruct = referentielStruct.includes(action.type);
  const axes = useReferentielDownToAction(action.referentiel, {
    enabled: isStruct,
  });

  const isAction = actionStruct.includes(action.type);
  const actionDescendants = useActionDownToTache(
    action.referentiel,
    action.identifiant,
    { enabled: isAction }
  );

  if (isAction) {
    return getChildren(actionDescendants, action.children);
  }
  if (isStruct) {
    return getChildren(axes, action.children);
  }

  return [];
};

export const useSortedActionSummaryChildren = (
  action: ActionDefinitionSummary
): {
  sortedActions: {
    [id: string]: ActionDefinitionSummary[];
  };
  actions: ActionDefinitionSummary[];
  count: number;
} => {
  const actions = useActionSummaryChildren(action);

  let sortedActions: {
    [id: string]: ActionDefinitionSummary[];
  } = {};

  actions.forEach((act) => {
    if (act.phase) {
      if (sortedActions[act.phase]) {
        sortedActions[act.phase].push(act);
      } else {
        sortedActions = {
          ...sortedActions,
          [act.phase]: [act],
        };
      }
    }
  });

  return { sortedActions, actions, count: actions.length };
};
