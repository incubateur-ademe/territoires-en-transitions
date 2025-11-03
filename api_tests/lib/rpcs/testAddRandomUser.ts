import { supabase } from '../supabase.ts';
import { NiveauAcces } from '../types/niveauAcces.ts';
import { RandomUser } from '../types/randomUser.ts';

export async function testAddRandomUser(
  collectiviteId: number,
  niveau: NiveauAcces
): Promise<RandomUser> {
  const { data, error } = await supabase
    .rpc('test_add_random_user', {
      collectivite_id: collectiviteId,
      niveau: niveau,
      cgu_acceptees: true,
    })
    .single();
  if (!data || error) {
    throw `La RPC 'test_add_random_user' devrait renvoyer un utilisateur.`;
  }

  return data as RandomUser;
}
