import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {FicheResume} from '../PlansActions/FicheAction/data/types';

// charge les fiches actions liées à une action du référentiel
export const useFichesActionLiees = (actionId: string) => {
  const collectivite_id = useCollectiviteId();

  // charge les fiches action liées à une action
  const {data: fichesLiees, isLoading} = useQuery(
    ['fiche_action_liees', collectivite_id, actionId],
    () => (collectivite_id ? fetch(collectivite_id, actionId) : [])
  );

  // chargement encore en cours ou pas de données
  if (isLoading || !fichesLiees) {
    return {data: [], isLoading};
  }

  // renvoi les données
  return {
    isLoading: false,
    data: fichesLiees,
  };
};

// charge les fiches action liées à une action (et ses sous-actions)
const fetch = async (collectivite_id: number, action_id: string) => {
  const {data} = await supabaseClient
    .from('fiche_action_action')
    .select('fiche_resume(*)')
    .eq('fiche_resume.collectivite_id', collectivite_id)
    .like('action_id', `${action_id}%`);

  return (
    data
      // extrait les fiches
      ?.map(({fiche_resume}) => fiche_resume as FicheResume)
      // filtre les fiches non valides
      .filter(fiche => Boolean(fiche))
      // dédoublonne les fiches liées à plusieurs sous-actions de la même action
      ?.filter((fiche, i, a) => a.findIndex(v => v.id === fiche.id) === i)
  );
};
