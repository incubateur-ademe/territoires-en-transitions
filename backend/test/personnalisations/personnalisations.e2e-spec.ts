import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { GetPersonnalitionConsequencesResponseType } from '../../src/personnalisations/models/get-personnalisation-consequences.response';
import { GetPersonnalisationReglesResponseType } from '../../src/personnalisations/models/get-personnalisation-regles.response';
import { getYoloDodoToken } from '../auth/auth-utils';
import { getTestApp } from '../common/app-utils';

describe('Personnalisations routes', () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getYoloDodoToken();
  });

  it(`Récupération publique des règles`, async () => {
    const response = await request(app.getHttpServer())
      .get('/personnalisations/regles')
      .expect(200);
    expect(
      (response.body as GetPersonnalisationReglesResponseType).regles.length
    ).toBeGreaterThan(0);
  });

  it(`Récupération publique des règles avec filtre sur le référentiel`, async () => {
    const response = await request(app.getHttpServer())
      .get('/personnalisations/regles?referentiel=cae')
      .expect(200);
    const getPersonnalisationregles =
      response.body as GetPersonnalisationReglesResponseType;
    const caeRegles = getPersonnalisationregles.regles.filter((regle) =>
      regle.action_id.startsWith('cae')
    );
    expect(getPersonnalisationregles.regles.length).toBe(caeRegles.length);
  });

  it(`Récupération publique des règles avec référentiel invalide`, async () => {
    const response = await request(app.getHttpServer())
      .get('/personnalisations/regles?referentiel=invalid')
      .expect(400);
    expect(
      response.body.message[0].startsWith('referentiel: Invalid enum value.')
    ).toBe(true);
  });

  it(`Récupération des réponses courantes d'une collectivité sans token`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/personnalisations/reponses')
      .expect(401);
  });

  it(`Récupération des réponses courantes d'une collectivité avec token anonyme`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/personnalisations/reponses')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200)
      .expect({ EP_1: 'EP_1_b', dechets_1: true, habitat_2: 0.8 });
  });

  it(`Récupération des réponses historiques d'une collectivité avec token anonyme`, async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/collectivites/1/personnalisations/reponses?date=2020-01-02T00:00:00Z'
      )
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(401);
  });

  it(`Récupération des réponses historiques d'une collectivité avec date invalide`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/personnalisations/reponses?date=2020-01-02T00:')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(400)
      .expect({
        message: ['date: Invalid datetime'],
        error: 'Bad Request',
        statusCode: 400,
      });
  });

  it(`Récupération des réponses historiques d'une collectivité avec utilisateur autorisé`, async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/collectivites/1/personnalisations/reponses?date=2020-01-02T00:00:00Z'
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .expect({ EP_1: 'EP_1_a', dechets_1: false, habitat_2: 0.7 });
  });

  it(`Récupération des conséquences de personnalisation d'une collectivité sans token`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/personnalisations/consequences')
      .expect(401);
  });

  it(`Récupération des conséquences de personnalisation d'une collectivité avec utilisateur autorisé`, async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/collectivites/1/personnalisations/consequences?date=2020-01-02T00:00:00Z'
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const getPersonnalisationConsequences: GetPersonnalitionConsequencesResponseType =
      response.body;

    // Do not check the whole response, just a few values
    expect(getPersonnalisationConsequences['eci_3.7.1']).toEqual({
      desactive: null,
      score_formule: null,
      potentiel_perso: 3,
    });
    expect(getPersonnalisationConsequences['eci_4.2.1']).toEqual({
      desactive: true,
      score_formule: null,
      potentiel_perso: null,
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
