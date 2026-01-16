import { INestApplication } from '@nestjs/common';
import { getTestApp, signInWith, YOLO_DODO } from '@tet/backend/test';
import {
  CollectiviteRole,
  permissionsByRole,
  PlatformRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import request from 'supertest';

describe("Api pour lister les permissions de l'utilisateur", () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';
  });

  test("Information de l'utilisateur en anonyme non autorisé", async () => {
    await request(app.getHttpServer())
      .get(`/utilisateur`)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(401)
      .expect({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Anonymous user is not allowed',
      });
  });

  test("Information de l'utilisateur y compris ses permissions", async () => {
    const response = await request(app.getHttpServer())
      .get(`/utilisateur`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const userInfoResponse: UserWithRolesAndPermissions = response.body;

    expect(userInfoResponse).toEqual({
      id: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      email: 'yolo@dodo.com',
      nom: 'Dodo',
      prenom: 'Yolo',
      telephone: '0123456789',
      cguAccepteesLe: expect.any(String),

      roles: [PlatformRole.CONNECTED, PlatformRole.VERIFIED],
      permissions: [
        ...permissionsByRole[PlatformRole.CONNECTED],
        ...permissionsByRole[PlatformRole.VERIFIED],
      ],

      collectivites: [
        {
          collectiviteId: 1,
          collectiviteNom: 'Ambérieu-en-Bugey',
          collectiviteAccesRestreint: false,
          role: CollectiviteRole.ADMIN,
          permissions: permissionsByRole[CollectiviteRole.ADMIN],

          audits: [],
        },
        {
          collectiviteId: 2,
          collectiviteNom: 'Arbent',
          collectiviteAccesRestreint: false,
          role: CollectiviteRole.EDITION,
          permissions: permissionsByRole[CollectiviteRole.EDITION],

          audits: [],
        },
        {
          collectiviteId: 3895,
          collectiviteNom: 'CA Annonay Rhône Agglo',
          collectiviteAccesRestreint: false,
          role: CollectiviteRole.LECTURE,
          permissions: permissionsByRole[CollectiviteRole.LECTURE],

          audits: [],
        },
        {
          collectiviteId: 3812,
          collectiviteNom: 'CA du Bassin de Bourg-en-Bresse',
          collectiviteAccesRestreint: false,
          role: CollectiviteRole.EDITION,
          permissions: permissionsByRole[CollectiviteRole.EDITION],

          audits: [],
        },
        {
          collectiviteId: 3829,
          collectiviteNom: 'CA du Pays de Laon',
          collectiviteAccesRestreint: false,
          role: CollectiviteRole.EDITION,
          permissions: permissionsByRole[CollectiviteRole.EDITION],

          audits: [],
        },
        {
          collectiviteId: 4936,
          collectiviteNom: 'Eurométropole de Strasbourg',
          collectiviteAccesRestreint: false,
          role: CollectiviteRole.EDITION,
          permissions: permissionsByRole[CollectiviteRole.EDITION],

          audits: [],
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
