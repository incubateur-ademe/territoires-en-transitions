import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';

export const getCollectiviteIdBySiren = async (
  databaseService: DatabaseService,
  siren: string
): Promise<number> => {
  const result = await databaseService.db
    .select({
      id: collectiviteTable.id,
    })
    .from(collectiviteTable)
    .where(eq(collectiviteTable.siren, siren));
  if (result.length === 0) {
    throw new Error(`Epci with siren ${siren} not found`);
  }
  return result[0].id;
};
