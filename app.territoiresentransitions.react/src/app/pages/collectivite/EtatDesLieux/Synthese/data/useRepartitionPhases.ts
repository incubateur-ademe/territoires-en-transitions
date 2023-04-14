import {useQuery} from 'react-query';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {fetchPhases} from './queries';
import {phaseToLabel} from 'ui/referentiels/ActionPhaseBadge';

/**
 * Renvoie le nombre de points faits par phase pour un référentiel donné
 *
 * @param referentiel (string)
 */

export const useRepartitionPhases = (referentiel: string) => {
  const collectiviteId = useCollectiviteId();

  // Chargement des données
  const {data} = useQuery(
    ['repartition_phase', collectiviteId, referentiel],
    () => fetchPhases(collectiviteId, referentiel)
  );

  // Formatage des données
  const phases = {bases: 0, 'mise en œuvre': 0, effets: 0};

  data?.forEach(action => {
    if (action.phase) phases[action.phase] += action.points_realises;
  });

  const repartitionPhases = [
    {id: phaseToLabel['bases'], value: phases['bases']},
    {id: phaseToLabel['mise en œuvre'], value: phases['mise en œuvre']},
    {id: phaseToLabel['effets'], value: phases['effets']},
  ];

  return repartitionPhases;
};
