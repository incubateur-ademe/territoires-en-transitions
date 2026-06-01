import { makeReferentielActionUrl } from '@/app/app/paths';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { ActionListItem } from './use-list-actions';

/**
 * Génération des liens "Mesure précédente" et "Mesure suivante"
 */
export const getPrevAndNextActionLinks = ({
  action,
  collectiviteId,
  searchParams,
  persistedParamKeys = ['panel'],
}: {
  action: Pick<ActionListItem, 'actionId' | 'previousId' | 'nextId'>;
  collectiviteId: number;
  searchParams: ReadonlyURLSearchParams;
  /** searchParams à conserver quand on passe d'une mesure à l'autre */
  persistedParamKeys?: string[];
}) => {
  const { actionId, previousId: prevActionId, nextId: nextActionId } = action;

  const referentielId = getReferentielIdFromActionId(actionId);

  const persistedParams = new URLSearchParams();
  for (const key of persistedParamKeys) {
    const value = searchParams.get(key);
    if (value !== null) persistedParams.set(key, value);
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
