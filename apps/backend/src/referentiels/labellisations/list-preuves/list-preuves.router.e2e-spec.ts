import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  createTRPCClientFromCaller,
  getAuthUser,
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  signInWith,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';
import { createTestDemandePreuve } from '../create-preuve/create-preuve.test-fixture';

describe('List Preuves Router', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let app: INestApplication;

  let collectivite: Collectivite;
  let editeurUser: AuthenticatedUser;
  let visiteurUser: AuthenticatedUser;
  let editeurAuthToken: string;

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
            accessLevel: CollectiviteRole.EDITION,
          },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    const editeur = testCollectiviteAndUsersResult.users[0];
    const editeurUserSignInResponse = await signInWith({
      email: editeur.email,
      password: YOLO_DODO.password,
    });
    editeurAuthToken =
      editeurUserSignInResponse.data.session?.access_token ?? '';
    editeurUser = getAuthUserFromDcp(editeur);
    visiteurUser = await getAuthUser(YOLO_DODO);

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
        dateDebut: null,
      });
      expect(demande).toBeDefined();

      const editeurCaller = router.createCaller({ user: editeurUser });
      const trpcClient = createTRPCClientFromCaller(editeurCaller);
      const testAgent = request(app.getHttpServer());
      await createTestDemandePreuve(
        trpcClient,
        testAgent,
        editeurAuthToken,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      const visiteurCaller = router.createCaller({ user: visiteurUser });

      const preuves =
        await visiteurCaller.referentiels.labellisations.listPreuvesLabellisation(
          {
            demandeId: demande?.id ?? 0,
          }
        );

      expect(preuves).toBeDefined();
      expect(Array.isArray(preuves)).toBe(true);
      expect(preuves.length).toBe(1);
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
