import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { TestUserArgs } from '@tet/backend/users/users/users.test-fixture';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { testWithUsers, Users } from 'tests/users/users.fixture';
import { databaseService } from '../shared/database.service';
import { DocumentsPom } from './documents/documents.pom';

type CollectiviteAndUserArgs = {
  collectiviteArgs?: Partial<Collectivite> & { isCOT?: boolean };
  userArgs?: Omit<TestUserArgs, 'collectiviteId'> &
    ({ autoLogin?: boolean } | undefined);
};

type CollectiviteCleanupFunc = (collectiviteId: number) => Promise<void>;

export class CollectiviteFixture {
  constructor(
    private readonly users: Users,
    public readonly data: Collectivite
  ) {}
  private usersCreated: Array<string> = [];

  // ajoute un utilisateur rattaché à la collectivité
  async addUser(userArgs: CollectiviteAndUserArgs['userArgs']) {
    const user = await this.users.addUser({
      ...(userArgs || {}),
      collectiviteId: this.data.id,
    });
    if (userArgs?.autoLogin) {
      await user.login();
    }
    this.usersCreated.push(user.data.id);
    return user;
  }

  getUserId = (userIndex = 0) => {
    if (userIndex < 0 || userIndex >= this.usersCreated.length) {
      throw new Error(`User index ${userIndex} out of bounds`);
    }
    return this.usersCreated[userIndex];
  };

  getUser = (userIndex = 0) => {
    const userId = this.getUserId(userIndex);
    return this.users.getUserById(userId);
  };

  setUserCollectiviteRole = async (role: CollectiviteRole, userIndex = 0) => {
    const userId = this.getUserId(userIndex);
    await this.users.setUserCollectiviteRole({
      userId,
      collectiviteId: this.data.id,
      role,
    });
  };

  deleteUserCollectiviteRole = async (userIndex = 0) => {
    const userId = this.getUserId(userIndex);
    await this.users.deleteUserCollectiviteRole({
      userId,
      collectiviteId: this.data.id,
    });
  };

  // supprime tous les utilisateurs
  async cleanupUsers() {
    return this.users.removeSome(this.usersCreated);
  }
}

class CollectiviteFactory {
  constructor(private readonly users: Users) {}

  // pour supprimer les collectivités créées
  private createdCollectivites: {
    collectivite: CollectiviteFixture;
    cleanup: () => Promise<void>;
  }[] = [];

  // pour supprimer les entités crées par les tests et liées à la collectivité (fiches, etc.)
  private cleanupFuncs: CollectiviteCleanupFunc[] = [];

  removeAll = async () => {
    return Promise.all(
      this.createdCollectivites.map(async ({ collectivite, cleanup }) => {
        // supprime les entités liées
        await Promise.all(
          this.cleanupFuncs.map((cleanupFunc) =>
            cleanupFunc(collectivite.data.id)
          )
        );

        // supprime les utilisateurs
        await collectivite.cleanupUsers();

        // supprime la collectivité
        await cleanup();
      })
    );
  };

  getCollectivite = (index = 0) => {
    if (index < 0 || index >= this.createdCollectivites.length) {
      throw new Error(`Collectivite index ${index} out of bounds`);
    }
    return this.createdCollectivites[index].collectivite;
  };

  // ajoute une collectivité
  addCollectivite = async (
    collectiviteArgs: CollectiviteAndUserArgs['collectiviteArgs']
  ) => {
    const { collectivite, cleanup } = await addTestCollectivite(
      databaseService,
      collectiviteArgs
    );
    const collectiviteFixture = new CollectiviteFixture(
      this.users,
      collectivite
    );
    this.createdCollectivites.push({
      collectivite: collectiviteFixture,
      cleanup,
    });
    return collectiviteFixture;
  };

  // ajoute une collectivité et un utilisateur
  addCollectiviteAndUser = async (args?: CollectiviteAndUserArgs) => {
    const collectivite = await this.addCollectivite(args?.collectiviteArgs);
    const user = await collectivite.addUser(args?.userArgs);
    return { collectivite, user };
  };

  registerCleanupFunc = (factory: FixtureFactory) => {
    console.log(`register cleanup function for ${factory.constructor.name}`);
    this.cleanupFuncs.push(factory.cleanupByCollectiviteId);
  };
}

export type Collectivites = Omit<CollectiviteFactory, 'removeAll'>;

export const testWithCollectivites = testWithUsers.extend<{
  collectivites: Collectivites;
  documentsPom: DocumentsPom;
}>({
  collectivites: async ({ users }, use) => {
    const {
      addCollectivite,
      addCollectiviteAndUser,
      registerCleanupFunc,
      getCollectivite,
      removeAll,
    } = new CollectiviteFactory(users);

    await use({
      addCollectivite,
      addCollectiviteAndUser,
      registerCleanupFunc,
      getCollectivite,
    });
    await removeAll();
  },
  documentsPom: async ({ page }, use) => {
    const documentsPom = new DocumentsPom(page);
    await use(documentsPom);
  },
});
