import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';

describe('List Preuves Router', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let app: INestApplication;

  let collectivite: Collectivite;
  let visiteurUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      db,
      {
        collectivite: {},
        users: [
          {
            accessLevel: CollectiviteRole.LECTURE,
          },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    visiteurUser = getAuthUserFromDcp(testCollectiviteAndUsersResult.users[0]);

    return async () => {
      await testCollectiviteAndUsersResult.cleanup();

      if (app) {
        await app.close();
      }
    };
  });

  describe('List Preuves - Visiteur', () => {
    test('a visiteur can list preuves for a demande (listPreuvesLabellisation)', async () => {
      const { demande } = await createAuditWithOnTestFinished({
        databaseService: db,
        collectiviteId: collectivite.id,
        referentielId: ReferentielIdEnum.CAE,
        withDemande: true,
      });

      const caller = router.createCaller({ user: visiteurUser });

      const preuves =
        await caller.referentiels.labellisations.listPreuvesLabellisation({
          demandeId: demande!.id,
        });

      expect(preuves).toBeDefined();
      expect(Array.isArray(preuves)).toBe(true);
    });

    test('a visiteur can list preuves for an audit (listPreuvesAudit)', async () => {
      const { audit } = await createAuditWithOnTestFinished({
        databaseService: db,
        collectiviteId: collectivite.id,
        referentielId: ReferentielIdEnum.CAE,
        withDemande: true,
      });

      const caller = router.createCaller({ user: visiteurUser });

      const preuves = await caller.referentiels.labellisations.listPreuvesAudit(
        {
          auditId: audit.id,
        }
      );

      expect(preuves).toBeDefined();
      expect(Array.isArray(preuves)).toBe(true);
    });
  });
});
