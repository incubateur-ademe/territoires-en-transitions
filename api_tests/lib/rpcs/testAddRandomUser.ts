import { supabase } from "../supabase.ts";
import { RandomUser } from "../types/randomUser.ts";
import { NiveauAcces } from "../types/niveauAcces.ts";

export async function testAddRandomUser(
  collectiviteId: number,
  niveau: NiveauAcces,
): Promise<RandomUser> {
  const { data } = await supabase.rpc<RandomUser>(
    "test_add_random_user",
    { "collectivite_id": collectiviteId, "niveau": niveau },
  ).single();
  if (!data) {
    throw `La RPC 'test_add_random_user' devrait renvoyer un utilisateur.`;
  }
  return data;
}
