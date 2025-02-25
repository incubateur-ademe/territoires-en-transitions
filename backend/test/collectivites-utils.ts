import { getSupabaseClient } from './auth-utils';

export const getCollectiviteIdBySiren = async (
  siren: string
): Promise<number> => {
  const supabaseClient = getSupabaseClient();
  const epci = await supabaseClient
    .from('collectivite')
    .select('id')
    .eq('siren', siren)
    .single();
  if (!epci?.data) {
    throw new Error(`EPCI with siren ${siren} not found`);
  }
  return epci.data.id;
};
