import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  OTHER_PDF_SAMPLE_FILE,
  uploadCreateTestDocument,
} from '@tet/backend/collectivites/documents/documents.test-fixture';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { execSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { onTestFinished } from 'vitest';

const MESURE = {
  actionId: 'eci_1.1.4',
  attendu: 'delib_strategie_eci',
  sousMesure: 'eci_1.1.4.1',
} as const;

const COLLECTIVITE_NOM = 'Amberieu';

describe('DownloadDocumentsMesureController', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let testAgent: TestAgent;
  let visiteurToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);
    testAgent = request(app.getHttpServer());

    const visiteurResult = await addTestUser(db);
    visiteurToken = await getAuthToken({
      email: visiteurResult.user.email ?? '',
      password: visiteurResult.user.password,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const createCollectivite = async ({
    accesRestreint = false,
  }: { accesRestreint?: boolean } = {}) => {
    const { collectivite, users, cleanup } = await addTestCollectiviteAndUsers(
      db,
      {
        collectivite: { nom: COLLECTIVITE_NOM, accesRestreint },
        users: [{ role: CollectiviteRole.EDITION }],
      }
    );
    onTestFinished(cleanup);

    const collectiviteId = collectivite.id;
    onTestFinished(async () => {
      await db.db
        .delete(preuveComplementaireTable)
        .where(eq(preuveComplementaireTable.collectiviteId, collectiviteId));
      await db.db
        .delete(preuveReglementaireTable)
        .where(eq(preuveReglementaireTable.collectiviteId, collectiviteId));
    });

    const membre = users[0];
    const membreToken = await getAuthToken({
      email: membre.email ?? '',
      password: membre.password,
    });

    return {
      collectiviteId,
      membreToken,
      membreCaller: router.createCaller({
        user: getAuthUserFromUserCredentials(membre),
      }),
      uploadFichier: ({
        fileName,
        sampleFileName,
      }: {
        fileName: string;
        sampleFileName?: string;
      }) =>
        uploadCreateTestDocument({
          collectiviteId,
          testAgent,
          token: membreToken,
          fileName,
          sampleFileName,
        }),
    };
  };

  const downloadArchive = ({
    collectiviteId,
    actionId,
    token,
  }: {
    collectiviteId: number;
    actionId: string;
    token: string;
  }) =>
    testAgent
      .get(
        `/collectivites/${collectiviteId}/mesures/${actionId}/documents/archive`
      )
      .set('Authorization', `Bearer ${token}`);

  const listArchiveEntries = async (body: Buffer): Promise<string[]> => {
    const directory = await mkdtemp(join(tmpdir(), 'documents-mesure-e2e-'));
    onTestFinished(async () => {
      await rm(directory, { recursive: true, force: true });
    });
    const archivePath = join(directory, 'archive.zip');
    await writeFile(archivePath, body);

    return execSync(`unzip -Z1 "${archivePath}"`, { encoding: 'utf-8' })
      .trim()
      .split('\n');
  };

  test('réunit dans une archive les documents de la mesure et de ses sous-mesures', async () => {
    const { collectiviteId, membreToken, membreCaller, uploadFichier } =
      await createCollectivite();

    const attendu = await uploadFichier({ fileName: 'deliberation.pdf' });
    const complementaire = await uploadFichier({
      fileName: 'annexe.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
    });
    await membreCaller.referentiels.actions.addPreuveReglementaire({
      collectiviteId,
      preuveId: MESURE.attendu,
      fichierId: attendu.id,
    });
    await membreCaller.referentiels.actions.addPreuveComplementaire({
      collectiviteId,
      actionId: MESURE.sousMesure,
      fichierId: complementaire.id,
    });

    const response = await downloadArchive({
      collectiviteId,
      actionId: MESURE.actionId,
      token: membreToken,
    })
      .responseType('blob')
      .expect(200);

    const filename = decodeURI(
      response.headers['content-disposition']
        .split('filename="')[1]
        .slice(0, -1)
    );
    expect(filename).toBe(`eci_1.1.4_${COLLECTIVITE_NOM}.zip`);

    const entries = await listArchiveEntries(response.body);
    expect(entries.sort()).toEqual(['annexe.pdf', 'deliberation.pdf']);
  });

  test('rend 404 quand la mesure ne porte aucun document', async () => {
    const { collectiviteId, membreToken } = await createCollectivite();

    await downloadArchive({
      collectiviteId,
      actionId: MESURE.actionId,
      token: membreToken,
    }).expect(404);
  });

  test("refuse l'archive d'une collectivité en accès restreint à un non membre", async () => {
    const { collectiviteId } = await createCollectivite({
      accesRestreint: true,
    });

    await downloadArchive({
      collectiviteId,
      actionId: MESURE.actionId,
      token: visiteurToken,
    }).expect(403);
  });

  test("rejette un identifiant de collectivité qui n'est pas un entier positif", async () => {
    await testAgent
      .get('/collectivites/zero/mesures/eci_1.1.4/documents/archive')
      .set('Authorization', `Bearer ${visiteurToken}`)
      .expect(400);
  });

  test('rejette un identifiant de mesure dont le préfixe ne désigne aucun référentiel', async () => {
    const { collectiviteId, membreToken } = await createCollectivite();

    await downloadArchive({
      collectiviteId,
      actionId: 'inconnu_1.1.4',
      token: membreToken,
    }).expect(400);
  });
});
