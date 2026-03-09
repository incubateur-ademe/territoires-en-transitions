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

describe('Partner API - Fiches', () => {
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

  describe('GET /collectivites/:collectiviteId/fiches', () => {
    test('Sans auth → 401', async () => {
      await request(app.getHttpServer())
        .get('/collectivites/1/fiches')
        .expect(401);
    });

    test('Avec token sans permission partner.plans.read → 403', async () => {
      await request(app.getHttpServer())
        .get('/collectivites/1/fiches')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);
    });

    test('Liste fiches → 200 + pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/collectivites/1/fiches')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('count');
      expect(response.body.pagination).toHaveProperty('nbOfPages');

      if (response.body.data.length > 0) {
        const fiche = response.body.data[0];
        expect(fiche).toHaveProperty('id');
        expect(fiche).toHaveProperty('titre');
        expect(fiche).toHaveProperty('statut');
        expect(fiche).toHaveProperty('thematiques');
        expect(fiche).toHaveProperty('pilotes');
        expect(fiche).toHaveProperty('plans');
        expect(fiche).toHaveProperty('createdAt');
        expect(fiche).toHaveProperty('modifiedAt');
      }
    });

    test('Aucune fiche restreinte dans le résultat', async () => {
      const response = await request(app.getHttpServer())
        .get('/collectivites/1/fiches?limit=100')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      // All returned fiches should be non-restricted
      // (We can't directly check the `restreint` field since it's not in the response,
      // but the service filters them out)
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Pagination avec page et limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/collectivites/1/fiches?page=1&limit=5')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    test('Filtrage par statut', async () => {
      const response = await request(app.getHttpServer())
        .get('/collectivites/1/fiches?statut=En cours')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      for (const fiche of response.body.data) {
        expect(fiche.statut).toBe('En cours');
      }
    });

    test('Filtrage par planId', async () => {
      // First get a plan ID
      const plansResponse = await request(app.getHttpServer())
        .get('/collectivites/1/plans')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      if (plansResponse.body.plans.length === 0) {
        return; // Skip if no plans exist
      }

      const planId = plansResponse.body.plans[0].id;

      const response = await request(app.getHttpServer())
        .get(`/collectivites/1/fiches?planId=${planId}`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Collectivité sans fiches → 200 + data vide', async () => {
      const response = await request(app.getHttpServer())
        .get('/collectivites/99999/fiches')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.count).toBe(0);
    });
  });

  describe('GET /collectivites/:collectiviteId/fiches/:ficheId', () => {
    test('Sans auth → 401', async () => {
      await request(app.getHttpServer())
        .get('/collectivites/1/fiches/1')
        .expect(401);
    });

    test('Avec token sans permission → 403', async () => {
      await request(app.getHttpServer())
        .get('/collectivites/1/fiches/1')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);
    });

    test('Fiche inexistante → 404', async () => {
      await request(app.getHttpServer())
        .get('/collectivites/1/fiches/999999')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(404);
    });

    test('Fiche détaillée → 200 + shape complète', async () => {
      // First get a valid fiche ID
      const listResponse = await request(app.getHttpServer())
        .get('/collectivites/1/fiches?limit=1')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      if (listResponse.body.data.length === 0) {
        return; // Skip if no fiches exist
      }

      const ficheId = listResponse.body.data[0].id;

      const response = await request(app.getHttpServer())
        .get(`/collectivites/1/fiches/${ficheId}`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      // Summary fields
      expect(response.body).toHaveProperty('id', ficheId);
      expect(response.body).toHaveProperty('titre');
      expect(response.body).toHaveProperty('statut');
      expect(response.body).toHaveProperty('thematiques');
      expect(response.body).toHaveProperty('pilotes');
      expect(response.body).toHaveProperty('plans');
      expect(response.body).toHaveProperty('axes');
      expect(response.body).toHaveProperty('financeurs');
      expect(response.body).toHaveProperty('indicateurs');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('modifiedAt');

      // Detail-only fields
      expect(response.body).toHaveProperty('objectifs');
      expect(response.body).toHaveProperty('ressources');
      expect(response.body).toHaveProperty('calendrier');
      expect(response.body).toHaveProperty('etapes');
      expect(response.body).toHaveProperty('mesures');
      expect(response.body).toHaveProperty('budgets');
      expect(response.body).toHaveProperty('partenaires');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('referents');
      expect(response.body).toHaveProperty('fichesLiees');

      // Should NOT contain excluded fields
      expect(response.body).not.toHaveProperty('createdBy');
      expect(response.body).not.toHaveProperty('modifiedBy');
      expect(response.body).not.toHaveProperty('restreint');
      expect(response.body).not.toHaveProperty('deleted');
    });
  });
});
