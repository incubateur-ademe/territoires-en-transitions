import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { LevierMobilisation } from './mobilisation.repository';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';
import { toCollectiviteVoletGesRows } from './to-collectivite-volet-ges-rows';

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
