import {useEffect, useState} from 'react';
import {
  actionContexte,
  actionDownToTache,
  actionExemples,
  actionRessources,
  referentielDownToAction,
} from 'core-logic/api/procedures/referentielProcedures';
import {Referentiel} from 'types/litterals';
import {parentId} from 'utils/actions';
import {PlanActionRead} from 'generated/dataLayer/plan_action_read';
import {planActionReadEndpoint} from 'core-logic/api/endpoints/PlanActionReadEndpoint';
import {planActionWriteEndpoint} from 'core-logic/api/endpoints/PlanActionWriteEndpoint';
import {
  ActionTitleRead,
  actionTitleReadEndpoint,
} from 'core-logic/api/endpoints/ActionTitleReadEndpoint';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';

export const useActionDownToTache = (
  referentiel: Referentiel,
  identifiant: string
) => {
  const [summaries, setSummaries] = useState<ActionDefinitionSummary[]>([]);

  useEffect(() => {
    actionDownToTache(referentiel, identifiant).then(definitions =>
      setSummaries(definitions)
    );
  }, [referentiel, identifiant]);

  return summaries;
};

export const useReferentielDownToAction = (referentiel: Referentiel) => {
  const [summaries, setSummaries] = useState<ActionDefinitionSummary[]>([]);

  useEffect(() => {
    referentielDownToAction(referentiel).then(definitions =>
      setSummaries(definitions)
    );
  }, [referentiel]);

  return summaries;
};

export const useActionExemples = (actionId: string) => {
  const [exemples, setExemples] = useState<string>('...');

  useEffect(() => {
    actionExemples(actionId).then(exemples => setExemples(exemples.exemples));
  }, [actionId]);

  return exemples;
};

export const useActionContexte = (actionId: string) => {
  const [contexte, setContexte] = useState<string>('...');

  useEffect(() => {
    actionContexte(actionId).then(contexte => setContexte(contexte.contexte));
  }, [actionId]);

  return contexte;
};

export const useActionResources = (actionId: string) => {
  const [ressources, setRessources] = useState<string>('...');

  useEffect(() => {
    actionRessources(actionId).then(ressources =>
      setRessources(ressources.ressources)
    );
  }, [actionId]);

  return ressources;
};

export const useActionSummaryChildren = (action: ActionDefinitionSummary) => {
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

export const useActionTitleList = (scope: 'all' | 'cae' | 'eci') => {
  const [actionTitles, setActionTitles] = useState<ActionTitleRead[]>([]);

  useEffect(() => {
    if (scope === 'all')
      actionTitleReadEndpoint.getBy({}).then(setActionTitles);
    else
      actionTitleReadEndpoint.getBy({referentiel: scope}).then(setActionTitles);
  }, [scope]);

  return actionTitles;
};
