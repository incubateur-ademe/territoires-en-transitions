import { makeReferentielActionUrl } from '@/app/app/paths';
import { useReferentielDownToAction } from '@/app/referentiels/referentiel-hooks';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useReferentielId } from '../referentiel-context';

/**
 * Génération des liens "Mesure précédente" et "Mesure suivante"
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

  // mesure précédente
  const prevAction =
    currentActionIndex > 0
      ? filteredActions[currentActionIndex - 1]
      : undefined;
  const prevActionLink = prevAction
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: prevAction.id,
      })
    : undefined;

  // mesure suivante
  const nextAction =
    currentActionIndex < filteredActions.length - 1
      ? filteredActions[currentActionIndex + 1]
      : undefined;
  const nextActionLink = nextAction
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: nextAction.id,
      })
    : undefined;

  return {
    prevActionId: prevAction?.id,
    prevActionLink,
    nextActionId: nextAction?.id,
    nextActionLink,
  };
};
