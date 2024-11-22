import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { getYoloDodoToken } from '../auth/auth-utils';
import { getTestApp } from '../common/app-utils';
import { GetActionStatutsResponseType } from '../../src/referentiels/models/get-action-statuts.response';
import { ReferentielActionWithScoreType } from '../../src/referentiels/models/referentiel-action-avec-score.dto';
import { GetReferentielScoresResponseType } from '../../src/referentiels/models/get-referentiel-scores.response';
import { ActionType } from '../../src/referentiels/models/action-type.enum';
import { ActionStatutType } from '../../src/referentiels/models/action-statut.table';
import { HistoriqueActionStatutType } from '../../src/referentiels/models/historique-action-statut.table';

describe('Referentiels scoring routes', () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getYoloDodoToken();
  });

  it(`Récupération des statuts des actions sans token non autorisée`, async () => {
    await request(app.getHttpServer())
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
    const expectedActionStatut: ActionStatutType = {
      collectiviteId: 1,
      actionId: 'cae_1.1.1.1.1',
      avancement: 'fait',
      avancementDetaille: [1, 0, 0],
      concerne: true,
      modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      modifiedAt: '2020-01-01 00:00:01+00',
    };
    expect(actionStatuts['cae_1.1.1.1.1']).toEqual(expectedActionStatut);
  });

  it(`Récupération anonyme des statuts des actions pour une collectivite inconnue`, async () => {
    await request(app.getHttpServer())
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
    await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/inconnu/action-statuts')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(404)
      .expect({
        message: 'Referentiel definition inconnu not found',
        error: 'Not Found',
        statusCode: 404,
      });
  });

  it(`Récupération anonyme des historiques de statuts des actions non autorisé`, async () => {
    await request(app.getHttpServer())
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

    const expectedActionStatut: HistoriqueActionStatutType = {
      collectiviteId: 1,
      actionId: 'cae_1.1.1.1.1',
      avancement: 'fait',
      avancementDetaille: [1, 0, 0],
      concerne: true,
      modifiedAt: '2020-01-01 00:00:01+00',
      modifiedBy: null,
      previousAvancement: null,
      previousAvancementDetaille: null,
      previousConcerne: null,
      previousModifiedAt: null,
      previousModifiedBy: null,
    };
    expect(actionStatuts['cae_1.1.1.1.1']).toEqual(expectedActionStatut);
  });

  it(`Récupération du score d'un référentiel sans token non autorisée`, async () => {
    await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores')
      .expect(401);
  });

  it(`Récupération anonyme du score d'un référentiel`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const referentielScores = response.body as GetReferentielScoresResponseType;
    const { actionsEnfant, ...referentielScoreWithoutActionsEnfant } =
      referentielScores.scores;
    expect(actionsEnfant.length).toBe(6);
    const {
      actionsEnfant: expectedActionEnfant,
      ...expectedCaeRoot
    }: ReferentielActionWithScoreType = {
      actionId: 'cae',
      nom: 'Climat Air Énergie',
      points: 500,
      categorie: null,
      pourcentage: null,
      level: 0,
      actionType: ActionType.REFERENTIEL,
      score: {
        actionId: 'cae',
        etoiles: 1,
        pointReferentiel: 500,
        pointPotentiel: 490.9,
        pointPotentielPerso: null,
        pointFait: 0.36,
        pointPasFait: 0.03,
        pointNonRenseigne: 490.3,
        pointProgramme: 0.21,
        concerne: true,
        completedTachesCount: 2,
        totalTachesCount: 1111,
        faitTachesAvancement: 1.2,
        programmeTachesAvancement: 0.7,
        pasFaitTachesAvancement: 0.1,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        renseigne: false,
      },
      actionsEnfant: [],
      scoresTag: {},
      tags: [],
    };
    expect(referentielScoreWithoutActionsEnfant).toEqual(expectedCaeRoot);
  });

  it(`Récupération anonyme du score d'un référentiel pour une collectivite inconnue`, async () => {
    await request(app.getHttpServer())
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
    await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/inconnu/scores')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(404)
      .expect({
        message: 'Referentiel definition inconnu not found',
        error: 'Not Found',
        statusCode: 404,
      });
  });

  it(`Récupération de l'historique du score d'un référentiel pour un utilisateur autorisé`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores?date=2019-01-01T00:00:01Z')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const referentielScores = response.body as GetReferentielScoresResponseType;
    const { actionsEnfant, ...referentielScoreWithoutActionsEnfant } =
      referentielScores.scores;
    expect(referentielScores.date).toBe('2019-01-01T00:00:01Z');
    expect(actionsEnfant.length).toBe(6);

    const {
      actionsEnfant: expectedActionEnfant,
      ...expectedCaeRoot
    }: ReferentielActionWithScoreType = {
      actionId: 'cae',
      nom: 'Climat Air Énergie',
      points: 500,
      categorie: null,
      pourcentage: null,
      level: 0,
      actionType: ActionType.REFERENTIEL,
      score: {
        actionId: 'cae',
        etoiles: 1,
        pointReferentiel: 500,
        pointPotentiel: 496.5,
        pointPotentielPerso: null,
        pointFait: 0,
        pointPasFait: 0,
        pointNonRenseigne: 496.5,
        pointProgramme: 0,
        concerne: true,
        completedTachesCount: 0,
        totalTachesCount: 1111,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        renseigne: false,
      },
      actionsEnfant: [],
      scoresTag: {},
      tags: [],
    };

    expect(referentielScoreWithoutActionsEnfant).toEqual(expectedCaeRoot);
  });

  afterAll(async () => {
    await app.close();
  });
});
