import { makeReferentielActionUrl } from '@/app/app/paths';
import { useReferentielDownToAction } from '@/app/referentiels/referentiel-hooks';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useSearchParams } from 'next/navigation';
import { useReferentielId } from '../referentiel-context';

/**
 * Génération des liens "Mesure précédente" et "Mesure suivante"
 */
export const usePrevAndNextActionLinks = (actionId: string) => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const searchParams = useSearchParams();

  const actions = useReferentielDownToAction(referentielId);
  const filteredActions = actions.filter((action) => action.type === 'action');

  const currentActionIndex = filteredActions.findIndex(
    ({ id }) => id === actionId
  );

  const persistedParams = new URLSearchParams();
  const panelParam = searchParams.get('panel');
  if (panelParam !== null) {
    persistedParams.set('panel', panelParam);
  }
  const panelIdParameter =
    persistedParams.size > 0 ? `?${persistedParams}` : '';

  const prevAction =
    currentActionIndex > 0
      ? filteredActions[currentActionIndex - 1]
      : undefined;
  const prevActionLink = prevAction
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: prevAction.id,
      }) + panelIdParameter
    : undefined;

  const nextAction =
    currentActionIndex < filteredActions.length - 1
      ? filteredActions[currentActionIndex + 1]
      : undefined;
  const nextActionLink = nextAction
    ? makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: nextAction.id,
      }) + panelIdParameter
    : undefined;

  return {
    prevActionId: prevAction?.id,
    prevActionLink,
    nextActionId: nextAction?.id,
    nextActionLink,
  };
};
