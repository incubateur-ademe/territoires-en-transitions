import { addTestMobilisation } from '@tet/backend/collectivites/analysis/analysis.test-fixture';
import { LevierMobilisation } from '@tet/backend/collectivites/analysis/mobilisation.repository';
import { databaseService } from 'tests/shared/database.service';
import { testWithCollectivites } from '../collectivites.fixture';

class MobilisationsFactory {
  async add(input: {
    collectiviteId: number;
    leviers: LevierMobilisation[];
  }): Promise<void> {
    await addTestMobilisation(databaseService, input);
  }
}

export const testWithMobilisations = testWithCollectivites.extend<{
  mobilisations: MobilisationsFactory;
}>({
  mobilisations: async ({}, use) => {
    await use(new MobilisationsFactory());
  },
});
