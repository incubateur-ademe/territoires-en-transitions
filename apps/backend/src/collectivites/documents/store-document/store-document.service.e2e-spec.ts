import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import {
  deleteAllDocuments,
  OTHER_PDF_SAMPLE_FILE,
  uploadCreateTestDocument,
} from '../documents.test-fixture';

describe('StoreDocumentService.uploadBuffer', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let collectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    const { collectivite } = await addTestCollectiviteAndUsers(db, {
      users: [{ role: CollectiviteRole.ADMIN }],
    });
    collectiviteId = collectivite.id;
  });

  afterAll(async () => {
    await deleteAllDocuments({ databaseService: db, collectiviteId });
  });

  test('rend le document déjà enregistré quand le même contenu est déposé sous un autre nom', async () => {
    const firstUpload = await uploadCreateTestDocument({
      app,
      collectiviteId,
      fileName: 'premier-nom.pdf',
    });

    const secondUpload = await uploadCreateTestDocument({
      app,
      collectiviteId,
      fileName: 'second-nom.pdf',
    });

    expect(secondUpload).toMatchObject({
      id: firstUpload.id,
      filename: 'premier-nom.pdf',
    });
  });

  test('enregistre un document distinct quand le contenu diffère', async () => {
    const premierContenu = await uploadCreateTestDocument({
      app,
      collectiviteId,
      fileName: 'contenu-a.pdf',
    });

    const autreContenu = await uploadCreateTestDocument({
      app,
      collectiviteId,
      fileName: 'contenu-b.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
    });

    expect(autreContenu.id).not.toBe(premierContenu.id);
    expect(autreContenu.hash).not.toBe(premierContenu.hash);
  });
});
