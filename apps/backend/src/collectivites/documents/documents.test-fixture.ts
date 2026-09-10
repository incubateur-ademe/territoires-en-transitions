/// <reference types="multer" />
import { INestApplication } from '@nestjs/common';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import {
  BibliothequeFichier,
  DocumentHash,
  toDocumentHash,
} from '@tet/domain/collectivites';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'path';
import { bibliothequeFichierTable } from './models/bibliotheque-fichier.table';
import { StoreDocumentService } from './store-document/store-document.service';

const PDF_SAMPLES_DIR = path.join(__dirname, './samples');
const DEFAULT_PDF_SAMPLE_FILE = 'document_test.pdf';
// un autre fichier pour les cas de tests où on a besoin de 2 fichiers/hash différents
export const OTHER_PDF_SAMPLE_FILE = 'document_test_2.pdf';
const TEST_DOCUMENT_SIZE_IN_BYTES = 1024;

export async function uploadCreateTestDocument({
  app,
  collectiviteId,
  fileName = 'test.pdf',
  sampleFileName = DEFAULT_PDF_SAMPLE_FILE,
  confidentiel = false,
}: {
  app: INestApplication;
  collectiviteId: number;
  fileName: string;
  sampleFileName?: string;
  confidentiel?: boolean;
}): Promise<BibliothequeFichier> {
  const buffer = fs.readFileSync(path.join(PDF_SAMPLES_DIR, sampleFileName));
  const uploadResult = await app.get(StoreDocumentService).uploadBuffer(
    collectiviteId,
    {
      buffer,
      originalname: fileName,
      mimetype: 'application/pdf',
    } as Express.Multer.File,
    confidentiel
  );
  if (!uploadResult.success) {
    throw new Error(
      `Cannot store test document ${fileName} for collectivite ${collectiviteId}: ${uploadResult.error}`
    );
  }
  return uploadResult.data;
}

export type TestDocument = typeof bibliothequeFichierTable.$inferSelect;

const buildRandomDocumentHash = (): DocumentHash =>
  toDocumentHash(createHash('sha256').update(randomUUID()).digest('hex'));

type SeedTestDocumentArgs = {
  databaseService: DatabaseServiceInterface;
  collectiviteId: number;
  filename: string;
  confidentiel?: boolean;
};

export async function seedTestDocument({
  hash = buildRandomDocumentHash(),
  ...args
}: SeedTestDocumentArgs & { hash?: DocumentHash }): Promise<TestDocument> {
  return insertTestDocument({ ...args, hash });
}

export async function seedTestDocumentWithLegacyUuidHash(
  args: SeedTestDocumentArgs
): Promise<TestDocument> {
  return insertTestDocument({ ...args, hash: randomUUID() });
}

async function insertTestDocument({
  databaseService,
  collectiviteId,
  filename,
  confidentiel = false,
  hash,
}: SeedTestDocumentArgs & { hash: string }): Promise<TestDocument> {
  const [bucket] = await databaseService.db
    .select({ bucketId: collectiviteBucketTable.bucketId })
    .from(collectiviteBucketTable)
    .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId))
    .limit(1);
  if (!bucket) {
    throw new Error(
      `Aucun bucket pour la collectivite ${collectiviteId}, impossible d'y deposer un document`
    );
  }

  const [document] = await databaseService.db
    .insert(bibliothequeFichierTable)
    .values({
      collectiviteId,
      hash,
      filename,
      confidentiel,
    })
    .returning();

  await databaseService.db.execute(
    sql`insert into storage.objects (bucket_id, name, metadata)
        values (${bucket.bucketId}, ${document.hash}, ${JSON.stringify({
      size: TEST_DOCUMENT_SIZE_IN_BYTES,
    })}::jsonb)`
  );

  return document;
}

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
