import { DBClient, Views } from '@/api';
import { useSupabase } from '@/api';
import { useQuery } from '@tanstack/react-query';

type TFetchedData = {
  modified_by_id: Views<'historique_utilisateur'>['modified_by_id'];
  modified_by_nom: Views<'historique_utilisateur'>['modified_by_nom'];
}[];

const fetchHistoriqueUtilisateur = async (
  supabase: DBClient,
  collectivite_id: number
): Promise<TFetchedData> => {
  // la requête
  const query = supabase
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
  const supabase = useSupabase();
  // charge les données
  const { data } = useQuery({
    queryKey: ['historique_utilisateur', collectivite_id],

    queryFn: () => fetchHistoriqueUtilisateur(supabase, collectivite_id),
  });

  return data;
};
