import { supabase } from '../supabase.ts';
import { Database } from '../database.types.ts';

export async function testSetCot(
  collectivite_id: number,
  actif: boolean
): Promise<Database['public']['Tables']['cot']['Row']> {
  const { data, error } = await supabase
    .rpc('test_set_cot', { collectivite_id, actif })
    .single();
  if (!data || error) {
    console.error(error);
    throw `La RPC 'test_set_cot' devrait renvoyer un COT.`;
  }

  return data;
}
