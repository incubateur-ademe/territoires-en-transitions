import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { addAuditeurPermission } from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import { createAuditWithOnTestFinished } from '@tet/backend/referentiels/referentiels.test-fixture';
import { getAuthUser, getTestApp } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import {
  AuditRole,
  CollectiviteRole,
  permissionsByRole,
  PlatformRole,
} from '@tet/domain/users';
import { eq } from 'drizzle-orm';

describe('GetUserPermissions', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = app.get(DatabaseService);
  });

  afterAll(async () => {
    await app.close();
  });

  test('Retourne les permissions pour un auditeur audit démarré ', async () => {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );
    onTestFinished(cleanup);

    const { audit } = await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
    });

    await addAuditeurPermission({
      databaseService,
      auditId: audit.id,
      userId: user.id,
    });

    const caller = router.createCaller({ user: await getAuthUser(user) });

    const result = await caller.users.users.get();

    expect(result.roles).toEqual([
      PlatformRole.CONNECTED,
      PlatformRole.VERIFIED,
    ]);
    expect(result.permissions).toEqual([
      ...permissionsByRole[PlatformRole.CONNECTED],
      ...permissionsByRole[PlatformRole.VERIFIED],
    ]);

    expect(result.collectivites).toEqual([
      {
        collectiviteId: collectivite.id,
        collectiviteNom: collectivite.nom,
        collectiviteAccesRestreint: false,
        collectivitePreferences: {
          referentiels: {
            display: {
              cae: true,
              eci: true,
              te: true,
            },
          },
        },
        role: CollectiviteRole.EDITION,
        permissions: permissionsByRole[CollectiviteRole.EDITION],

        audits: [
          {
            auditId: audit.id,
            role: AuditRole.AUDITEUR,
            permissions: permissionsByRole[AuditRole.AUDITEUR],
          },
        ],
      },
    ]);
  });

  test('Retourne les permissions pour un auditeur audit non démarré ', async () => {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );
    onTestFinished(cleanup);

    const { audit } = await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      dateDebut: null,
    });

    await addAuditeurPermission({
      databaseService,
      auditId: audit.id,
      userId: user.id,
    });

    const caller = router.createCaller({ user: await getAuthUser(user) });

    const result = await caller.users.users.get();

    expect(result.roles).toEqual([
      PlatformRole.CONNECTED,
      PlatformRole.VERIFIED,
    ]);
    expect(result.permissions).toEqual([
      ...permissionsByRole[PlatformRole.CONNECTED],
      ...permissionsByRole[PlatformRole.VERIFIED],
    ]);

    expect(result.collectivites).toEqual([
      {
        collectiviteId: collectivite.id,
        collectiviteNom: collectivite.nom,
        collectiviteAccesRestreint: false,
        collectivitePreferences: {
          referentiels: {
            display: {
              cae: true,
              eci: true,
              te: true,
            },
          },
        },
        role: CollectiviteRole.EDITION,
        permissions: permissionsByRole[CollectiviteRole.EDITION],

        audits: [
          {
            auditId: audit.id,
            role: AuditRole.AUDITEUR_AUDIT_NON_DEMARRE,
            permissions:
              permissionsByRole[AuditRole.AUDITEUR_AUDIT_NON_DEMARRE],
          },
        ],
      },
    ]);
  });

  test("Conserve le rôle auditeur pendant 15 jours après la clôture de l'audit", async () => {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );
    onTestFinished(cleanup);

    const { audit } = await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      clos: true,
    });

    await addAuditeurPermission({
      databaseService,
      auditId: audit.id,
      userId: user.id,
    });

    const caller = router.createCaller({ user: await getAuthUser(user) });

    const result = await caller.users.users.get();

    const auditeeCollectivite = result.collectivites.find(
      (c) => c.collectiviteId === collectivite.id
    );
    expect(auditeeCollectivite?.audits).toEqual([
      {
        auditId: audit.id,
        role: AuditRole.AUDITEUR,
        permissions: permissionsByRole[AuditRole.AUDITEUR],
      },
    ]);
  });

  test("Retire le rôle auditeur plus de 15 jours après la clôture de l'audit", async () => {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );
    onTestFinished(cleanup);

    const { audit } = await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      clos: true,
    });

    await databaseService.db
      .update(auditTable)
      .set({
        dateFin: new Date(
          Date.now() - 16 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .where(eq(auditTable.id, audit.id));

    await addAuditeurPermission({
      databaseService,
      auditId: audit.id,
      userId: user.id,
    });

    const caller = router.createCaller({ user: await getAuthUser(user) });

    const result = await caller.users.users.get();

    const auditeeCollectivite = result.collectivites.find(
      (c) => c.collectiviteId === collectivite.id
    );
    expect(auditeeCollectivite?.audits).toEqual([]);
  });
});
