import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useAllIndicateurDefinitionsForGroup} from '../../Indicateurs/useAllIndicateurDefinitions';
import {useIndicateurPersonnaliseDefinitionList} from 'core-logic/hooks/indicateur_personnalise_definition';

/**
 * Récupère les summary des indicateurs d'un groupe et d'une collectivité données
 */

const fetchIndicateurSummary = async (
  collectivite_id: number | null,
  indicateur_group: string | null
) => {
  const {error, data} = await supabaseClient
    .from('indicateur_summary')
    .select()
    .match({collectivite_id, indicateur_group});

  if (error) throw new Error(error.message);

  return data;
};

/**
 * Récupère les summary des indicateurs d'un groupe et d'une collectivité données
 */

export const useIndicateurSummary = (indicateur_group: string) => {
  const collectiviteId = useCollectiviteId();

  // Chargement des données
  const {data} = useQuery(
    ['indicateur_summary', collectiviteId, indicateur_group],
    () => fetchIndicateurSummary(collectiviteId, indicateur_group)
  );

  return data;
};

/**
 * Renvoie les compteurs pour tous les indicateurs
 */

export const useIndicateursCount = () => {
  const collectiviteId = useCollectiviteId();

  const caeIndicateurs = useAllIndicateurDefinitionsForGroup('cae');
  const eciIndicateurs = useAllIndicateurDefinitionsForGroup('eci');
  const crteIndicateurs = useAllIndicateurDefinitionsForGroup('crte');
  const persoIndicateurs = useIndicateurPersonnaliseDefinitionList(
    collectiviteId!
  );

  const caeIndicateursWithValue = useIndicateurSummary('cae');
  const eciIndicateursWithValue = useIndicateurSummary('eci');
  const crteIndicateursWithValue = useIndicateurSummary('crte');

  return {
    cae: {
      total: caeIndicateurs.length,
      withValue: caeIndicateursWithValue?.length ?? 0,
    },
    eci: {
      total: eciIndicateurs.length,
      withValue: eciIndicateursWithValue?.length ?? 0,
    },
    crte: {
      total: crteIndicateurs.length,
      withValue: crteIndicateursWithValue?.length ?? 0,
    },
    perso: {
      total: persoIndicateurs.length,
    },
  };
};
