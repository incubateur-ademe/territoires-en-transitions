import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { UpsertIndicateursValeursRequest } from '@tet/backend/indicateurs/valeurs/upsert-indicateurs-valeurs.request';
import {
  getAuthUserFromUserCredentials,
  getServiceRoleUser,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { GenerateTokenRequest } from '@tet/backend/users/apikeys/generate-token.request';
import { GenerateTokenResponse } from '@tet/backend/users/apikeys/generate-token.response';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { default as request } from 'supertest';

describe('Oauth controller test', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let writeCollectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    const db = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    yoloDodoUser = getAuthUserFromUserCredentials(testResult.user);
    writeCollectiviteId = testResult.collectivite.id;
  });

  test(`Test generate & use token`, async () => {
    const caller = router.createCaller({ user: getServiceRoleUser() });

    const result = await caller.users.apikeys.create({
      userId: yoloDodoUser.id,
    });

    const generateTokenRequest: GenerateTokenRequest = {
      client_id: result.clientId,
      client_secret: result.clientSecret,
      grant_type: 'client_credentials',
    };
    const response = await request(app.getHttpServer())
      .post('/oauth/token')
      .send(generateTokenRequest)
      .expect(201);
    expect(response.body).toMatchObject({
      access_token: expect.any(String),
      token_type: 'Bearer',
      expires_in: expect.any(Number),
    });

    const accessToken = (response.body as GenerateTokenResponse).access_token;

    // Try to write an indicateur with the token on the user's collectivite
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: writeCollectiviteId,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 447868,
        },
      ],
    };
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(indicateurValeurPayload)
      .expect(201);

    // Try to write on a collectivite where the user has no access → 403
    const indicateurValeurForbiddenPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: 3895,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 54086,
        },
      ],
    };
    const forbiddenResponse = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(indicateurValeurForbiddenPayload)
      .expect(403);

    expect(forbiddenResponse.body).toMatchObject({
      error: 'Forbidden',
      statusCode: 403,
    });
    expect(forbiddenResponse.body.message).toMatch(/Droits insuffisants/);

    await caller.users.apikeys.delete({
      clientId: result.clientId,
    });
  });

  test(`Test generate token with invalid api key`, async () => {
    const caller = router.createCaller({ user: getServiceRoleUser() });

    const result = await caller.users.apikeys.create({
      userId: yoloDodoUser.id,
    });

    const generateTokenRequest: GenerateTokenRequest = {
      client_id: result.clientId,
      client_secret: result.clientSecret.substring(
        0,
        result.clientSecret.length - 2
      ),
      grant_type: 'client_credentials',
    };
    await request(app.getHttpServer())
      .post('/oauth/token')
      .send(generateTokenRequest)
      .expect(401)
      .expect({
        message: 'Invalid client secret',
        error: 'Unauthorized',
        statusCode: 401,
      });

    await caller.users.apikeys.delete({
      clientId: result.clientId,
    });
  });

  test(`Test generate & use limited token`, async () => {
    const caller = router.createCaller({ user: getServiceRoleUser() });

    const result = await caller.users.apikeys.create({
      userId: yoloDodoUser.id,
      permissions: [
        'indicateurs.indicateurs.read_confidentiel',
        'indicateurs.indicateurs.read',
        'indicateurs.valeurs.read_confidentiel',
        'indicateurs.valeurs.read',
      ],
    });

    const generateTokenRequest: GenerateTokenRequest = {
      client_id: result.clientId,
      client_secret: result.clientSecret,
      grant_type: 'client_credentials',
    };
    const response = await request(app.getHttpServer())
      .post('/oauth/token')
      .send(generateTokenRequest)
      .expect(201);
    expect(response.body).toMatchObject({
      access_token: expect.any(String),
      token_type: 'Bearer',
      expires_in: expect.any(Number),
    });

    const accessToken = (response.body as GenerateTokenResponse).access_token;

    // Try to write an indicateur with the token
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: 4936,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 447868,
        },
      ],
    };
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(indicateurValeurPayload)
      .expect(403)
      .expect({
        message:
          "Droits insuffisants, la clé d'api n'a pas l'autorisation indicateurs.valeurs.mutate.",
        error: 'Forbidden',
        statusCode: 403,
      });

    const readResponse = await request(app.getHttpServer())
      .get('/indicateurs/valeurs?collectiviteId=4936&indicateurIds=4')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(readResponse.body).toMatchObject({
      count: expect.any(Number),
      indicateurs: expect.any(Array),
    });

    await caller.users.apikeys.delete({
      clientId: result.clientId,
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
