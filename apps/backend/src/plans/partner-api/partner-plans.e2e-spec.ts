import { INestApplication } from '@nestjs/common';
import {
  getAuthUser,
  getServiceRoleUser,
  getTestApp,
} from '@tet/backend/test';
import { GenerateTokenRequest } from '@tet/backend/users/apikeys/generate-token.request';
import { GenerateTokenResponse } from '@tet/backend/users/apikeys/generate-token.response';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { default as request } from 'supertest';

describe('Partner API - Plans', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let partnerToken: string;
  let limitedToken: string;
  let apiKeyClientId: string;
  let limitedApiKeyClientId: string;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser();

    const caller = router.createCaller({ user: getServiceRoleUser() });

    // Create API key with partner.plans.read permission
    const apiKey = await caller.users.apikeys.create({
      userId: yoloDodoUser.id,
      permissions: ['partner.plans.read'],
    });
    apiKeyClientId = apiKey.clientId;

    const tokenResponse = await request(app.getHttpServer())
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: apiKey.clientId,
        client_secret: apiKey.clientSecret,
      } satisfies GenerateTokenRequest)
      .expect(201);

    partnerToken = (tokenResponse.body as GenerateTokenResponse).access_token;

    // Create API key WITHOUT partner.plans.read permission
    const limitedApiKey = await caller.users.apikeys.create({
      userId: yoloDodoUser.id,
      permissions: ['indicateurs.valeurs.read'],
    });
    limitedApiKeyClientId = limitedApiKey.clientId;

    const limitedTokenResponse = await request(app.getHttpServer())
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: limitedApiKey.clientId,
        client_secret: limitedApiKey.clientSecret,
      } satisfies GenerateTokenRequest)
      .expect(201);

    limitedToken = (limitedTokenResponse.body as GenerateTokenResponse)
      .access_token;
  });

  afterAll(async () => {
    const caller = router.createCaller({ user: getServiceRoleUser() });
    await caller.users.apikeys.delete({ clientId: apiKeyClientId });
    await caller.users.apikeys.delete({ clientId: limitedApiKeyClientId });
    await app.close();
  });

  describe('GET /collectivites/:collectiviteId/plans', () => {
    test('Sans auth → 401', async () => {
      await request(app.getHttpServer())
        .get('/collectivites/1/plans')
        .expect(401);
    });

    test('Avec token sans permission partner.plans.read → 403', async () => {
      await request(app.getHttpServer())
        .get('/collectivites/1/plans')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);
    });

    test('Liste plans → 200 + shape correcte', async () => {
      const response = await request(app.getHttpServer())
        .get('/collectivites/1/plans')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);

      if (response.body.plans.length > 0) {
        const plan = response.body.plans[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('nom');
        expect(plan).toHaveProperty('collectiviteId');
        expect(plan).toHaveProperty('nbAxes');
        expect(plan).toHaveProperty('nbFiches');
        expect(plan).toHaveProperty('createdAt');
        expect(plan).toHaveProperty('modifiedAt');
      }
    });

    test('Collectivité sans plans → 200 + plans vide', async () => {
      // Use a collectivite that likely has no plans (high ID)
      const response = await request(app.getHttpServer())
        .get('/collectivites/99999/plans')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      expect(response.body).toEqual({ plans: [] });
    });
  });

  describe('GET /collectivites/:collectiviteId/plans/:planId', () => {
    test('Sans auth → 401', async () => {
      await request(app.getHttpServer())
        .get('/collectivites/1/plans/1')
        .expect(401);
    });

    test('Avec token sans permission → 403', async () => {
      await request(app.getHttpServer())
        .get('/collectivites/1/plans/1')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);
    });

    test('Plan inexistant → 404', async () => {
      await request(app.getHttpServer())
        .get('/collectivites/1/plans/999999')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(404);
    });

    test('Plan hors collectivité → 404', async () => {
      // Get a real plan from collectivite 1
      const listResponse = await request(app.getHttpServer())
        .get('/collectivites/1/plans')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      if (listResponse.body.plans.length === 0) return;

      const planId = listResponse.body.plans[0].id;

      // Same plan should not be accessible via a different collectivite
      await request(app.getHttpServer())
        .get(`/collectivites/99999/plans/${planId}`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(404);
    });

    test('Plan détaillé avec arbre → 200 + shape correcte', async () => {
      // First get a valid plan ID
      const listResponse = await request(app.getHttpServer())
        .get('/collectivites/1/plans')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      if (listResponse.body.plans.length === 0) {
        // Skip if no plans exist
        return;
      }

      const planId = listResponse.body.plans[0].id;

      const response = await request(app.getHttpServer())
        .get(`/collectivites/1/plans/${planId}`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', planId);
      expect(response.body).toHaveProperty('nom');
      expect(response.body).toHaveProperty('collectiviteId', 1);
      expect(response.body).toHaveProperty('ficheIds');
      expect(Array.isArray(response.body.ficheIds)).toBe(true);
      expect(response.body).toHaveProperty('axes');
      expect(Array.isArray(response.body.axes)).toBe(true);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('modifiedAt');
    });
  });
});
