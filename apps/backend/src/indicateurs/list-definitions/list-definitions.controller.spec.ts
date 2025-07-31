import { ListDefinitionsResponse } from '@/backend/indicateurs/list-definitions/list-definitions.response';
import { getTestApp, signInWith, YOLO_DODO } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe("Api pour lister les définitions d'indicateur", () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';
  });

  test('Liste des définitions & paginations', async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateur-definitions?limit=50`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      count: expect.any(Number),
      pageCount: expect.any(Number),
      pageSize: 50,
      page: 1,
      data: expect.any(Array),
    });

    const responsePage2 = await request(app.getHttpServer())
      .get(`/indicateur-definitions?limit=50&page=2`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    expect(responsePage2.body).toMatchObject({
      count: expect.any(Number),
      pageCount: expect.any(Number),
      pageSize: 50,
      page: 2,
      data: expect.any(Array),
    });
  });

  test('Liste des définitions avec recherche par identifiants', async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateur-definitions?identifiantsReferentiel=cae_2.a,cae_2.k`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const listDefinitionsResponse: ListDefinitionsResponse = response.body;
    expect(listDefinitionsResponse).toMatchObject({
      count: 2,
      pageCount: 1,
      pageSize: expect.any(Number),
      page: 1,
      data: expect.any(Array),
    });

    expect(listDefinitionsResponse.data.length).toBe(2);
    const cae1aDefinition = listDefinitionsResponse.data.find(
      (def) => def.identifiantReferentiel === 'cae_2.a'
    );
    expect(cae1aDefinition).toEqual({
      id: expect.any(Number),
      version: expect.any(String),
      groupementId: null,
      collectiviteId: null,
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
      createdAt: expect.any(String),
      modifiedAt: expect.any(String),
      createdBy: null,
      modifiedBy: null,
      identifiantReferentiel: 'cae_2.a',
      identifiant: 'cae_2.a',
      commentaire: null,
      confidentiel: null,
      favoris: null,
      ficheActions: null,
      categories: expect.any(Array),
      thematiques: expect.any(Array),
      groupementCollectivites: null,
      enfants: expect.any(Array),
      mesures: [
        {
          id: 'cae_1.1.1',
          nom: 'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie',
        },
      ],
      parents: null,
      hasOpenData: false,
      estPerso: false,
      estAgregation: true,
    });

    // Now search by id
    const indicateurIds = listDefinitionsResponse.data
      .map((def) => def.id)
      .join(',');
    const responseById = await request(app.getHttpServer())
      .get(`/indicateur-definitions?indicateurIds=${indicateurIds}`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const listDefinitionsResponseById: ListDefinitionsResponse =
      responseById.body;
    expect(listDefinitionsResponseById).toMatchObject({
      count: 2,
      pageCount: 1,
      pageSize: expect.any(Number),
      page: 1,
      data: expect.any(Array),
    });

    expect(listDefinitionsResponseById.data.length).toBe(2);
    const indicateurIdentifiantsReferentiel = listDefinitionsResponse.data.map(
      (def) => def.identifiantReferentiel
    );
    expect(indicateurIdentifiantsReferentiel).toEqual(['cae_2.a', 'cae_2.k']);
  });

  afterAll(async () => {
    await app.close();
  });
});
