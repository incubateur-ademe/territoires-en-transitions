import {clientScoresReadEndpoint} from 'core-logic/api/endpoints/ClientScoresReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useQuery} from 'react-query';
import {ActionScore} from 'types/ClientScore';
import {Referentiel} from 'types/litterals';
import {referentielId} from 'utils/actions';
import {useScoreListener} from './useScoreListener';

export type ReferentielsActionScores = {eci: ActionScore[]; cae: ActionScore[]};
// Should observe "CollectiviteId" of collectiviteBloc and ActionStatutWriteEndpoint
// so that you start the connection on first status written

const fetchScoresForCollectiviteForReferentiel = async (
  collectiviteId: number,
  referentiel: Referentiel
): Promise<ActionScore[]> => {
  const clientScores = await clientScoresReadEndpoint.getBy({
    collectiviteId,
    referentiel,
  });
  return clientScores[0] ? clientScores[0].scores : [];
};

const fetchScoresForCollectivite = async (
  collectiviteId: number
): Promise<ReferentielsActionScores> => {
  const eciScores = await fetchScoresForCollectiviteForReferentiel(
    collectiviteId,
    'eci'
  );
  const caeScores = await fetchScoresForCollectiviteForReferentiel(
    collectiviteId,
    'cae'
  );
  return {eci: eciScores, cae: caeScores};
};

export const useScores = (): ReferentielsActionScores => {
  const collectiviteId = useCollectiviteId();

  // écoute les changements
  const score = useScoreListener();
  score?.subscribe(collectiviteId);

  // charge les données du parcours
  const {data} = useQuery(['client_scores', collectiviteId], () => {
    if (collectiviteId) {
      return fetchScoresForCollectivite(collectiviteId);
    }
  });

  return data || {eci: [], cae: []};
};

export const useActionScore = (actionId: string): ActionScore | null => {
  const scores = useScores();
  const score = scores[referentielId(actionId)].find(
    score => score.action_id === actionId
  );
  return score ? {...score} : null;
};
