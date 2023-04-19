import { supabase } from "../supabase.ts";
import { Database } from "../database.types.ts";

export async function testSetAuditeur(
  demande_id: number,
  user_id: string,
  audit_en_cours: boolean = false,
): Promise<Database["public"]["Tables"]["audit_auditeur"]["Row"]> {
  const { data, error } = await supabase
    .rpc("test_set_auditeur", { demande_id, user_id, audit_en_cours })
    .single();
  if (!data || error) {
    console.error(error);
    throw `La RPC 'test_set_auditeur' devrait renvoyer un audit-auditeur.`;
  }

  // @ts-ignore
  return data;
}
