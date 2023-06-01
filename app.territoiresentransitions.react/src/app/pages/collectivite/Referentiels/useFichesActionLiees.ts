import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useFicheResumeListe} from '../PlansActions/FicheAction/data/useFicheResumeListe';

// charge les fiches actions liées à une action du référentiel
export const useFichesActionLiees = (actionId: string) => {
  // charge et cache toutes les fiches résumées des plans
  const {data: fichesResumees, isLoading: isLoading1} = useFicheResumeListe();

  // charge les identifiants des fiches action liées à une action
  const {data: fichesLiees, isLoading: isLoading2} = useQuery(
    ['fiche_action_action', actionId],
    () => fetch(actionId)
  );

  // chargement encore en cours ou pas de données
  const isLoading = isLoading1 || isLoading2;
  if (isLoading || !fichesResumees || !fichesLiees) {
    return {data: [], isLoading};
  }

  // renvoi les résumés correspondants aux id
  return {
    isLoading: false,
    data: fichesResumees.filter(f => fichesLiees.includes(f.id!)),
  };
};

// charge les identifiants des fiches action liées à une action
const fetch = async (action_id: string) => {
  const {data} = await supabaseClient
    .from('fiche_action_action')
    .select('fiche_id')
    .match({action_id});

  return data?.map(({fiche_id}) => fiche_id);
};
