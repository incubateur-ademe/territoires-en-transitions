import { Views } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useQuery } from 'react-query';

type TFetchedData = {
  modified_by_id: Views<'historique_utilisateur'>['modified_by_id'];
  modified_by_nom: Views<'historique_utilisateur'>['modified_by_nom'];
}[];

export const fetchHistoriqueUtilisateur = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  // la requête
  let query = supabaseClient
    .from('historique_utilisateur')
    .select('modified_by_id, modified_by_nom')
    .eq('collectivite_id', collectivite_id);

  // attends les données
  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Les utilisateurs ayant effectués une action sur la collectivité
 */
export const useHistoriqueUtilisateurListe = (
  collectivite_id: number
): TFetchedData | undefined => {
  // charge les données
  const { data } = useQuery(['historique_utilisateur', collectivite_id], () =>
    fetchHistoriqueUtilisateur(collectivite_id)
  );

  return data;
};
