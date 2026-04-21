import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase, signInWith } from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { IndicateurDefinition } from '@tet/domain/indicateurs';
import request from 'supertest';

describe("Api pour lister les définitions d'indicateur", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const db = await getTestDatabase(app);

    const testUserResult = await addTestUser(db);
    const signInResponse = await signInWith({
      email: testUserResult.user.email,
      password: testUserResult.user.password,
    });
    authToken = signInResponse.data.session?.access_token || '';

  });

  afterAll(async () => {
    if (app) await app.close();
  });

  test('Liste des définitions & paginations', async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateurs/definitions`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      count: expect.any(Number),
      data: expect.any(Array),
    });
  });

  test('Liste des définitions avec recherche par identifiants', async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateurs/definitions?identifiantsReferentiel=cae_2.a,cae_2.k`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const listDefinitionsResponse = response.body;
    expect(listDefinitionsResponse).toMatchObject({
      count: 2,
      data: expect.any(Array),
    });

    expect(listDefinitionsResponse.data.length).toBe(2);

    const cae1aDefinition = listDefinitionsResponse.data.find(
      (def: IndicateurDefinition) => def.identifiantReferentiel === 'cae_2.a'
    );

    expect(cae1aDefinition).toEqual({
      id: expect.any(Number),
      version: expect.any(String),
      titre: expect.any(String),
      titreLong: expect.any(String),
      titreCourt: null,
      description: expect.any(String),
      unite: 'GWh',
      precision: 2,
      borneMin: null,
      borneMax: null,
      participationScore: false,
      sansValeurUtilisateur: false,
      valeurCalcule: expect.any(String),
      exprCible: null,
      exprSeuil: null,
      libelleCibleSeuil: null,
      identifiantReferentiel: 'cae_2.a',

      categories: expect.any(Array),
      thematiques: expect.any(Array),
      mesures: [
        {
          id: 'cae_1.1.1',
          nom: 'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie',
        },
      ],
    });

    // Now search by id
    const indicateurIds = listDefinitionsResponse.data
      .map((def: IndicateurDefinition) => def.id)
      .join(',');
    const responseById = await request(app.getHttpServer())
      .get(`/indicateurs/definitions?indicateurIds=${indicateurIds}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const listDefinitionsResponseById = responseById.body;
    expect(listDefinitionsResponseById).toMatchObject({
      count: 2,
      data: expect.any(Array),
    });

    expect(listDefinitionsResponseById.data.length).toBe(2);
    const indicateurIdentifiantsReferentiel = listDefinitionsResponse.data.map(
      (def: IndicateurDefinition) => def.identifiantReferentiel
    );
    expect(indicateurIdentifiantsReferentiel).toEqual(['cae_2.a', 'cae_2.k']);
  });

  test("Liste des définitions d'indicateurs prédéfinis dans la plateforme ne contiennent pas de collectiviteId", async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateurs/definitions`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const listDefinitionsResponse = response.body;
    expect(listDefinitionsResponse).toMatchObject({
      count: expect.any(Number),
      data: expect.any(Array),
    });

    // Vérifier que toutes les définitions n'ont pas de collectiviteId
    listDefinitionsResponse.data.forEach((definition: IndicateurDefinition) => {
      expect(definition.collectiviteId).toBeUndefined();
    });
  });
});
