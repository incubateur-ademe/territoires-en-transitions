import {
  ActionDefinitionSummary,
  actionDefinitionSummaryReadEndpoint,
} from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { parentId } from '@/app/referentiels/actions.utils';
import {
  ActionTitleRead,
  actionTitleReadEndpoint,
} from '@/app/referentiels/ActionTitleReadEndpoint';
import {
  actionDownToTache,
  referentielDownToAction,
} from '@/app/referentiels/data';
import { ReferentielId } from '@/domain/referentiels';
import { useEffect, useState } from 'react';

/**
 * Returns a list of actions from the "action" level down to the "tache" level.
 */
export const useActionDownToTache = (
  referentiel: ReferentielId,
  identifiant: string
): ActionDefinitionSummary[] => {
  const [summaries, setSummaries] = useState<ActionDefinitionSummary[]>([]);

  useEffect(() => {
    actionDownToTache(referentiel, identifiant).then((definitions) =>
      setSummaries(definitions)
    );
  }, [referentiel, identifiant]);

  return summaries;
};

/**
 * Returns a list of actions from the root "referentiel" down to the "action"
 * level.
 */
export const useReferentielDownToAction = (
  referentiel: ReferentielId
): ActionDefinitionSummary[] => {
  const [summaries, setSummaries] = useState<ActionDefinitionSummary[]>([]);

  useEffect(() => {
    referentielDownToAction(referentiel).then((definitions) =>
      setSummaries(definitions)
    );
  }, [referentiel]);
  return summaries;
};

/**
 * Returns the action summaries of the action children.
 *
 * This is how we recurse through the referentiel.
 */
export const useActionSummaryChildren = (
  action: ActionDefinitionSummary
): ActionDefinitionSummary[] => {
  const [children, setChildren] = useState<ActionDefinitionSummary[]>([]);

  const isChild = (a: ActionDefinitionSummary) =>
    action.children.includes(a.id);

  const handleResults = (actions: ActionDefinitionSummary[]) =>
    setChildren(actions.filter(isChild));

  useEffect(() => {
    switch (action.type) {
      case 'referentiel':
      case 'axe':
      case 'sous-axe':
        referentielDownToAction(action.referentiel).then(handleResults);
        break;
      case 'action':
        actionDownToTache(action.referentiel, action.identifiant).then(
          handleResults
        );
        break;
      case 'sous-action':
        actionDownToTache(
          action.referentiel,
          parentId(action.identifiant)!
        ).then(handleResults);
        break;
      case 'tache':
        break;
    }
  }, [action.id]);

  return children;
};

export const useSortedActionSummaryChildren = (
  action: ActionDefinitionSummary
): {
  sortedActions: {
    [id: string]: ActionDefinitionSummary[];
  };
  count: number;
} => {
  const actions = useActionSummaryChildren(action);

  let sortedActions: {
    [id: string]: ActionDefinitionSummary[];
  } = {};

  actions.forEach((act) => {
    if (sortedActions[act.phase]) {
      sortedActions[act.phase].push(act);
    } else {
      sortedActions = {
        ...sortedActions,
        [act.phase]: [act],
      };
    }
  });

  return { sortedActions, count: actions.length };
};

/**
 * Returns action titles relative to the scope
 */
export const useActionTitleList = (
  scope: 'all' | 'cae' | 'eci' | 'te' | 'te-test'
): ActionTitleRead[] => {
  const [actionTitles, setActionTitles] = useState<ActionTitleRead[]>([]);

  useEffect(() => {
    if (scope === 'all')
      actionTitleReadEndpoint.getBy({}).then(setActionTitles);
    else
      actionTitleReadEndpoint
        .getBy({ referentiel: scope })
        .then(setActionTitles);
  }, [scope]);

  return actionTitles;
};

/**
 * Returns an action summary.
 */
export const useActionSummary = (
  referentiel: ReferentielId,
  identifiant: string
): ActionDefinitionSummary | null => {
  const [actionSummary, setActionSummary] =
    useState<ActionDefinitionSummary | null>();

  useEffect(() => {
    actionDefinitionSummaryReadEndpoint
      .getBy({ referentiel, identifiant })
      .then((list) => setActionSummary(list.length === 0 ? null : list[0]));
  }, [referentiel, identifiant]);

  return actionSummary ?? null;
};
