import { INestApplication } from '@nestjs/common';
import { getTestApp, signInWith, YOLO_DODO } from '@tet/backend/test';
import { IndicateurDefinition } from '@tet/domain/indicateurs';
import request from 'supertest';

describe("Api pour lister les définitions d'indicateur", () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';
  });

  afterAll(async () => {
    await app.close();
  });

  test('Liste des définitions & paginations', async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateurs/definitions`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      count: expect.any(Number),
      data: expect.any(Array),
    });
  });

  test('Liste des définitions avec recherche par identifiants', async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateurs/definitions?identifiantsReferentiel=cae_2.a,cae_2.k`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
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
      .set('Authorization', `Bearer ${yoloDodoToken}`)
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
      .set('Authorization', `Bearer ${yoloDodoToken}`)
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
