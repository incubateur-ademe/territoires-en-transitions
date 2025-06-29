import { ListCollectiviteApiResponse } from '@/backend/collectivites/list-collectivites/list-collectivites.api-response';
import {
  getTestApp,
  ISO_8601_DATE_TIME_REGEX,
  signInWith,
  YOLO_DODO,
} from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('Api pour lister les collectivités', () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';
  });

  test('Liste des collectivités & paginations', async () => {
    const response = await request(app.getHttpServer())
      .get(`/collectivites?limit=50`)
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
      .get(`/collectivites?limit=50&page=2`)
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

  test('Liste des collectivites avec recherche par siren', async () => {
    const response = await request(app.getHttpServer())
      .get(`/collectivites?siren=200043495`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const listCollectivitesResponse: ListCollectiviteApiResponse =
      response.body;
    expect(listCollectivitesResponse).toMatchObject({
      count: 1,
      pageCount: 1,
      pageSize: expect.any(Number),
      page: 1,
      data: expect.any(Array),
    });

    expect(listCollectivitesResponse.data.length).toBe(1);
    expect(listCollectivitesResponse.data[0]).toMatchObject({
      id: expect.any(Number),
      modifiedAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      createdAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      nom: 'CA du Pays de Laon',
      type: 'epci',
      communeCode: null,
      siren: '200043495',
      nic: null,
      departementCode: '02',
      regionCode: '32',
      natureInsee: 'CA',
      population: expect.any(Number),
    });
  });

  test('Liste des collectivites avec recherche par communeCode', async () => {
    const response = await request(app.getHttpServer())
      .get(`/collectivites?communeCode=97132`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const listCollectivitesResponse: ListCollectiviteApiResponse =
      response.body;
    expect(listCollectivitesResponse).toMatchObject({
      count: 1,
      pageCount: 1,
      pageSize: expect.any(Number),
      page: 1,
      data: expect.any(Array),
    });

    expect(listCollectivitesResponse.data.length).toBe(1);
    expect(listCollectivitesResponse.data[0]).toMatchObject({
      id: expect.any(Number),
      modifiedAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      createdAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      nom: 'Trois-Rivières',
      type: 'commune',
      communeCode: '97132',
      siren: null,
      nic: null,
      departementCode: '971',
      regionCode: '01',
      natureInsee: null,
      population: expect.any(Number),
    });
  });

  test('Liste des collectivites avec recherche par texte', async () => {
    const response = await request(app.getHttpServer())
      .get(`/collectivites?text=rivieres`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const listCollectivitesResponse: ListCollectiviteApiResponse =
      response.body;
    expect(listCollectivitesResponse).toMatchObject({
      count: expect.any(Number),
      pageCount: expect.any(Number),
      pageSize: expect.any(Number),
      page: 1,
      data: expect.any(Array),
    });

    expect(listCollectivitesResponse.data.length).toBeGreaterThan(0);

    const troisRivieresCollectivite = listCollectivitesResponse.data.find(
      (collectivite) => collectivite.nom === 'Trois-Rivières'
    );
    expect(troisRivieresCollectivite).toMatchObject({
      id: expect.any(Number),
      modifiedAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      createdAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      nom: 'Trois-Rivières',
      type: 'commune',
      communeCode: '97132',
      siren: null,
      nic: null,
      departementCode: '971',
      regionCode: '01',
      natureInsee: null,
      population: expect.any(Number),
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
