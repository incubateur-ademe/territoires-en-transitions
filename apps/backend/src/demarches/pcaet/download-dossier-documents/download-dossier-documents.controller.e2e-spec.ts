import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { execSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { onTestFinished } from 'vitest';
import {
  addTestBibliothequeFichier,
  PCAET_DOCUMENT_GLOBAL_ID,
} from '../demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('DownloadDossierDocumentsController', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let testAgent: TestAgent;
  let instructriceToken: string;
  let tiersToken: string;
  let demandeAvisId: number;

  // Un code propre à cette spec, dans l'espace réservé aux codes figés — une
  // lettre puis un chiffre. Voir `pickFreeRegionCode` pour les trois espaces.
  const REGION = 'G3';
  const COLLECTIVITE_NOM = 'Agglo test archive dossier';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    const router = await getTestRouter(app);
    testAgent = request(app.getHttpServer());

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: COLLECTIVITE_NOM },
    });

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test archive dossier',
      },
    });
    instructriceToken = await getAuthToken({
      email: dreal.user.email ?? '',
      password: dreal.user.password,
    });

    const tiers = await addTestUser(db);
    tiersToken = await getAuthToken({
      email: tiers.user.email ?? '',
      password: tiers.user.password,
    });

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test archive dossier',
        status: 'en_elaboration',
      })
      .returning({ id: demarcheTable.id });

    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: deposante.collectivite.id,
      filename: 'dossier-complet.pdf',
    });
    const depose = await router
      .createCaller({ user: getAuthUserFromUserCredentials(deposante.user) })
      .demarches.pcaet.documents.add({
        collectiviteId: deposante.collectivite.id,
        demarcheId: demarche.id,
        documentId: PCAET_DOCUMENT_GLOBAL_ID,
        fichierId: fichier.id,
      });
    const storeResult = await app.get(DocumentStorageService).storeDocument({
      bucketId: depose.fichier?.bucketId ?? '',
      key: depose.fichier?.hash ?? '',
      contentType: 'application/pdf',
      content: Buffer.from('%PDF-1.4 test'),
    });
    expect(storeResult.success).toBe(true);

    await db.db
      .update(demarcheTable)
      .set({
        status: 'transmis_pour_avis',
        transmittedAt: new Date().toISOString(),
      })
      .where(eq(demarcheTable.id, demarche.id));

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId: demarche.id,
        instructeurCollectiviteId: dreal.collectivite.id,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });
    demandeAvisId = demande.id;

    return async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.id, demandeAvisId));
      await db.db
        .delete(demarcheTable)
        .where(eq(demarcheTable.id, demarche.id));
      await tiers.cleanup();
      await dreal.cleanup();
      await deposante.cleanup();
      await app.close();
    };
  });

  const downloadArchive = (query: Record<string, number>, token: string) =>
    testAgent
      .get('/demarches/pcaet/dossiers/documents/archive')
      .query(query)
      .set('Authorization', `Bearer ${token}`);

  const listArchiveEntries = async (body: Buffer): Promise<string[]> => {
    const directory = await mkdtemp(join(tmpdir(), 'dossier-pcaet-e2e-'));
    onTestFinished(async () => {
      await rm(directory, { recursive: true, force: true });
    });
    const archivePath = join(directory, 'archive.zip');
    await writeFile(archivePath, body);

    return execSync(`unzip -Z1 "${archivePath}"`, { encoding: 'utf-8' })
      .trim()
      .split('\n');
  };

  it('remet à l’instructrice les pièces du dossier, nommées d’après leur pièce', async () => {
    const response = await downloadArchive({ demandeAvisId }, instructriceToken)
      .responseType('blob')
      .expect(200);

    const filename = decodeURIComponent(
      response.headers['content-disposition'].split("filename*=UTF-8''")[1]
    );
    expect(filename).toBe(`Dossier PCAET - ${COLLECTIVITE_NOM}.zip`);

    expect(await listArchiveEntries(response.body)).toEqual([
      'PCAET global - dossier-complet.pdf',
    ]);
  });

  it('refuse le dossier à qui ne l’instruit pas', async () => {
    await downloadArchive({ demandeAvisId }, tiersToken).expect(403);
  });

  it('rend 404 pour une saisine inconnue', async () => {
    await downloadArchive(
      { demandeAvisId: 2_000_000_000 },
      instructriceToken
    ).expect(404);
  });

  it('exige une seule clé de dossier', async () => {
    await downloadArchive({}, instructriceToken).expect(400);
    await downloadArchive(
      { demandeAvisId, demarcheId: demandeAvisId },
      instructriceToken
    ).expect(400);
  });
});
