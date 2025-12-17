import {
  cleanupByCollectiviteId,
  createPersonneTag,
  PersonneTagAllowedInput,
} from '@tet/backend/collectivites/tags/personnes/personne-tag.fixture';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { testWithCollectivites } from '../collectivites.fixture';

class PersonneTagsFixture extends FixtureFactory {
  constructor() {
    super();
  }

  /**
   * Crée des tags personne
   */
  async createPersonneTag(tagData: PersonneTagAllowedInput) {
    const { data } = await createPersonneTag({
      database: databaseService,
      tagData,
    });
    return data;
  }

  /**
   * Supprime tous les tags d'une collectivité
   */
  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
    return cleanupByCollectiviteId(databaseService, collectiviteId);
  }
}

export const testWithPersonneTags = testWithCollectivites.extend<{
  personneTags: PersonneTagsFixture;
}>({
  personneTags: async ({ collectivites }, use) => {
    const tags = new PersonneTagsFixture();
    collectivites.registerCleanupFunc(tags);
    await use(tags);
  },
});
