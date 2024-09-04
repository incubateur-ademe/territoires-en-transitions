import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { GetActionStatutsResponseType } from '../../src/referentiels/models/get-action-statuts.response';
import { GetReferentielScoresResponseType } from '../../src/referentiels/models/get-referentiel-scores.response';
import { getYoloDodoToken } from '../auth/auth-utils';
import { getTestApp } from '../common/app-utils';

describe('Referentiels scoring routes', () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getYoloDodoToken();
  });

  it(`Récupération des statuts des actions sans token non autorisée`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/action-statuts')
      .expect(401);
  });

  it(`Récupération anonyme des statuts des actions`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/action-statuts')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const actionStatuts = response.body as GetActionStatutsResponseType;
    expect(Object.keys(actionStatuts).length).toBe(2);
    expect(actionStatuts['cae_1.1.1.1.1']).toEqual({
      collectivite_id: 1,
      action_id: 'cae_1.1.1.1.1',
      avancement: 'fait',
      avancement_detaille: [1, 0, 0],
      concerne: true,
      modified_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      modified_at: '2020-01-01 00:00:01+00',
    });
  });

  it(`Récupération anonyme des statuts des actions pour une collectivite inconnue`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/10000000/referentiels/cae/action-statuts')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(404)
      .expect({
        message:
          "Commune avec l'identifiant de collectivite 10000000 introuvable",
        error: 'Not Found',
        statusCode: 404,
      });
  });

  it(`Récupération anonyme des statuts des actions d'un référentiel inconnu`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/inconnu/action-statuts')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(404)
      .expect({
        message: 'Referentiel inconnu not found',
        error: 'Not Found',
        statusCode: 404,
      });
  });

  it(`Récupération anonyme des historiques de statuts des actions non autorisé`, async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/collectivites/1/referentiels/cae/action-statuts?date=2020-01-02T00:00:01Z'
      )
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(401);
  });

  it(`Récupération des historiques de statuts des actions pour un utilisateur autorisé`, async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/collectivites/1/referentiels/cae/action-statuts?date=2020-01-02T00:00:01Z'
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const actionStatuts = response.body as GetActionStatutsResponseType;
    expect(Object.keys(actionStatuts).length).toBe(1);
    expect(actionStatuts['cae_1.1.1.1.1']).toEqual({
      collectivite_id: 1,
      action_id: 'cae_1.1.1.1.1',
      avancement: 'fait',
      avancement_detaille: [1, 0, 0],
      concerne: true,
      modified_at: '2020-01-01 00:00:01+00',
      modified_by: null,
      previous_avancement: null,
      previous_avancement_detaille: null,
      previous_concerne: null,
      previous_modified_at: null,
      previous_modified_by: null,
    });
  });

  it(`Récupération du score d'un référentiel sans token non autorisée`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores')
      .expect(401);
  });

  it(`Récupération anonyme du score d'un référentiel`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const referentielScores = response.body as GetReferentielScoresResponseType;
    const { actions_enfant, ...referentielScoreWithoutActionsEnfant } =
      referentielScores.scores;
    expect(actions_enfant.length).toBe(6);
    expect(referentielScoreWithoutActionsEnfant).toEqual({
      action_id: 'cae',
      nom: 'Climat Air Énergie',
      points: 500,
      pourcentage: null,
      level: 0,
      action_type: 'referentiel',
      score: {
        action_id: 'cae',
        point_referentiel: 500,
        point_potentiel: 490.9,
        point_potentiel_perso: null,
        point_fait: 0.36,
        point_pas_fait: 0.03,
        point_non_renseigne: 490.3,
        point_programme: 0.21,
        concerne: true,
        completed_taches_count: 2,
        total_taches_count: 1120,
        fait_taches_avancement: 1.2,
        programme_taches_avancement: 0.7,
        pas_fait_taches_avancement: 0.1,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        renseigne: false,
      },
    });
  });

  it(`Récupération anonyme du score d'un référentiel pour une collectivite inconnue`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/10000000/referentiels/cae/scores')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(404)
      .expect({
        message:
          "Commune avec l'identifiant de collectivite 10000000 introuvable",
        error: 'Not Found',
        statusCode: 404,
      });
  });

  it(`Récupération anonyme du score d'un référentiel inconnu`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/inconnu/scores')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(404)
      .expect({
        message: 'Referentiel inconnu not found',
        error: 'Not Found',
        statusCode: 404,
      });
  });

  it(`Récupération anonyme de l'historique du score d'un référentiel non autorisée`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores?date=2019-01-01T00:00:01Z')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(401);
  });

  it(`Récupération de l'historique du score d'un référentiel pour un utilisateur autorisé`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores?date=2019-01-01T00:00:01Z')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const referentielScores = response.body as GetReferentielScoresResponseType;
    const { actions_enfant, ...referentielScoreWithoutActionsEnfant } =
      referentielScores.scores;
    expect(referentielScores.date).toBe('2019-01-01T00:00:01Z');
    expect(actions_enfant.length).toBe(6);
    expect(referentielScoreWithoutActionsEnfant).toEqual({
      action_id: 'cae',
      nom: 'Climat Air Énergie',
      points: 500,
      pourcentage: null,
      level: 0,
      action_type: 'referentiel',
      score: {
        action_id: 'cae',
        point_referentiel: 500,
        point_potentiel: 496.5,
        point_potentiel_perso: null,
        point_fait: 0,
        point_pas_fait: 0,
        point_non_renseigne: 496.5,
        point_programme: 0,
        concerne: true,
        completed_taches_count: 0,
        total_taches_count: 1120,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        renseigne: false,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
