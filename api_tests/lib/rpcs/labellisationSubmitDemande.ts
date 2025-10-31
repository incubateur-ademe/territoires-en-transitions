import { supabase } from '../supabase.ts';
import { Database } from '../database.types.ts';

export async function labellisationSubmitDemande(
  collectivite_id: number,
  referentiel: Database['public']['Enums']['referentiel'],
  sujet: Database['labellisation']['Enums']['sujet_demande'],
  etoiles?: Database['labellisation']['Enums']['etoile']
): Promise<Database['labellisation']['Tables']['demande']['Row']> {
  const { error, data } = await supabase
    .rpc('labellisation_submit_demande', {
      collectivite_id,
      referentiel,
      sujet,
      etoiles,
    })
    .single();
  if (!data || error) {
    console.log(error);
    throw `La RPC 'labellisation_submit_demande' devrait renvoyer une demande d'audit.`;
  }

  return data;
}
