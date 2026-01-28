import { INestApplication } from '@nestjs/common';
import {
  AuditRole,
  CollectiviteRole,
  permissionsByRole,
  PlatformRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { getTestApp } from '../../../../test/app-utils';
import { getAuthUser, getServiceRoleUser } from '../../../../test/auth-utils';
import { YOLO_DODO, YOULOU_DOUDOU } from '../../../../test/test-users.samples';
import { DatabaseService } from '../../../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';
import { AuthenticatedUser } from '../../models/auth.models';

type Input = inferProcedureInput<
  AppRouter['users']['users']['getWithRolesAndPermissionsByEmail']
>;

const expectedYoulouDoudouUserInfoResponse: UserWithRolesAndPermissions = {
  id: '5f407fc6-3634-45ff-a988-301e9088096a',
  email: 'youlou@doudou.com',
  nom: 'Doudou',
  prenom: 'Youlou',
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
      collectiviteId: 1,
      collectiviteNom: 'Ambérieu-en-Bugey',
      collectiviteAccesRestreint: false,
      role: CollectiviteRole.EDITION,
      permissions: permissionsByRole[CollectiviteRole.EDITION],

      audits: expect.any(Array),
    },
    {
      collectiviteId: 2,
      collectiviteNom: 'Arbent',
      collectiviteAccesRestreint: false,
      role: CollectiviteRole.EDITION,
      permissions: permissionsByRole[CollectiviteRole.EDITION],

      audits: expect.any(Array),
    },
    {
      // Collectivité dont youloudoudou est auditeur
      collectiviteId: 10,
      collectiviteNom: 'La Boisse',
      collectiviteAccesRestreint: false,

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

describe('ListUsersRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;
  let youlouDoudouUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser(YOLO_DODO);
    youlouDoudouUser = await getAuthUser(YOULOU_DOUDOU);

    databaseService = app.get<DatabaseService>(DatabaseService);

    // reset les données avant de commencer les tests
    await databaseService.db.execute(sql`select test_reset()`);
  });

  afterAll(async () => {
    await app.close();
  });

  test('Un utilisateur ne peut pas accéder à ce service', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      email: 'youlou@doudou.com',
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
      email: 'youlou@doudou.com',
    };
    const userInfoResponse =
      await caller.users.users.getWithRolesAndPermissionsByEmail(input);

    expect(userInfoResponse).toEqual(expectedYoulouDoudouUserInfoResponse);
  });

  test('Un utilisateur peut accéder à ses informations', async () => {
    const caller = router.createCaller({ user: youlouDoudouUser });

    const userInfoResponse = await caller.users.users.get();

    expect(userInfoResponse).toEqual(expectedYoulouDoudouUserInfoResponse);
  });
});
