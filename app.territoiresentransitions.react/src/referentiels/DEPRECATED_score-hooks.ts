import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { clientScoresReadEndpoint } from '@/app/referentiels/DEPRECATED_ClientScoresReadEndpoint';
import { ActionScore } from '@/app/referentiels/DEPRECATED_scores.types';
import {
  getReferentielIdFromActionId,
  ReferentielId,
} from '@/domain/referentiels';
import { useQuery } from 'react-query';
import { useScoreListener } from './DEPRECATED_use-score-listener';

type ReferentielsActionScores = {
  eci: ActionScore[];
  cae: ActionScore[];
  te: ActionScore[];
  'te-test': ActionScore[];
};

export const getScoreQueryKey = (
  collectiviteId: number | null,
  referentiel: ReferentielId
) => ['client_scores', collectiviteId, referentiel];

const fetchScoresForCollectiviteAndReferentiel = async (
  collectiviteId: number,
  referentiel: Exclude<ReferentielId, 'te' | 'te-test'>
): Promise<ActionScore[]> => {
  const clientScores = await clientScoresReadEndpoint.getBy({
    collectiviteId,
    referentiel,
  });
  return clientScores[0] ? clientScores[0].scores : [];
};

// donne accès aux scores d'un référentiel
const useReferentielScores = (
  referentiel: Exclude<ReferentielId, 'te' | 'te-test'>,
  enabled: boolean
) => {
  const collectiviteId = useCollectiviteId();

  // écoute les changements
  useScoreListener()?.subscribe(collectiviteId);

  // charge les données
  return useQuery(
    getScoreQueryKey(collectiviteId, referentiel),
    () =>
      collectiviteId
        ? fetchScoresForCollectiviteAndReferentiel(collectiviteId, referentiel)
        : [],
    // on ne refetch pas trop systématiquement car il peut y avoir beaucoup
    // d'instances de ce hook et que l'update est fait lors de la réception des
    // notifications `client_scores_update`
    { refetchOnMount: false, enabled }
  );
};

// donne accès aux scores de chaque référentiel
export const useScores = ({
  enabled,
}: {
  enabled: boolean;
}): ReferentielsActionScores => {
  const { data: cae } = useReferentielScores('cae', enabled);
  const { data: eci } = useReferentielScores('eci', enabled);

  return { cae: cae || [], eci: eci || [], te: [], 'te-test': [] };
};

/**
 * @deprecated use `useScore()` instead
 */
export const useActionScore = (
  actionId: string,
  enabled: boolean
): ActionScore | null => {
  const scores = useScores({ enabled });
  const score = scores[getReferentielIdFromActionId(actionId)].find(
    (score) => score.action_id === actionId
  );
  return score ? { ...score } : null;
};
