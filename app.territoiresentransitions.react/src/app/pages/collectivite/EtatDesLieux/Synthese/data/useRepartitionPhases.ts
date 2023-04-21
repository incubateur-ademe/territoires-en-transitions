import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {phaseToLabel} from 'ui/referentiels/ActionPhaseBadge';
import {ActionReferentiel} from 'app/pages/collectivite/ReferentielTable/useReferentiel';
import {TActionStatutsRow} from 'types/alias';

export type PhasesRow = ActionReferentiel &
  Pick<TActionStatutsRow, 'points_realises' | 'phase'>;

/**
 * Récupère les points faits par phase pour un référentiel donné
 */

const fetchPhases = async (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  const {error, data} = await supabaseClient
    .from('action_statuts')
    .select('points_realises,phase')
    .not('phase', 'is', null)
    .match({collectivite_id, referentiel, concerne: true, desactive: false})
    .gt('depth', 0);

  if (error) throw new Error(error.message);

  return data as PhasesRow[];
};

/**
 * Renvoie le nombre de points faits par phase pour un référentiel donné
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
