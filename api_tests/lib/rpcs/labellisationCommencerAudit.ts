import { supabase } from '../supabase.ts';
import { Database } from '../database.types.ts';

type Audit = Database['public']['Views']['audit']['Row'];
export async function labellisationCommencerAudit(
  audit_id: number
): Promise<Audit> {
  const { data, error } = await supabase
    .rpc('labellisation_commencer_audit', { audit_id })
    .single();
  if (!data) {
    console.error(error);
    throw `La RPC 'labellisation_commencer_audit' devrait renvoyer un audit.`;
  }

  return data;
}
