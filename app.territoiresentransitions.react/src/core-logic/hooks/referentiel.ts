import {useEffect, useState} from 'react';
import {
  ActionDefinitionSummary,
  actionDownToTache,
  actionExemples,
  referentielDownToAction,
} from 'core-logic/api/procedures/referentielProcedures';
import {Referentiel} from 'types/litterals';
import {parentId} from 'utils/actions';

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
