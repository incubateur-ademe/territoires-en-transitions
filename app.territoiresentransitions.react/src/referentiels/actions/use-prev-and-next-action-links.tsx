import { makeReferentielActionUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useReferentielDownToAction } from '@/app/referentiels/referentiel-hooks';
import { useReferentielId } from '../referentiel-context';

/**
 * Génération des liens "Action précédente" et "Action suivante"
 */
export const usePrevAndNextActionLinks = (actionId: string) => {
  // collectivité et référentiel courant
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  // tableau contenant uniquement les sous-axes et actions
  const actions = useReferentielDownToAction(referentielId);
  const filteredActions = actions.filter((action) => action.type === 'action');

  // index de l'action courante
  const currentActionIndex = filteredActions.findIndex(
    ({ id }) => id === actionId
  );

  // action précédente
  const prevAction =
    currentActionIndex > 0 && filteredActions[currentActionIndex - 1];
  const prevActionLink = prevAction
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: prevAction.id,
      })
    : undefined;

  // action suivante
  const nextAction =
    currentActionIndex < filteredActions.length - 1 &&
    filteredActions[currentActionIndex + 1];
  const nextActionLink = nextAction
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: nextAction.id,
      })
    : undefined;

  return { prevActionLink, nextActionLink };
};
