import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  addAuditeurPermission,
  createAudit,
} from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
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

  test('Retourne les permissions pour un utilisateur ', async () => {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          accessLevel: CollectiviteRole.EDITION,
        },
      }
    );
    onTestFinished(cleanup);

    const { audit } = await createAudit({
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
});
