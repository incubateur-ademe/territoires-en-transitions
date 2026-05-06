import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { BibliothequeFichier } from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import TestAgent from 'supertest/lib/agent';
import { bibliothequeFichierTable } from './models/bibliotheque-fichier.table';

const PDF_SAMPLES_DIR = path.join(__dirname, './samples');
const DEFAULT_PDF_SAMPLE_FILE = 'document_test.pdf';
// un autre fichier pour les cas de tests où on a besoin de 2 fichiers/hash différents
export const OTHER_PDF_SAMPLE_FILE = 'document_test_2.pdf';

export async function uploadCreateTestDocument({
  collectiviteId,
  testAgent,
  token,
  fileName = 'test.pdf',
  sampleFileName = DEFAULT_PDF_SAMPLE_FILE,
  confidentiel = false,
}: {
  collectiviteId: number;
  testAgent: TestAgent;
  token: string;
  fileName: string;
  sampleFileName?: string;
  confidentiel?: boolean;
}): Promise<BibliothequeFichier> {
  const testPdfBuffer = fs.readFileSync(
    path.join(PDF_SAMPLES_DIR, sampleFileName)
  );
  const response = await testAgent
    .post(`/collectivites/${collectiviteId}/documents/upload`)
    .set('Authorization', `Bearer ${token}`)
    .attach('file', testPdfBuffer, fileName)
    .field('confidentiel', JSON.stringify(confidentiel))
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
