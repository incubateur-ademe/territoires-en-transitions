import {clientScoresReadEndpoint} from 'core-logic/api/endpoints/ClientScoresReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useQuery} from 'react-query';
import {ActionScore} from 'types/ClientScore';
import {Referentiel} from 'types/litterals';
import {referentielId} from 'utils/actions';
import {useScoreListener} from './useScoreListener';

export type ReferentielsActionScores = {eci: ActionScore[]; cae: ActionScore[]};

export const getScoreQueryKey = (
  collectiviteId: number | null,
  referentiel: Referentiel
) => ['client_scores', collectiviteId, referentiel];

const fetchScoresForCollectiviteAndReferentiel = async (
  collectiviteId: number,
  referentiel: Referentiel
): Promise<ActionScore[]> => {
  const clientScores = await clientScoresReadEndpoint.getBy({
    collectiviteId,
    referentiel,
  });
  return clientScores[0] ? clientScores[0].scores : [];
};

// donne accès aux scores d'un référentiel
const useReferentielScores = (referentiel: Referentiel) => {
  const collectiviteId = useCollectiviteId();

  // écoute les changements
  useScoreListener()?.subscribe(collectiviteId);

  // charge les données
  return useQuery(getScoreQueryKey(collectiviteId, referentiel), () =>
    collectiviteId
      ? fetchScoresForCollectiviteAndReferentiel(collectiviteId, referentiel)
      : []
  );
};

// donne accès aux scores de chaque référentiel
export const useScores = (): ReferentielsActionScores => {
  const {data: cae} = useReferentielScores('cae');
  const {data: eci} = useReferentielScores('eci');

  return {cae: cae || [], eci: eci || []} || {cae: [], eci: []};
};

export const useActionScore = (actionId: string): ActionScore | null => {
  const scores = useScores();
  const score = scores[referentielId(actionId)].find(
    score => score.action_id === actionId
  );
  return score ? {...score} : null;
};
