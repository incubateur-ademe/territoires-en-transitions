import { discussionTable } from '@tet/backend/collectivites/discussions/infrastructure/discussion.table';

import { eq } from 'drizzle-orm';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { UserFixture } from 'tests/users/users.fixture';
import { testWithCollectivites } from '../collectivites.fixture';
import { DiscussionsPom } from './discussions.pom';
import { FilterDiscussionsPom } from './filter-discussions.pom';

export class DiscussionsFixture extends FixtureFactory {
  constructor() {
    super();
  }

  /**
   * Crée des discussions
   */
  async create(
    user: UserFixture,
    discussions: {
      collectiviteId: number;
      actionId: string;
      message: string;
    }[]
  ): Promise<number[]> {
    const trpcClient = user.getTrpcClient();
    const createdDiscussionsPromises = discussions.map((discussion) => {
      return trpcClient.collectivites.discussions.create.mutate(discussion);
    });
    const createdDiscussions = await Promise.all(createdDiscussionsPromises);
    return createdDiscussions.map((d) => d.id);
  }

  /**
   * Supprime toutes les discussions d'une collectivité
   */
  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
    const ret = await databaseService.db
      .delete(discussionTable)
      .where(eq(discussionTable.collectiviteId, collectiviteId))
      .returning();
    console.log(
      `${ret.length} discussions removed from collectivite ${collectiviteId}`
    );
  }
}

export const testWithDiscussions = testWithCollectivites.extend<{
  discussions: DiscussionsFixture;
  discussionsPom: DiscussionsPom;
  filterDiscussionsPom: FilterDiscussionsPom;
}>({
  discussions: async ({ collectivites }, use) => {
    const discussions = new DiscussionsFixture();
    collectivites.registerCleanupFunc(discussions);
    await use(discussions);
  },
  discussionsPom: async ({ page }, use) => {
    const discussionsPom = new DiscussionsPom(page);
    await use(discussionsPom);
  },
  filterDiscussionsPom: async ({ page }, use) => {
    const filterDiscussionsPom = new FilterDiscussionsPom(page);
    await use(filterDiscussionsPom);
  },
});
