import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { addAuditeurPermission } from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { GeneratePreuvesArchiveWorker } from './generate-preuves-archive/generate-preuves-archive.worker';
import {
  auditPreuvesArchiveTable,
  AuditPreuvesArchiveStatusEnum,
} from './models/audit-preuves-archive.table';
import { PREUVES_ARCHIVES_BUCKET } from './preuves-archive.constants';

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('Archive de preuves - suppression (storage réel, sans mock)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let storage: DocumentStorageService;

  let collectivite: Collectivite;
  let auditeur: AuthenticatedUser;
  let otherUser: AuthenticatedUser;
  let cleanupCollectivite: () => Promise<void>;
  let auditeurCleanup: () => Promise<void>;
  let auditId: number;

  beforeAll(async () => {
    app = await getTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(GeneratePreuvesArchiveWorker)
          .useValue({ onModuleInit: () => undefined });
      },
    });
    db = await getTestDatabase(app);
    router = await app.get(TrpcRouter);
    storage = app.get(DocumentStorageService);

    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = fixture.collectivite;
    auditeur = getAuthUserFromUserCredentials(fixture.user);
    cleanupCollectivite = fixture.cleanup;

    const otherUserResult = await addTestUser(db, { verified: false });
    otherUser = getAuthUserFromUserCredentials(otherUserResult.user);

    const [audit] = await db.db
      .insert(auditTable)
      .values({ collectiviteId: collectivite.id, referentielId: 'cae' })
      .returning();
    auditId = audit.id;

    ({ cleanup: auditeurCleanup } = await addAuditeurPermission({
      databaseService: db,
      auditId: audit.id,
      userId: auditeur.id,
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
    await cleanupCollectivite();
    await app.close();
  });

  test('une demande supprime réellement le blob et la ligne au-delà des 10 plus récentes', async () => {
    const storagePath = `e2e-delete/${randomUUID()}.zip`;
    const notExpired = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const stored = await storage.storeDocument({
      bucketId: PREUVES_ARCHIVES_BUCKET,
      key: storagePath,
      contentType: 'application/zip',
      content: Buffer.from('archive-bytes'),
    });
    expect(stored.success).toBe(true);

    const [oldest] = await db.db
      .insert(auditPreuvesArchiveTable)
      .values({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
        auditId,
        requestedBy: auditeur.id,
        status: AuditPreuvesArchiveStatusEnum.COMPLETED,
        storagePath,
        createdAt: '2020-01-01T00:00:00.000Z',
        expiresAt: notExpired,
      })
      .returning();

    await db.db.insert(auditPreuvesArchiveTable).values(
      Array.from({ length: 10 }, (_, i) => ({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
        auditId,
        requestedBy: auditeur.id,
        status: AuditPreuvesArchiveStatusEnum.COMPLETED,
        createdAt: `2026-06-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
        expiresAt: notExpired,
      }))
    );

    const caller = router.createCaller({ user: auditeur });
    await caller.referentiels.preuvesArchive.request({
      collectiviteId: collectivite.id,
      referentielId: 'cae',
    });

    const remaining = await db.db
      .select()
      .from(auditPreuvesArchiveTable)
      .where(eq(auditPreuvesArchiveTable.id, oldest.id));
    expect(remaining).toHaveLength(0);

    const afterDelete = await storage.downloadDocument({
      bucketId: PREUVES_ARCHIVES_BUCKET,
      key: storagePath,
    });
    expect(afterDelete.success).toBe(false);
  });

  test("une demande purge aussi les archives expirées d'un autre utilisateur", async () => {
    const [otherExpired] = await db.db
      .insert(auditPreuvesArchiveTable)
      .values({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
        auditId,
        requestedBy: otherUser.id,
        status: AuditPreuvesArchiveStatusEnum.COMPLETED,
        storagePath: null,
        expiresAt: daysAgo(8),
      })
      .returning();

    const caller = router.createCaller({ user: auditeur });
    await caller.referentiels.preuvesArchive.request({
      collectiviteId: collectivite.id,
      referentielId: 'cae',
    });

    const remaining = await db.db
      .select()
      .from(auditPreuvesArchiveTable)
      .where(eq(auditPreuvesArchiveTable.id, otherExpired.id));
    expect(remaining).toHaveLength(0);
  });
});
