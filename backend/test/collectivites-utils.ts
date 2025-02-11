import { DatabaseService } from '@/backend/utils';
import { epciTable } from '@/domain/collectivites';
import { eq } from 'drizzle-orm';

export const getCollectiviteIdBySiren = async (
  databaseService: DatabaseService,
  siren: string
): Promise<number> => {
  const result = await databaseService.db
    .select({
      id: epciTable.collectiviteId,
    })
    .from(epciTable)
    .where(eq(epciTable.siren, siren));
  if (result.length === 0) {
    throw new Error(`Epci with siren ${siren} not found`);
  }
  return result[0].id;
};
