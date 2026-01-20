import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { eq } from 'drizzle-orm';
import { bibliothequeFichierTable } from './models/bibliotheque-fichier.table';

export async function deleteAllDocuments({
  databaseService,
  collectiviteId,
}: {
  databaseService: DatabaseServiceInterface;
  collectiviteId: number;
}) {
  const existingDocuments = await databaseService.db
    .select()
    .from(bibliothequeFichierTable)
    .where(eq(bibliothequeFichierTable.collectiviteId, collectiviteId));
  console.log(`Deleting ${existingDocuments.length} documents`);

  // TODO: delete it from storage but not done for now

  await databaseService.db
    .delete(bibliothequeFichierTable)
    .where(eq(bibliothequeFichierTable.collectiviteId, collectiviteId));
}
