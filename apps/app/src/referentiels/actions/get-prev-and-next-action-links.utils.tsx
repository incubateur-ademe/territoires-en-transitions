import { makeReferentielActionUrl } from '@/app/app/paths';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { ActionListItem } from './use-list-actions';
import { ReadonlyURLSearchParams } from 'next/navigation';

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
  searchParams: ReadonlyURLSearchParams;
}) => {
  const { actionId, previousId: prevActionId, nextId: nextActionId } = action;

  const referentielId = getReferentielIdFromActionId(actionId);

  const persistedParams = new URLSearchParams();
  const panelParam = searchParams.get('panel');
  if (panelParam !== null) {
    persistedParams.set('panel', panelParam);
  }
  const panelIdParameter =
    persistedParams.size > 0 ? `?${persistedParams}` : '';

  const prevActionLink = prevActionId
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: prevActionId,
      }) + panelIdParameter
    : undefined;

  const nextActionLink = nextActionId
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: nextActionId,
      }) + panelIdParameter
    : undefined;

  return {
    prevActionId,
    prevActionLink,
    nextActionId,
    nextActionLink,
  };
};
