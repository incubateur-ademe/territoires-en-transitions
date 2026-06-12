import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { eq } from 'drizzle-orm';
import { databaseService } from './database.service';

export type PreuveFileInfo = {
  hash: string;
  bucketId: string;
  filename: string | null;
};

export async function getCollectivitePreuveFileInfo(
  collectiviteId: number
): Promise<PreuveFileInfo> {
  const rows = await databaseService.db
    .select({
      hash: bibliothequeFichierTable.hash,
      bucketId: collectiviteBucketTable.bucketId,
      filename: bibliothequeFichierTable.filename,
    })
    .from(bibliothequeFichierTable)
    .innerJoin(
      collectiviteBucketTable,
      eq(
        collectiviteBucketTable.collectiviteId,
        bibliothequeFichierTable.collectiviteId
      )
    )
    .where(eq(bibliothequeFichierTable.collectiviteId, collectiviteId))
    .limit(1);

  const file = rows[0];
  if (!file?.hash || !file.bucketId) {
    throw new Error(`No preuve file found for collectivite ${collectiviteId}`);
  }

  return {
    hash: file.hash,
    bucketId: file.bucketId,
    filename: file.filename,
  };
}
