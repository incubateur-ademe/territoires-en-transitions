import { supabase } from '../supabase.ts';
import { SaveReponseParams } from '../types/saveReponseParams.ts';

export async function saveReponse(params: SaveReponseParams): Promise<void> {
  const { status, error } = await supabase.rpc('save_reponse', params);
  if (error) {
    console.error(error);
    throw `La RPC 'save_reponse' devrait renvoyer un code 20x. (${status})`;
  }
}
