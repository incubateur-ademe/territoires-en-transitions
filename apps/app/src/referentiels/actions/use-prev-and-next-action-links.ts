import { makeReferentielActionUrl } from '@/app/app/paths';
import { useReferentielDownToAction } from '@/app/referentiels/referentiel-hooks';
import { useCollectiviteId } from '@tet/api/collectivites';
import { reduceActions } from '@tet/domain/referentiels';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { useReferentielId } from '../referentiel-context';
import { useReferentielTeEnabled } from '../use-referentiel-te-enabled';
import { useSnapshot } from '../use-snapshot';

/**
 * Génération des liens "Mesure précédente" et "Mesure suivante"
 * en ignorant les mesures désactivées par la personnalisation.
 */
export const usePrevAndNextActionLinks = (actionId: string) => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const searchParams = useSearchParams();

  const actions = useReferentielDownToAction(referentielId);

  // snapshot pour accéder aux flags de désactivation
  // TODO: a simplifier avec le endpoint de fred à venir
  const { data: snapshot } = useSnapshot({ actionId: referentielId });
  const referentielTeEnabled = useReferentielTeEnabled();

  // ensemble des actions désactivées
  const deactivatedActionIds = useMemo(() => {
    if (!snapshot?.scoresPayload.scores || !referentielTeEnabled) {
      return new Set<string>();
    }
    return reduceActions(
      [snapshot.scoresPayload.scores],
      new Set<string>(),
      (ids, node) => {
        if (node.score.desactive) ids.add(node.actionId);
        return ids;
      }
    );
  }, [snapshot, referentielTeEnabled]);

  // filtre les actions de type 'action', en excluant les désactivées
  // (sauf l'action courante pour que findIndex fonctionne)
  const filteredActions = actions.filter(
    (action) =>
      action.type === 'action' &&
      (action.id === actionId || !deactivatedActionIds.has(action.id))
  );

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
