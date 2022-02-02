import {useEffect, useState} from 'react';
import {
  actionContexte,
  actionDownToTache,
  actionExemples,
  actionPreuve,
  actionRessources,
  referentielDownToAction,
} from 'core-logic/api/procedures/referentielProcedures';
import {Referentiel} from 'types/litterals';
import {parentId} from 'utils/actions';
import {
  ActionTitleRead,
  actionTitleReadEndpoint,
} from 'core-logic/api/endpoints/ActionTitleReadEndpoint';
import {
  ActionDefinitionSummary,
  actionDefinitionSummaryReadEndpoint,
} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';

/**
 * Returns a list of actions from the "action" level down to the "tache" level.
 */
export const useActionDownToTache = (
  referentiel: Referentiel,
  identifiant: string
): ActionDefinitionSummary[] => {
  const [summaries, setSummaries] = useState<ActionDefinitionSummary[]>([]);

  useEffect(() => {
    actionDownToTache(referentiel, identifiant).then(definitions =>
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
  referentiel: Referentiel
): ActionDefinitionSummary[] => {
  const [summaries, setSummaries] = useState<ActionDefinitionSummary[]>([]);

  useEffect(() => {
    referentielDownToAction(referentiel).then(definitions =>
      setSummaries(definitions)
    );
  }, [referentiel]);
  return summaries;
};

/**
 * Returns action exemples html contents
 */
export const useActionExemples = (actionId: string): string => {
  const [exemples, setExemples] = useState<string>('...');

  useEffect(() => {
    actionExemples(actionId).then(exemples => setExemples(exemples.exemples));
  }, [actionId]);

  return exemples;
};

/**
 * Returns action context html contents
 */
export const useActionContexte = (actionId: string): string => {
  const [contexte, setContexte] = useState<string>('...');

  useEffect(() => {
    actionContexte(actionId).then(contexte => setContexte(contexte.contexte));
  }, [actionId]);

  return contexte;
};

/**
 * Returns action ressources html contents
 */
export const useActionResources = (actionId: string): string => {
  const [ressources, setRessources] = useState<string>('...');

  useEffect(() => {
    actionRessources(actionId).then(ressources =>
      setRessources(ressources.ressources)
    );
  }, [actionId]);

  return ressources;
};

/**
 * Returns action ressources html contents
 */
export const useActionPreuve = (actionId: string) => {
  const [preuve, setPreuve] = useState<string>('...');

  useEffect(() => {
    actionPreuve(actionId).then(preuve => setPreuve(preuve.preuve));
  }, [actionId]);

  return preuve;
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

/**
 * Returns action titles relative to the scope
 */
export const useActionTitleList = (
  scope: 'all' | 'cae' | 'eci'
): ActionTitleRead[] => {
  const [actionTitles, setActionTitles] = useState<ActionTitleRead[]>([]);

  useEffect(() => {
    if (scope === 'all')
      actionTitleReadEndpoint.getBy({}).then(setActionTitles);
    else
      actionTitleReadEndpoint.getBy({referentiel: scope}).then(setActionTitles);
  }, [scope]);

  return actionTitles;
};

/**
 * Returns an action summary.
 */
export const useActionSummary = (
  referentiel: Referentiel,
  identifiant: string
): ActionDefinitionSummary | null => {
  const [actionSummary, setActionSummary] =
    useState<ActionDefinitionSummary | null>();

  useEffect(() => {
    actionDefinitionSummaryReadEndpoint
      .getBy({referentiel, identifiant})
      .then(list => setActionSummary(list.length === 0 ? null : list[0]));
  }, [referentiel, identifiant]);

  return actionSummary ?? null;
};
