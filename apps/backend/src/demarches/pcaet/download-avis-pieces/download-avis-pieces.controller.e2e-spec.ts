import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  buildRandomDocumentHash,
  seedTestDocument,
} from '@tet/backend/collectivites/documents/documents.test-fixture';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
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
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('DownloadAvisPiecesController', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let testAgent: TestAgent;
  let instructriceToken: string;
  let deposanteToken: string;
  let tiersToken: string;
  let instructrice: AuthenticatedUser;
  let demandeAvisId: number;
  let avisId: string;

  // Un code propre à cette spec, dans l'espace réservé aux codes figés — une
  // lettre puis un chiffre. Voir `pickFreeRegionCode` pour les trois espaces.
  const REGION = 'G4';
  const DEPOSANTE_NOM = 'Agglo test archive avis';
  const DREAL_NOM = 'DREAL test archive avis';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);
    testAgent = request(app.getHttpServer());

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: DEPOSANTE_NOM },
    });
    deposanteToken = await getAuthToken({
      email: deposante.user.email ?? '',
      password: deposante.user.password,
    });

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { type: 'dreal', regionCode: REGION, nom: DREAL_NOM },
    });
    instructrice = getAuthUserFromUserCredentials(dreal.user);
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
        titre: 'PCAET test archive avis',
        status: 'transmis_pour_avis',
        transmittedAt: new Date().toISOString(),
        avisDeadlineAt: new Date(
          Date.now() + 30 * 24 * 3600 * 1000
        ).toISOString(),
      })
      .returning({ id: demarcheTable.id });

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId: demarche.id,
        instructeurCollectiviteId: dreal.collectivite.id,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });
    demandeAvisId = demande.id;

    // Les pièces vivent dans la bibliothèque de l'émetteur, la DREAL.
    const [{ bucketId }] = await db.db
      .select({ bucketId: collectiviteBucketTable.bucketId })
      .from(collectiviteBucketTable)
      .where(eq(collectiviteBucketTable.collectiviteId, dreal.collectivite.id));
    const deposerPiece = async (filename: string) => {
      const hash = buildRandomDocumentHash();
      await seedTestDocument({
        hash,
        databaseService: db,
        collectiviteId: dreal.collectivite.id,
        filename,
        withStorageObject: false,
      });
      const storeResult = await app.get(DocumentStorageService).storeDocument({
        bucketId,
        key: hash,
        contentType: 'application/pdf',
        content: Buffer.from(`%PDF-1.4 ${filename}`),
      });
      expect(storeResult.success).toBe(true);
      return hash;
    };
    const courrier = await deposerPiece('courrier.pdf');
    const annexe = await deposerPiece('annexe.pdf');

    const [avis] = await db.db
      .insert(pcaetAvisTable)
      .values({
        demandeAvisId,
        emetteurCollectiviteId: dreal.collectivite.id,
        auTitreDe: 'prefet_region',
        fichierRefs: [courrier, annexe],
        valideLe: new Date().toISOString(),
      })
      .returning({ id: pcaetAvisTable.id });
    avisId = avis.id;

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

  const downloadArchive = (
    query: Record<string, number | string>,
    token: string
  ) =>
    testAgent
      .get('/demarches/pcaet/avis/pieces/archive')
      .query(query)
      .set('Authorization', `Bearer ${token}`);

  const listArchiveEntries = async (body: Buffer): Promise<string[]> => {
    const directory = await mkdtemp(join(tmpdir(), 'avis-pcaet-e2e-'));
    onTestFinished(async () => {
      await rm(directory, { recursive: true, force: true });
    });
    const archivePath = join(directory, 'archive.zip');
    await writeFile(archivePath, body);

    return execSync(`unzip -Z1 "${archivePath}"`, { encoding: 'utf-8' })
      .trim()
      .split('\n');
  };

  it('réunit le courrier et son annexe dans une seule archive', async () => {
    const response = await downloadArchive(
      { demandeAvisId, avisId },
      instructriceToken
    )
      .responseType('blob')
      .expect(200);

    const filename = decodeURIComponent(
      response.headers['content-disposition'].split("filename*=UTF-8''")[1]
    );
    expect(filename).toBe(`Avis ${DREAL_NOM} - PCAET ${DEPOSANTE_NOM}.zip`);

    // Téléchargements parallèles : l'ordre des entrées n'est pas garanti.
    expect((await listArchiveEntries(response.body)).sort()).toEqual([
      'annexe.pdf',
      'courrier.pdf',
    ]);
  });

  it("remet l'archive d'un avis validé à la collectivité déposante", async () => {
    await downloadArchive({ demandeAvisId, avisId }, deposanteToken).expect(
      200
    );
  });

  it("refuse l'archive à qui n'a rien à voir avec le dossier", async () => {
    await downloadArchive({ demandeAvisId, avisId }, tiersToken).expect(403);
  });

  // Le lien signé ne sert qu'une pièce : il renvoie vers l'archive plutôt que
  // de n'en livrer qu'une sans prévenir.
  it("refuse le lien d'une seule pièce sur un avis qui en porte plusieurs", async () => {
    await expect(
      router
        .createCaller({ user: instructrice })
        .demarches.pcaet.getAvisFileUrl({ demandeAvisId, avisId })
    ).rejects.toThrow('plusieurs pièces');
  });
});
