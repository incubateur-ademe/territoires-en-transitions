import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { addAuditeurPermission } from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import { createAuditWithOnTestFinished } from '@tet/backend/referentiels/referentiels.test-fixture';
import {
  getAuthUser,
  getAuthUserFromUserCredentials,
  getTestApp,
} from '@tet/backend/test';
import { utilisateurRoleBackofficeTable } from '@tet/backend/users/authorizations/roles/utilisateur-role-backoffice.table';
import {
  addTestUser,
  addUserRoleBackoffice,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { defaultCollectivitePreferences } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import {
  AuditRole,
  CollectiviteRole,
  permissionsByRole,
  PlatformRole,
} from '@tet/domain/users';
import { eq, sql } from 'drizzle-orm';

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
        collectiviteType: collectivite.type,
        collectiviteAccesRestreint: false,
        collectivitePreferences: defaultCollectivitePreferences,
        role: CollectiviteRole.EDITION,
        permissions: permissionsByRole[CollectiviteRole.EDITION],

        audits: [
          {
            auditId: audit.id,
            referentielId: ReferentielIdEnum.CAE,
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
        collectiviteType: collectivite.type,
        collectiviteAccesRestreint: false,
        collectivitePreferences: defaultCollectivitePreferences,
        role: CollectiviteRole.EDITION,
        permissions: permissionsByRole[CollectiviteRole.EDITION],

        audits: [
          {
            auditId: audit.id,
            referentielId: ReferentielIdEnum.CAE,
            role: AuditRole.AUDITEUR_AUDIT_NON_DEMARRE,
            permissions:
              permissionsByRole[AuditRole.AUDITEUR_AUDIT_NON_DEMARRE],
          },
        ],
      },
    ]);
  });

  test("Garde l'auditeur en AUDITEUR_AUDIT_VALIDE pendant 15 jours après la clôture de l'audit", async () => {
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
        referentielId: ReferentielIdEnum.CAE,
        role: AuditRole.AUDITEUR_AUDIT_VALIDE,
        permissions: permissionsByRole[AuditRole.AUDITEUR_AUDIT_VALIDE],
      },
    ]);
  });

  test("Passe l'auditeur en AUDITEUR_AUDIT_VALIDE dès la validation, même si l'audit n'est pas encore clos", async () => {
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
      valide: true,
      clos: false,
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
        referentielId: ReferentielIdEnum.CAE,
        role: AuditRole.AUDITEUR_AUDIT_VALIDE,
        permissions: permissionsByRole[AuditRole.AUDITEUR_AUDIT_VALIDE],
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
        dateFin: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
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

  test('Retourne le rôle backoffice attribué et ses permissions', async () => {
    const { user } = await addTestUser(databaseService);
    const { cleanup } = await addUserRoleBackoffice({
      databaseService,
      userId: user.id,
      role: PlatformRole.BACKOFFICE_REPRISE_TEC_LECTURE,
    });
    onTestFinished(cleanup);

    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
    const result = await caller.users.users.get();

    expect(result.roles).toEqual([
      PlatformRole.CONNECTED,
      PlatformRole.VERIFIED,
      PlatformRole.BACKOFFICE_REPRISE_TEC_LECTURE,
    ]);
    expect(result.permissions).toContain('demarches.reprise-tec.read');
    expect(result.collectivites).toEqual([]);
  });

  test("Ne retourne aucun rôle backoffice à un compte qui n'en a pas", async () => {
    const { user } = await addTestUser(databaseService);

    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
    const result = await caller.users.users.get();

    expect(result.roles).not.toContain(
      PlatformRole.BACKOFFICE_REPRISE_TEC_LECTURE
    );
    expect(result.permissions).not.toContain('demarches.reprise-tec.read');
  });

  test('La base refuse un rôle backoffice inconnu', async () => {
    const { user } = await addTestUser(databaseService);

    await expect(
      databaseService.db.execute(
        sql`insert into ${utilisateurRoleBackofficeTable} (user_id, role, created_by)
            values (${user.id}, 'BACKOFFICE_INCONNU_LECTURE', ${user.id})`
      )
    ).rejects.toMatchObject({ cause: { code: '23514' } });
  });
});
