import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { LevierMobilisation } from './mobilisation.repository';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';
import { ficheActionAnalysisTable } from './models/fiche-action-analysis.table';
import { FicheAnalysis } from './models/fiche-analysis';
import { toCollectiviteVoletGesRows } from './to-collectivite-volet-ges-rows';

const TEST_FICHE_FINGERPRINT = 'a'.repeat(64);

export const addTestMobilisation = async (
  databaseService: DatabaseServiceInterface,
  input: {
    collectiviteId: number;
    leviers: LevierMobilisation[];
  }
): Promise<void> => {
  const rows = toCollectiviteVoletGesRows(input);
  if (rows.length === 0) {
    return;
  }

  await databaseService.db.insert(collectiviteVoletGesTable).values(rows);
};

export const addTestFicheAnalyses = async (
  databaseService: DatabaseServiceInterface,
  input: {
    collectiviteId: number;
    analyses: { ficheId: number; status: FicheAnalysis['status'] }[];
  }
): Promise<void> => {
  if (input.analyses.length === 0) {
    return;
  }

  await databaseService.db.insert(ficheActionAnalysisTable).values(
    input.analyses.map(({ ficheId, status }) => ({
      ficheId,
      collectiviteId: input.collectiviteId,
      status,
      fingerprint: TEST_FICHE_FINGERPRINT,
      retryCount: status === 'failed' ? 1 : 0,
    }))
  );
};
