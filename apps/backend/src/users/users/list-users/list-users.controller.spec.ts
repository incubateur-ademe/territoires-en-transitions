import { getTestApp, signInWith, YOLO_DODO } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserInfoResponseType } from './user-info.response';

describe("Api pour lister les permissions de l'utilisateur", () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';
  });

  test("Information de l'utilisateur en anonyme non autorisé", async () => {
    const response = await request(app.getHttpServer())
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

    const userInfoResponse: UserInfoResponseType = response.body;

    expect(userInfoResponse).toEqual({
      userId: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      email: 'yolo@dodo.com',
      nom: 'Dodo',
      prenom: 'Yolo',
      telephone: '0123456789',
      isVerified: true,
      isSupport: false,
      permissions: [
        {
          collectiviteId: 1,
          isActive: true,
          permissionLevel: 'admin',
          collectiviteNom: 'Ambérieu-en-Bugey',
        },
        {
          collectiviteId: 2,
          isActive: true,
          permissionLevel: 'edition',
          collectiviteNom: 'Arbent',
        },
        {
          collectiviteId: 3895,
          isActive: true,
          permissionLevel: 'lecture',
          collectiviteNom: 'CA Annonay Rhône Agglo',
        },
        {
          collectiviteId: 3812,
          isActive: true,
          permissionLevel: 'edition',
          collectiviteNom: 'CA du Bassin de Bourg-en-Bresse',
        },
        {
          collectiviteId: 3829,
          isActive: true,
          permissionLevel: 'edition',
          collectiviteNom: 'CA du Pays de Laon',
        },
        {
          collectiviteId: 4936,
          isActive: true,
          permissionLevel: 'edition',
          collectiviteNom: 'Eurométropole de Strasbourg',
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
