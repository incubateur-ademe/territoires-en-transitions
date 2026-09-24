import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { StoredFile } from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { seedTestDocument, TestDocument } from './documents.test-fixture';
import {
  buildFichierSubquery,
  buildFileInfoSql,
  buildFilesizeSql,
} from './file-info.utils';
import { bibliothequeFichierTable } from './models/bibliotheque-fichier.table';
import { storageObjectTable } from './models/storage-object.table';

const INTEGER_CEILING_IN_BYTES = 2147483647;
const SIZE_ABOVE_INTEGER_CEILING = INTEGER_CEILING_IN_BYTES + 1;

describe('taille des fichiers stockés', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let document: TestDocument;
  let bucketId: string;
  let cleanupCollectivite: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);

    const { collectivite, cleanup } = await addTestCollectivite(
      databaseService
    );
    cleanupCollectivite = cleanup;

    document = await seedTestDocument({
      databaseService,
      collectiviteId: collectivite.id,
      filename: 'sauvegarde-video.mp4',
      sizeInBytes: SIZE_ABOVE_INTEGER_CEILING,
    });

    const [bucket] = await databaseService.db
      .select({ bucketId: collectiviteBucketTable.bucketId })
      .from(collectiviteBucketTable)
      .where(eq(collectiviteBucketTable.collectiviteId, collectivite.id));
    bucketId = bucket.bucketId;
  });

  afterAll(async () => {
    await cleanupCollectivite();
  });

  test('buildFilesizeSql rend 2 147 483 648 octets en nombre, au-delà du plafond integer de 2 147 483 647', async () => {
    const rows = await databaseService.db
      .select({ filesize: buildFilesizeSql() })
      .from(bibliothequeFichierTable)
      .innerJoin(
        storageObjectTable,
        eq(storageObjectTable.name, bibliothequeFichierTable.hash)
      )
      .where(eq(bibliothequeFichierTable.id, document.id));

    expect(rows).toEqual([{ filesize: SIZE_ABOVE_INTEGER_CEILING }]);
  });

  test('buildFileInfoSql rend un fichier de 2 147 483 648 octets, au-delà du plafond integer de 2 147 483 647', async () => {
    const fichier = buildFichierSubquery(databaseService.db);

    const rows = await databaseService.db
      .select({ fichier: buildFileInfoSql(fichier) })
      .from(fichier)
      .where(eq(fichier.id, document.id));

    const expected: StoredFile[] = [
      {
        id: document.id,
        collectiviteId: document.collectiviteId,
        hash: document.hash,
        filename: document.filename,
        confidentiel: document.confidentiel,
        bucketId,
        filesize: SIZE_ABOVE_INTEGER_CEILING,
      },
    ];
    expect(rows.map((row) => row.fichier)).toEqual(expected);
  });
});
