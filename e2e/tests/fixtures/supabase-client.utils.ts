import { Database } from '@tet/api';
import { createClient } from '@supabase/supabase-js';

type FuncName = keyof Database['public']['Functions'];
type Functions<Name extends FuncName> = Database['public']['Functions'][Name];

export type FuncArgs<Name extends FuncName> =
  Database['public']['Functions'][Name]['Args'];

export class SupabaseClient {
  private readonly client;

  constructor() {
    const url = process.env.SUPABASE_API_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase credentials missing');
    }
    this.client = createClient<Database>(url, key);
  }

  // permet d'appeler les fonctions sql de test
  async rpc<Returns, Name extends FuncName = FuncName>(
    name: Name,
    args: Functions<Name>['Args']
  ) {
    const { data, error } = await this.client.rpc(name, args);
    if (error) {
      throw error;
    }
    return data as Returns;
  }
}
