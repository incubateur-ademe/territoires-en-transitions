import {
  addTestFicheAnalyses,
  addTestMobilisation,
} from '@tet/backend/collectivites/analysis/analysis.test-fixture';
import { LevierMobilisation } from '@tet/backend/collectivites/analysis/mobilisation.repository';
import { FicheAnalysis } from '@tet/backend/collectivites/analysis/models/fiche-analysis';
import { databaseService } from 'tests/shared/database.service';
import { testWithCollectivites } from '../collectivites.fixture';

const MOBILISATION_AVEC_FICHE: LevierMobilisation[] = [
  {
    levierId: 'velo_transport_commun',
    volets: [{ categorie: 'amenagement', note: 2, ficheIds: [1] }],
  },
];

export const addMobilisationAvecFiche = (
  collectiviteId: number
): Promise<void> =>
  addTestMobilisation(databaseService, {
    collectiviteId,
    leviers: MOBILISATION_AVEC_FICHE,
  });

class MobilisationsFactory {
  async add(input: {
    collectiviteId: number;
    leviers: LevierMobilisation[];
  }): Promise<void> {
    await addTestMobilisation(databaseService, input);
  }

  async addFicheAnalyses(input: {
    collectiviteId: number;
    analyses: { ficheId: number; status: FicheAnalysis['status'] }[];
  }): Promise<void> {
    await addTestFicheAnalyses(databaseService, input);
  }
}

export const testWithMobilisations = testWithCollectivites.extend<{
  mobilisations: MobilisationsFactory;
}>({
  mobilisations: async ({}, use) => {
    await use(new MobilisationsFactory());
  },
});
