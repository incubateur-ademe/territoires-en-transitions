import test, { BrowserContext } from '@playwright/test';
import { AppRouter } from '@tet/api';
import {
  addTestUser,
  addUserRoleSupport,
  deleteUserCollectiviteRole,
  setUserCollectiviteRole,
  TestUserArgs,
} from '@tet/backend/users/users/users.test-fixture';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole, Dcp } from '@tet/domain/users';
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

  /**
   * Force le calcul synchrone du snapshot courant d'un référentiel, pour
   * garantir que la page des scores aura ses données disponibles dès le
   * premier rendu (sinon le calcul lazy côté backend rend le test flaky).
   */
  async precomputeReferentielSnapshot(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<void> {
    await this.getTrpcClient().referentiels.snapshots.getCurrent.query({
      collectiviteId,
      referentielId,
    });
  }
}

/** Expose les méthodes permettant de créer des utilisateurs */
class UserFactory {
  constructor(private readonly context: BrowserContext) {}

  private usersFixtureCreated: Array<UserFixture> = [];

  // ajoute un utilisateur (par défaut avec le role "editeur" et les CGU validées)
  addUser = async (args?: TestUserArgs) => {
    const { user, cleanup } = await addTestUser(databaseService, {
      role: 'edition',
      ...(args || {}),
    });
    const userFixture = new UserFixture(this.context, user, cleanup);
    this.usersFixtureCreated.push(userFixture);
    return userFixture;
  };

  addUserRoleSupport = async ({
    userId,
    isSupport = true,
    isSuperAdminRoleEnabled = false,
  }: {
    userId: string;
    isSupport?: boolean;
    isSuperAdminRoleEnabled?: boolean;
  }) => {
    await addUserRoleSupport({
      databaseService,
      userId,
      isSupport,
      isSuperAdminRoleEnabled,
    });
  };

  setUserCollectiviteRole = async ({
    userId,
    collectiviteId,
    role,
  }: {
    userId: string;
    collectiviteId: number;
    role: CollectiviteRole;
  }) => {
    await setUserCollectiviteRole(databaseService, {
      userId,
      collectiviteId,
      role,
    });
  };

  deleteUserCollectiviteRole = async ({
    userId,
    collectiviteId,
  }: {
    userId: string;
    collectiviteId: number;
  }) => {
    await deleteUserCollectiviteRole(databaseService, {
      userId,
      collectiviteId,
    });
  };

  getUser = (userIndex = 0) => {
    if (userIndex < 0 || userIndex >= this.usersFixtureCreated.length) {
      throw new Error(`User index ${userIndex} out of bounds`);
    }
    return this.usersFixtureCreated[userIndex];
  };

  getUserById = (userId: string): UserFixture => {
    const user = this.usersFixtureCreated.find((u) => u.data.id === userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return user;
  };

  removeSome = async (userIds: string[]) => {
    const [usersToDelete, usersToKeep] = partition(
      this.usersFixtureCreated,
      (u) => userIds.includes(u.data.id)
    );
    if (!usersToDelete?.length) {
      return;
    }
    const results = await Promise.allSettled(
      usersToDelete.map((user) => user.cleanup())
    );
    const failures = results.flatMap((result, index) =>
      result.status === 'rejected'
        ? [{ user: usersToDelete[index], reason: result.reason }]
        : []
    );
    const failedUsers = failures.map((f) => f.user);
    this.usersFixtureCreated = [...usersToKeep, ...failedUsers];
    if (failures.length > 0) {
      for (const { user, reason } of failures) {
        console.error(
          `Échec du cleanup de l'utilisateur e2e ${user.data.id} (${user.data.email})`,
          reason
        );
      }
      throw new AggregateError(
        failures.map((f) => f.reason),
        `Cleanup partiel échoué pour ${failures.length} utilisateur(s) e2e`
      );
    }
  };

  removeAll = async () => {
    const users = this.usersFixtureCreated;
    const results = await Promise.allSettled(
      users.map((user) => user.cleanup())
    );
    const failures = results.flatMap((result, index) =>
      result.status === 'rejected'
        ? [{ user: users[index], reason: result.reason }]
        : []
    );
    this.usersFixtureCreated = failures.map((f) => f.user);
    if (failures.length > 0) {
      console.log(
        failures.map((f) => f.reason),
        `Cleanup échoué pour ${failures.length} utilisateur(s) e2e`
      );
    }
  };
}

export type Users = Omit<UserFactory, 'removeAll'>;

export const testWithUsers = test.extend<{
  users: Users;
}>({
  users: async ({ context }, use) => {
    const {
      addUser,
      addUserRoleSupport,
      removeSome,
      getUser,
      getUserById,
      removeAll,
      setUserCollectiviteRole,
      deleteUserCollectiviteRole,
    } = new UserFactory(context);
    await use({
      addUser,
      addUserRoleSupport,
      removeSome,
      getUser,
      getUserById,
      setUserCollectiviteRole,
      deleteUserCollectiviteRole,
    });
    await removeAll();
  },
});
