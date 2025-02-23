import { NiveauAcces } from '@/backend/auth/authorizations/roles/niveau-acces.enum';
import { UserInfoResponseType } from '@/backend/auth/users/user-info.response';
import { INestApplication } from '@nestjs/common';
import { inferProcedureInput } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { getTestApp } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { YOLO_DODO } from '../../../test/test-users.samples';
import { DatabaseService } from '../../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import {
  AuthenticatedUser,
  AuthJwtPayload,
  AuthRole,
  AuthUser,
} from '../models/auth.models';

type Input = inferProcedureInput<AppRouter['utilisateurs']['get']>;

describe('UserRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser(YOLO_DODO);

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
    await expect(() => caller.utilisateurs.get(input)).rejects.toThrowError(
      /Uniquement accessible pour les comptes de service/i
    );
  });

  test('Utilisation avec un compte de service', async () => {
    const serviceAccountUser: AuthUser = {
      id: null,
      role: AuthRole.SERVICE_ROLE,
      isAnonymous: true,
      jwtToken: {} as AuthJwtPayload<AuthRole.SERVICE_ROLE>,
    };
    const caller = router.createCaller({ user: serviceAccountUser });

    const input: Input = {
      email: 'youlou@doudou.com',
    };

    const userInfoResponse = await caller.utilisateurs.get(input);

    const expectedUserInfoResponse: UserInfoResponseType = {
      userId: '5f407fc6-3634-45ff-a988-301e9088096a',
      email: 'youlou@doudou.com',
      nom: 'Doudou',
      prenom: 'Youlou',
      support: false,
      telephone: null,
      verifie: true,
      droits: [
        {
          active: true,
          collectiviteId: 1,
          niveauAcces: NiveauAcces.EDITION,
        },
        {
          active: true,
          collectiviteId: 2,
          niveauAcces: NiveauAcces.EDITION,
        },
      ],
    };
    expect(userInfoResponse.user).toEqual(expectedUserInfoResponse);
  });
});
