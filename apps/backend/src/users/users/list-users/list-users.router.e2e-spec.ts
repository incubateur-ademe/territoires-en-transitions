import { PermissionLevelEnum } from '@/backend/users/authorizations/roles/permission-level.enum';
import { INestApplication } from '@nestjs/common';
import { inferProcedureInput } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { getTestApp } from '../../../../test/app-utils';
import { getAuthUser, getServiceRoleUser } from '../../../../test/auth-utils';
import { YOLO_DODO, YOULOU_DOUDOU } from '../../../../test/test-users.samples';
import { DatabaseService } from '../../../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';
import { permissionsByRole } from '../../authorizations/permission.models';
import { AuditRole } from '../../index-domain';
import { AuthenticatedUser } from '../../models/auth.models';
import { UserInfoResponseType } from './user-info.response';

type Input = inferProcedureInput<AppRouter['users']['get']>;

const expectedYoulouDoudouUserInfoResponse: UserInfoResponseType = {
  id: '5f407fc6-3634-45ff-a988-301e9088096a',
  email: 'youlou@doudou.com',
  nom: 'Doudou',
  prenom: 'Youlou',
  telephone: null,
  isSupport: false,
  isVerified: true,
  collectivites: [
    {
      collectiviteId: 1,
      nom: 'Ambérieu-en-Bugey',
      permissionLevel: PermissionLevelEnum.EDITION,
      permissions: [
        ...new Set([
          ...permissionsByRole[PermissionLevelEnum.EDITION],
          ...permissionsByRole[AuditRole.AUDITEUR],
        ]),
      ],
      accesRestreint: false,
      isRoleAuditeur: true,
      isReadOnly: false,
    },
    {
      collectiviteId: 2,
      nom: 'Arbent',
      accesRestreint: false,
      permissionLevel: PermissionLevelEnum.EDITION,
      permissions: permissionsByRole[PermissionLevelEnum.EDITION],
      isRoleAuditeur: false,
      isReadOnly: false,
    },
    {
      collectiviteId: 10,
      nom: 'La Boisse',
      accesRestreint: false,
      permissionLevel: undefined,
      permissions: permissionsByRole[AuditRole.AUDITEUR],
      isRoleAuditeur: true,
      isReadOnly: true,
    },
  ],
};

describe('UserRouter', () => {
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
    await expect(() => caller.users.get(input)).rejects.toThrowError(
      /Not service role/i
    );
  });

  test('Utilisation avec un compte de service', async () => {
    const serviceAccountUser = getServiceRoleUser();
    const caller = router.createCaller({ user: serviceAccountUser });

    const input: Input = {
      email: 'youlou@doudou.com',
    };
    const userInfoResponse = await caller.users.get(input);

    expect(userInfoResponse?.user).toEqual(
      expectedYoulouDoudouUserInfoResponse
    );
  });

  test('Un utilisateur peut accéder à ses informations', async () => {
    const caller = router.createCaller({ user: youlouDoudouUser });

    const userInfoResponse = await caller.users.getDetails();

    expect(userInfoResponse?.user).toEqual(
      expectedYoulouDoudouUserInfoResponse
    );
  });
});
