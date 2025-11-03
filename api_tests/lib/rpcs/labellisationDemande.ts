import { supabase } from '../supabase.ts';
import { Database } from '../database.types.ts';

export async function labellisationDemande(
  collectivite_id: number,
  referentiel: Database['public']['Enums']['referentiel']
): Promise<Database['labellisation']['Tables']['demande']['Row']> {
  const { data, error } = await supabase
    .rpc('labellisation_demande', { collectivite_id, referentiel })
    .single();
  if (!data || error) {
    console.error(error);
    throw `La RPC 'labellisation_demande' devrait renvoyer une demande d'audit.`;
  }

  return data;
}
