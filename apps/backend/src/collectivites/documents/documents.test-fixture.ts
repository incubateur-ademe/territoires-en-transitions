import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { BibliothequeFichier } from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import TestAgent from 'supertest/lib/agent';
import { bibliothequeFichierTable } from './models/bibliotheque-fichier.table';

const TEST_PDF_PATH = path.join(__dirname, './samples/document_test.pdf');

export async function uploadCreateTestDocument({
  collectiviteId,
  testAgent,
  token,
  fileName = 'test.pdf',
}: {
  collectiviteId: number;
  testAgent: TestAgent;
  token: string;
  fileName: string;
}): Promise<BibliothequeFichier> {
  const testPdfBuffer = fs.readFileSync(TEST_PDF_PATH);
  const response = await testAgent
    .post(`/collectivites/${collectiviteId}/documents/upload`)
    .set('Authorization', `Bearer ${token}`)
    .attach('file', testPdfBuffer, fileName)
    .field('confidentiel', 'false')
    .expect(201);
  const createdDocument: BibliothequeFichier = response.body;
  return createdDocument;
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
