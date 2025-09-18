import { Database } from '@/api';
import { test } from '@playwright/test';
import { FuncArgs, SupabaseClient } from './supabase-client.utils';

type TestUser = {
  user_id: string,
  prenom: string,
  nom: string,
  email: string,
  password: string,
}

type TestCollectivite = Database['public']['Tables']['collectivite_test']['Row'];

class Users {
  private readonly supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = new SupabaseClient();
  }

  // génère l'email et le password d'un utilisateur prédéfini
  getTestUser (userName: string) {
    const letter = userName.slice(1, userName.indexOf('l'));
    const dd = `d${letter}d${letter}`;
    return {
      email: `${userName}@${dd}.com`,
      password: `${userName}${dd}`,
    };
  };

  // ajoute un utilisateur
  async addUser(
    args: FuncArgs<'test_add_random_user'> = {}
  ) {
    return this.supabaseClient.rpc<TestUser>('test_add_random_user', args);
  }

  // ajoute une collectivité
  async addCollectivite(
    nomCollectivite?: string
  ) {
    const nom = nomCollectivite || `Collectivité ${Math.random().toString().substring(2, 6)}`;
    return this.supabaseClient.rpc<TestCollectivite>('test_create_collectivite', {nom});
  }

  // ajoute une collectivité et un utilisateur rattaché à celle-ci
  async addCollectiviteAndUser(
    args: Omit<FuncArgs<'test_add_random_user'>, 'collectivite_id'> & {nomCollectivite?: string} = {}
  ) {
    const { nomCollectivite, ...userArgs} = args
    const collectivite = await this.addCollectivite(nomCollectivite);
    console.log(JSON.stringify({collectivite}))
    const user = await this.addUser({...userArgs, collectivite_id: collectivite.id});
    return {collectivite, user};
  }
}

export const testWithUsers = test.extend<{users: Users}>({
  users: async ({ page }, use) => {
    await use(new Users());
  }
});
