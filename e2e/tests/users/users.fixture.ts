import test, { BrowserContext } from '@playwright/test';
import { AppRouter } from '@tet/api';
import {
  addTestUser,
  TestUserArgs,
} from '@tet/backend/users/users/users.fixture';
import { Dcp } from '@tet/domain/users';
import { TRPCClient } from '@trpc/client';
import assert from 'assert';
import { partition } from 'es-toolkit';
import { setupTrpcClient } from 'tests/shared/trpc.utils';
import { databaseService } from '../shared/database.service';
import { SupabaseClient } from '../shared/supabase-client.utils';

export class UserFixture {
  readonly supabaseClient: SupabaseClient;
  trpcClient: TRPCClient<AppRouter> | null = null;

  constructor(
    public readonly context: BrowserContext,
    public readonly data: Dcp & { password: string },
    public readonly cleanup: () => Promise<void>
  ) {
    this.supabaseClient = new SupabaseClient();
  }

  /**
   * Authentifie l'utilisateur via Supabase et ajoute le cookie de session
   * @returns Les informations d'authentification (accessToken et cookie)
   */
  async login() {
    const { accessToken, cookie } = await this.supabaseClient.authenticateUser(
      this.data.email,
      this.data.password
    );

    await this.supabaseClient.addAuthCookie(this.context, cookie);
    this.trpcClient = setupTrpcClient(accessToken);
  }

  /**
   * Déconnecte l'utilisateur en supprimant le cookie de session
   */
  async logout(): Promise<void> {
    await this.supabaseClient.removeAuthCookie(this.context);
    this.trpcClient = null;
  }

  getTrpcClient(): TRPCClient<AppRouter> {
    assert(this.trpcClient, 'User is not authenticated');
    return this.trpcClient;
  }
}

/** Expose les méthodes permettant de créer des utilisateurs */
class UserFactory {
  constructor(private readonly context: BrowserContext) {}

  private usersFixtureCreated: Array<UserFixture> = [];

  // ajoute un utilisateur (par défaut avec le role "editeur" et les CGU validées)
  addUser = async (args?: TestUserArgs) => {
    const { user, cleanup } = await addTestUser(databaseService, {
      accessLevel: 'edition',
      cguAcceptees: true,
      ...(args || {}),
    });
    const userFixture = new UserFixture(this.context, user, cleanup);
    this.usersFixtureCreated.push(userFixture);
    return userFixture;
  };

  removeSome = async (userIds: string[]) => {
    const [usersToDelete, usersToKeep] = partition(
      this.usersFixtureCreated,
      (u) => userIds.includes(u.data.userId)
    );
    if (usersToDelete?.length) {
      await Promise.all(usersToDelete?.map(async (user) => user.cleanup()));
      this.usersFixtureCreated = usersToKeep;
    }
  };

  removeAll = async () => {
    return Promise.all(this.usersFixtureCreated.map((user) => user.cleanup()));
  };
}

export type Users = Omit<UserFactory, 'removeAll'>;

export const testWithUsers = test.extend<{
  users: Users;
}>({
  users: async ({ context }, use) => {
    const { addUser, removeSome, removeAll } = new UserFactory(context);
    await use({ addUser, removeSome });
    await removeAll();
  },
});
