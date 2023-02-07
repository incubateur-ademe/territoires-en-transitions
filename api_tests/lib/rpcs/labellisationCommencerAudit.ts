import { supabase } from "../supabase.ts";
import { Database } from "../database.types.ts";

export async function labellisationCommencerAudit(
  audit_id: number,
): Promise<Database["public"]["Tables"]["audit"]["Row"]> {
  const { data } = await supabase.rpc(
    "labellisation_commencer_audit",
    { audit_id },
  ).single();
  if (!data) {
    throw `La RPC 'labellisation_commencer_audit' devrait renvoyer un audit.`;
  }

  // @ts-ignore
  return data;
}
