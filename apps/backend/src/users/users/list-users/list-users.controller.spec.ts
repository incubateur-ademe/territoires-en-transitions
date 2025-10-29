import { getTestApp, signInWith, YOLO_DODO } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { permissionsByRole } from '../../authorizations/permission.models';
import { CollectiviteAccessLevelEnum } from '../../authorizations/roles/collectivite-access-level.enum';
import { UserWithCollectiviteAccesses } from './user-with-collectivite-accesses.dto';

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

    const userInfoResponse: UserWithCollectiviteAccesses = response.body;

    expect(userInfoResponse).toMatchObject({
      id: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      email: 'yolo@dodo.com',
      nom: 'Dodo',
      prenom: 'Yolo',
      telephone: '0123456789',
      isVerified: true,
      isSupport: false,
      collectivites: [
        {
          collectiviteId: 1,
          nom: 'Ambérieu-en-Bugey',
          niveauAcces: 'admin',
          permissions: permissionsByRole[CollectiviteAccessLevelEnum.ADMIN],
          accesRestreint: false,
          isRoleAuditeur: false,
          isReadOnly: false,
        },
        {
          collectiviteId: 2,
          nom: 'Arbent',
          niveauAcces: 'edition',
          permissions: permissionsByRole[CollectiviteAccessLevelEnum.EDITION],
          accesRestreint: false,
          isRoleAuditeur: false,
          isReadOnly: false,
        },
        {
          collectiviteId: 3895,
          nom: 'CA Annonay Rhône Agglo',
          niveauAcces: 'lecture',
          permissions: permissionsByRole[CollectiviteAccessLevelEnum.LECTURE],
          accesRestreint: false,
          isRoleAuditeur: false,
          isReadOnly: true,
        },
        {
          collectiviteId: 3812,
          nom: 'CA du Bassin de Bourg-en-Bresse',
          niveauAcces: 'edition',
          permissions: permissionsByRole[CollectiviteAccessLevelEnum.EDITION],
          accesRestreint: false,
          isRoleAuditeur: false,
          isReadOnly: false,
        },
        {
          collectiviteId: 3829,
          nom: 'CA du Pays de Laon',
          niveauAcces: 'edition',
          permissions: permissionsByRole[CollectiviteAccessLevelEnum.EDITION],
          accesRestreint: false,
          isRoleAuditeur: false,
          isReadOnly: false,
        },
        {
          collectiviteId: 4936,
          nom: 'Eurométropole de Strasbourg',
          niveauAcces: 'edition',
          permissions: permissionsByRole[CollectiviteAccessLevelEnum.EDITION],
          accesRestreint: false,
          isRoleAuditeur: false,
          isReadOnly: false,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
