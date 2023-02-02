import { supabase } from "../supabase.ts";
import { Database } from "../database.types.ts";

export async function testSetAuditeur(
  demande_id: number,
  user_id: string,
): Promise<Database["public"]["Tables"]["audit_auditeur"]["Row"]> {
  const { data } = await supabase.rpc(
    "test_set_auditeur",
    { demande_id, user_id },
  ).single();
  if (!data) {
    throw `La RPC 'test_set_auditeur' devrait renvoyer un audit-auditeur.`;
  }

  // @ts-ignore
  return data;
}
