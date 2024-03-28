
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from '../database.types';
import { ActionImpactDetails } from './types';

export const actionDetailsSelect = "*, categoriesFNV:categorie_fnv(*), thematiques:thematique(*)";

export class ActionImpactAPI {
  protected supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async fetchActionImpactDetails(
    id: number,
  ): Promise<ActionImpactDetails | null> {
    const { data, error } = await this.supabase.from("action_impact")
      .select(actionDetailsSelect)
      .eq("id", id)
      .single<ActionImpactDetails>();
    if (error) throw error;
    return data;
  }
}
