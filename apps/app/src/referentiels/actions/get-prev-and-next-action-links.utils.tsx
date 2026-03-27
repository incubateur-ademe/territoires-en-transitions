import { makeReferentielActionUrl } from '@/app/app/paths';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { ActionListItem } from './use-list-actions';

/**
 * Génération des liens "Mesure précédente" et "Mesure suivante"
 */
export const getPrevAndNextActionLinks = ({
  action,
  collectiviteId,
}: {
  action: Pick<ActionListItem, 'actionId' | 'previousId' | 'nextId'>;
  collectiviteId: number;
}) => {
  const { actionId, previousId: prevActionId, nextId: nextActionId } = action;

  const referentielId = getReferentielIdFromActionId(actionId);

  const prevActionLink = prevActionId
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: prevActionId,
      })
    : undefined;

  const nextActionLink = nextActionId
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: nextActionId,
      })
    : undefined;

  return {
    prevActionId,
    prevActionLink,
    nextActionId,
    nextActionLink,
  };
};
