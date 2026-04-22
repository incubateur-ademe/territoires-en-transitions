import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  addAuditeurPermission,
  createAudit,
} from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import {
  defaultCollectivitePreferences,
  Collectivite,
} from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import {
  AuditRole,
  CollectiviteRole,
  permissionsByRole,
  PlatformRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { getTestApp, getTestDatabase } from '../../../../test/app-utils';
import {
  getAuthUserFromUserCredentials,
  getServiceRoleUser,
} from '../../../../test/auth-utils';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '../users.test-fixture';
import { DatabaseService } from '../../../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';
import { AuthenticatedUser } from '../../models/auth.models';

type Input = inferProcedureInput<
  AppRouter['users']['users']['getWithRolesAndPermissionsByEmail']
>;

describe('ListUsersRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let testUser: AuthenticatedUser;
  let authenticatedUser: AuthenticatedUser;
  let authenticatedUserEmail: string;
  let authenticatedUserNom: string;
  let authenticatedUserPrenom: string;
  let editionCollectivite1: Collectivite;
  let editionCollectivite2: Collectivite;
  let auditCollectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);

    // Utilisateur isolé sans accès, pour vérifier le refus d'accès au service
    const testUserResult = await addTestUser(databaseService);
    testUser = getAuthUserFromUserCredentials(testUserResult.user);

    // Noms préfixés pour contrôler l'ordre alphabétique du tri par nom
    // (cf. get-user-roles-and-permissions.repository.ts:98 `.orderBy(nom)`).
    const { collectivite: col1 } = await addTestCollectivite(databaseService, {
      nom: `A list-users edition 1 ${Math.random().toString().substring(2, 6)}`,
    });
    editionCollectivite1 = col1;

    const { collectivite: col2 } = await addTestCollectivite(databaseService, {
      nom: `B list-users edition 2 ${Math.random().toString().substring(2, 6)}`,
    });
    editionCollectivite2 = col2;

    const { collectivite: col3 } = await addTestCollectivite(databaseService, {
      nom: `C list-users auditeur ${Math.random().toString().substring(2, 6)}`,
    });
    auditCollectivite = col3;

    // Utilisateur sous test : EDITION sur col1+col2, AUDITEUR sur col3 (sans rôle direct)
    const userResult = await addTestUser(databaseService, {
      collectiviteId: editionCollectivite1.id,
      role: CollectiviteRole.EDITION,
    });
    authenticatedUser = getAuthUserFromUserCredentials(userResult.user);
    authenticatedUserEmail = userResult.user.email ?? '';
    authenticatedUserNom = userResult.user.nom;
    authenticatedUserPrenom = userResult.user.prenom;

    await setUserCollectiviteRole(databaseService, {
      userId: userResult.user.id,
      collectiviteId: editionCollectivite2.id,
      role: CollectiviteRole.EDITION,
    });

    const { audit } = await createAudit({
      databaseService,
      collectiviteId: auditCollectivite.id,
      referentielId: ReferentielIdEnum.CAE,
    });
    await addAuditeurPermission({
      databaseService,
      auditId: audit.id,
      userId: userResult.user.id,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  function buildExpectedUserInfo(): UserWithRolesAndPermissions {
    return {
      id: authenticatedUser.id,
      email: authenticatedUserEmail,
      nom: authenticatedUserNom,
      prenom: authenticatedUserPrenom,
      telephone: null,
      cguAccepteesLe: expect.any(String),

      roles: [PlatformRole.CONNECTED, PlatformRole.VERIFIED],
      permissions: [
        ...new Set([
          ...permissionsByRole[PlatformRole.CONNECTED],
          ...permissionsByRole[PlatformRole.VERIFIED],
        ]),
      ],

      collectivites: [
        {
          collectiviteId: editionCollectivite1.id,
          collectiviteNom: editionCollectivite1.nom,
          collectiviteAccesRestreint: false,
          collectivitePreferences: defaultCollectivitePreferences,
          role: CollectiviteRole.EDITION,
          permissions: permissionsByRole[CollectiviteRole.EDITION],
          audits: [],
        },
        {
          collectiviteId: editionCollectivite2.id,
          collectiviteNom: editionCollectivite2.nom,
          collectiviteAccesRestreint: false,
          collectivitePreferences: defaultCollectivitePreferences,
          role: CollectiviteRole.EDITION,
          permissions: permissionsByRole[CollectiviteRole.EDITION],
          audits: [],
        },
        {
          // Collectivité dont l'utilisateur est auditeur (sans rôle direct)
          collectiviteId: auditCollectivite.id,
          collectiviteNom: auditCollectivite.nom,
          collectiviteAccesRestreint: false,
          collectivitePreferences: defaultCollectivitePreferences,
          role: null,
          permissions: [],
          audits: [
            {
              auditId: expect.any(Number),
              role: AuditRole.AUDITEUR,
              permissions: permissionsByRole[AuditRole.AUDITEUR],
            },
          ],
        },
      ],
    };
  }

  test('Un utilisateur ne peut pas accéder à ce service', async () => {
    const caller = router.createCaller({ user: testUser });

    const input: Input = {
      email: authenticatedUserEmail,
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.users.users.getWithRolesAndPermissionsByEmail(input)
    ).rejects.toThrowError(/Not service role/i);
  });

  test('Utilisation avec un compte de service', async () => {
    const serviceAccountUser = getServiceRoleUser();
    const caller = router.createCaller({ user: serviceAccountUser });

    const input: Input = {
      email: authenticatedUserEmail,
    };
    const userInfoResponse =
      await caller.users.users.getWithRolesAndPermissionsByEmail(input);

    expect(userInfoResponse).toEqual(buildExpectedUserInfo());
  });

  test('Un utilisateur peut accéder à ses informations', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const userInfoResponse = await caller.users.users.get();

    expect(userInfoResponse).toEqual(buildExpectedUserInfo());
  });
});
