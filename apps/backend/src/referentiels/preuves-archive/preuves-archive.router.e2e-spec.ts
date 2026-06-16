import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { addAuditeurPermission } from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { GeneratePreuvesArchiveWorker } from './generate-preuves-archive/generate-preuves-archive.worker';
import {
  auditPreuvesArchiveTable,
  AuditPreuvesArchiveStatusEnum,
} from './models/audit-preuves-archive.table';

const FAKE_SIGNED_URL = 'https://supabase.test/signed/archive.zip';

describe('Archive de preuves - tRPC', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let adminUser: AuthenticatedUser;
  let unauthorizedUser: AuthenticatedUser;
  let readerNonAuditeur: AuthenticatedUser;
  let auditeurCleanup: () => Promise<void>;
  let auditId: number;

  beforeAll(async () => {
    app = await getTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(GeneratePreuvesArchiveWorker)
          .useValue({ onModuleInit: () => undefined });
        moduleBuilder.overrideProvider(DocumentStorageService).useValue({
          createDocumentSignedUrl: async () => ({
            success: true,
            data: { signedUrl: FAKE_SIGNED_URL },
          }),
        });
      },
    });
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(db, {
      user: {
        role: CollectiviteRole.ADMIN,
      },
    });

    collectivite = testCollectiviteAndUserResult.collectivite;
    adminUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUserResult.user
    );

    const unauthorizedUserResult = await addTestUser(db, { verified: false });
    unauthorizedUser = getAuthUserFromUserCredentials(
      unauthorizedUserResult.user
    );

    const readerNonAuditeurResult = await addTestUser(db, {
      collectiviteId: collectivite.id,
      role: CollectiviteRole.ADMIN,
    });
    readerNonAuditeur = getAuthUserFromUserCredentials(
      readerNonAuditeurResult.user
    );

    const [audit] = await db.db
      .insert(auditTable)
      .values({ collectiviteId: collectivite.id, referentielId: 'cae' })
      .returning();
    auditId = audit.id;

    ({ cleanup: auditeurCleanup } = await addAuditeurPermission({
      databaseService: db,
      auditId: audit.id,
      userId: adminUser.id,
    }));
  });

  afterAll(async () => {
    await db.db
      .delete(auditPreuvesArchiveTable)
      .where(eq(auditPreuvesArchiveTable.collectiviteId, collectivite.id));
    await auditeurCleanup();
    await db.db
      .delete(auditTable)
      .where(eq(auditTable.collectiviteId, collectivite.id));
    await app.close();
  });

  describe('Archive de preuves - Cas de succès', () => {
    test('request déclenche une archive et renvoie un statut pending', async () => {
      const caller = router.createCaller({ user: adminUser });

      const result = await caller.referentiels.preuvesArchive.request({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
      });

      expect(result.archiveId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(result.status).toBe('pending');
    });

    test('request est idempotent : un second appel renvoie le même archiveId', async () => {
      const caller = router.createCaller({ user: adminUser });

      const first = await caller.referentiels.preuvesArchive.request({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
      });
      const second = await caller.referentiels.preuvesArchive.request({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
      });

      expect(second.archiveId).toBe(first.archiveId);
    });

    test("get renvoie l'état courant pending de l'archive", async () => {
      const caller = router.createCaller({ user: adminUser });

      const { archiveId } = await caller.referentiels.preuvesArchive.request({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
      });

      const result = await caller.referentiels.preuvesArchive.get({
        archiveId,
      });

      expect(result).toEqual({
        archiveId,
        status: 'pending',
        totalFiles: 0,
        processedFiles: 0,
        downloadUrl: null,
        errorMessage: null,
      });
    });

  });

  describe("Archive de preuves - Cas d'erreur", () => {
    test('request échoue pour un utilisateur sans droits sur la collectivité', async () => {
      const caller = router.createCaller({ user: unauthorizedUser });

      await expect(
        caller.referentiels.preuvesArchive.request({
          collectiviteId: collectivite.id,
          referentielId: 'cae',
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test("request refuse un utilisateur ayant referentiels.read mais non-auditeur de l'audit en cours", async () => {
      const caller = router.createCaller({ user: readerNonAuditeur });

      await expect(
        caller.referentiels.preuvesArchive.request({
          collectiviteId: collectivite.id,
          referentielId: 'cae',
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('get renvoie NOT_FOUND pour une archive appartenant à un·e autre utilisateur·ice', async () => {
      const adminCaller = router.createCaller({ user: adminUser });
      const { archiveId } =
        await adminCaller.referentiels.preuvesArchive.request({
          collectiviteId: collectivite.id,
          referentielId: 'cae',
        });

      const unauthorizedCaller = router.createCaller({
        user: unauthorizedUser,
      });

      await expect(
        unauthorizedCaller.referentiels.preuvesArchive.get({ archiveId })
      ).rejects.toThrow("L'archive de preuves demandée n'existe pas");
    });

    test('get renvoie NOT_FOUND pour un archiveId inexistant', async () => {
      const caller = router.createCaller({ user: adminUser });

      await expect(
        caller.referentiels.preuvesArchive.get({ archiveId: randomUUID() })
      ).rejects.toThrow("L'archive de preuves demandée n'existe pas");
    });

    test("get retourne un message générique quand l'archive est failed (pas de fuite du détail interne)", async () => {
      const caller = router.createCaller({ user: adminUser });

      const { archiveId } = await caller.referentiels.preuvesArchive.request({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
      });

      const internalDetail =
        'Audit 42 introuvable: getAudit returned DATABASE_ERROR stack trace xxx';
      await db.db
        .update(auditPreuvesArchiveTable)
        .set({
          status: AuditPreuvesArchiveStatusEnum.FAILED,
          errorMessage: internalDetail,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(auditPreuvesArchiveTable.id, archiveId));

      const result = await caller.referentiels.preuvesArchive.get({
        archiveId,
      });

      expect(result).toMatchObject({
        status: 'failed',
        errorMessage:
          "La génération de l'archive a échoué. Veuillez réessayer ou contactez le support.",
        downloadUrl: null,
      });
      expect(result.errorMessage).not.toContain('getAudit');
    });
  });

  describe('Archive de preuves - list (historique persisté)', () => {
    test('renvoie mes archives du référentiel (métadonnée, sans downloadUrl)', async () => {
      const caller = router.createCaller({ user: adminUser });
      const { archiveId } = await caller.referentiels.preuvesArchive.request({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
      });

      const result = await caller.referentiels.preuvesArchive.list({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
      });

      const mine = result.find((archive) => archive.archiveId === archiveId);
      expect(mine).toMatchObject({
        archiveId,
        status: expect.any(String),
        totalFiles: expect.any(Number),
        processedFiles: expect.any(Number),
        createdAt: expect.any(String),
      });
      expect(mine).not.toHaveProperty('downloadUrl');
    });

    test("exclut les archives d'un·e autre utilisateur·ice", async () => {
      const [other] = await db.db
        .insert(auditPreuvesArchiveTable)
        .values({
          collectiviteId: collectivite.id,
          referentielId: 'cae',
          auditId,
          requestedBy: readerNonAuditeur.id,
          status: AuditPreuvesArchiveStatusEnum.COMPLETED,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .returning();

      const caller = router.createCaller({ user: adminUser });
      const result = await caller.referentiels.preuvesArchive.list({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
      });

      expect(result.map((archive) => archive.archiveId)).not.toContain(
        other.id
      );
    });

    test("exclut les archives d'un autre référentiel", async () => {
      const [eci] = await db.db
        .insert(auditPreuvesArchiveTable)
        .values({
          collectiviteId: collectivite.id,
          referentielId: 'eci',
          auditId,
          requestedBy: adminUser.id,
          status: AuditPreuvesArchiveStatusEnum.COMPLETED,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .returning();

      const caller = router.createCaller({ user: adminUser });
      const cae = await caller.referentiels.preuvesArchive.list({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
      });
      expect(cae.map((archive) => archive.archiveId)).not.toContain(eci.id);

      const eciList = await caller.referentiels.preuvesArchive.list({
        collectiviteId: collectivite.id,
        referentielId: 'eci',
      });
      expect(eciList.map((archive) => archive.archiveId)).toContain(eci.id);
    });

    test('exclut les archives expirées', async () => {
      const [expired] = await db.db
        .insert(auditPreuvesArchiveTable)
        .values({
          collectiviteId: collectivite.id,
          referentielId: 'cae',
          auditId,
          requestedBy: adminUser.id,
          status: AuditPreuvesArchiveStatusEnum.COMPLETED,
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        })
        .returning();

      const caller = router.createCaller({ user: adminUser });
      const result = await caller.referentiels.preuvesArchive.list({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
      });

      expect(result.map((archive) => archive.archiveId)).not.toContain(
        expired.id
      );
    });

    test('refuse un utilisateur sans referentiels.read', async () => {
      const caller = router.createCaller({ user: unauthorizedUser });

      await expect(
        caller.referentiels.preuvesArchive.list({
          collectiviteId: collectivite.id,
          referentielId: 'cae',
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });
});
