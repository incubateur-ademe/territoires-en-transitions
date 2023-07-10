import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIndicateursParentsGroup} from '../../Indicateurs/useIndicateurDefinitions';
import {useIndicateursPersoDefinitions} from '../../Indicateurs/useIndicateursPersoDefinitions';

/**
 * Récupère les summary des indicateurs d'un groupe et d'une collectivité données
 */

const fetchIndicateurSummary = async (collectivite_id: number | null) => {
  const {error, data} = await supabaseClient
    .from('indicateur_summary')
    .select()
    .match({collectivite_id});

  if (error) throw new Error(error.message);

  return data;
};

/**
 * Récupère les summary des indicateurs d'un groupe et d'une collectivité données
 */

export const useIndicateurSummary = () => {
  const collectiviteId = useCollectiviteId();

  // Chargement des données
  const {data} = useQuery(['indicateur_summary', collectiviteId], () =>
    fetchIndicateurSummary(collectiviteId)
  );

  return data;
};

/**
 * Renvoie les compteurs pour tous les indicateurs
 */

export const useIndicateursCount = () => {
  const collectiviteId = useCollectiviteId();

  const caeIndicateurs = useIndicateursParentsGroup('cae');
  const eciIndicateurs = useIndicateursParentsGroup('eci');
  const crteIndicateurs = useIndicateursParentsGroup('crte');
  const persoIndicateurs = useIndicateursPersoDefinitions(collectiviteId!);

  const indicateursWithValue = useIndicateurSummary();
  let caeIndicateursWithValue = [];
  let eciIndicateursWithValue = [];
  let crteIndicateursWithValue = [];

  indicateursWithValue?.forEach(ind => {
    switch (ind.indicateur_group) {
      case 'cae':
        caeIndicateursWithValue.push(ind);
        break;
      case 'eci':
        eciIndicateursWithValue.push(ind);
        break;
      case 'crte':
        crteIndicateursWithValue.push(ind);
        break;
      default:
        break;
    }
  });

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
      total: persoIndicateurs?.length ?? 0,
    },
  };
};
