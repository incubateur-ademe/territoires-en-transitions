import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { referentielId } from '@/app/referentiels/actions.utils';
import { clientScoresReadEndpoint } from '@/app/referentiels/DEPRECATED_ClientScoresReadEndpoint';
import { ActionScore } from '@/app/referentiels/DEPRECATED_scores.types';
import { Referentiel } from '@/app/referentiels/litterals';
import { useQuery } from 'react-query';
import { useScoreListener } from './DEPRECATED_use-score-listener';

type ReferentielsActionScores = {
  eci: ActionScore[];
  cae: ActionScore[];
};

export const getScoreQueryKey = (
  collectiviteId: number | null,
  referentiel: Referentiel
) => ['client_scores', collectiviteId, referentiel];

const fetchScoresForCollectiviteAndReferentiel = async (
  collectiviteId: number,
  referentiel: Exclude<Referentiel, 'te' | 'te-test'>
): Promise<ActionScore[]> => {
  const clientScores = await clientScoresReadEndpoint.getBy({
    collectiviteId,
    referentiel,
  });
  return clientScores[0] ? clientScores[0].scores : [];
};

// donne accès aux scores d'un référentiel
const useReferentielScores = (
  referentiel: Exclude<Referentiel, 'te' | 'te-test'>
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
    { refetchOnMount: false }
  );
};

// donne accès aux scores de chaque référentiel
export const useScores = (): ReferentielsActionScores => {
  const { data: cae } = useReferentielScores('cae');
  const { data: eci } = useReferentielScores('eci');

  return { cae: cae || [], eci: eci || [] };
};

export const useActionScore = (actionId: string): ActionScore | null => {
  const scores = useScores();
  const score = scores[referentielId(actionId)].find(
    (score) => score.action_id === actionId
  );
  return score ? { ...score } : null;
};
