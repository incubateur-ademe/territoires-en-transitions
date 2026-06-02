import { makeReferentielActionUrl } from '@/app/app/paths';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { ActionListItem } from './use-list-actions';

/**
 * Génération des liens "Mesure précédente" et "Mesure suivante"
 */
export const getPrevAndNextActionLinks = ({
  action,
  collectiviteId,
  searchParams,
}: {
  action: Pick<ActionListItem, 'actionId' | 'previousId' | 'nextId'>;
  collectiviteId: number;
  searchParams?: URLSearchParams;
}) => {
  const { actionId, previousId: prevActionId, nextId: nextActionId } = action;

  const referentielId = getReferentielIdFromActionId(actionId);

  const prevActionLink = prevActionId
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: prevActionId,
        searchParams,
      })
    : undefined;

  const nextActionLink = nextActionId
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: nextActionId,
        searchParams,
      })
    : undefined;

  return {
    prevActionId,
    prevActionLink,
    nextActionId,
    nextActionLink,
  };
};
