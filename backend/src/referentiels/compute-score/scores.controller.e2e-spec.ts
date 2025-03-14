import { INestApplication } from '@nestjs/common';
import { DateTime } from 'luxon';
import { default as request } from 'supertest';
import { getTestApp } from '../../../test/app-utils';
import { getAuthToken } from '../../../test/auth-utils';
import { ActionStatut } from '../index-domain';
import { HistoriqueActionStatutType } from '../models/historique-action-statut.table';
import { ActionStatutsByActionId } from './action-statuts-by-action-id.dto';

describe('Referentiels scoring routes', () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getAuthToken();
  });

  test(`Récupération des statuts des actions sans token non autorisée`, async () => {
    await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/action-statuts')
      .expect(401);
  });

  test(`Récupération anonyme des statuts des actions`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/action-statuts')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const actionStatuts = response.body as ActionStatutsByActionId;
    expect(Object.keys(actionStatuts).length).toBe(2);
    const expectedActionStatut: ActionStatut = {
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

  test(`Récupération anonyme des statuts des actions pour une collectivite inconnue`, async () => {
    await request(app.getHttpServer())
      .get('/collectivites/10000000/referentiels/cae/action-statuts')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(404)
      .expect({
        message: "Collectivité avec l'identifiant 10000000 introuvable",
        error: 'Not Found',
        statusCode: 404,
      });
  });

  test(`Récupération anonyme des statuts des actions d'un référentiel inconnu`, async () => {
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

  test(`Récupération anonyme des historiques de statuts des actions non autorisé`, async () => {
    await request(app.getHttpServer())
      .get(
        '/collectivites/1/referentiels/cae/action-statuts?date=2020-01-02T00:00:01Z'
      )
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(401);
  });

  test(`Récupération des historiques de statuts des actions pour un utilisateur autorisé`, async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/collectivites/1/referentiels/cae/action-statuts?date=2020-01-02T00:00:01Z'
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const actionStatuts = response.body as ActionStatutsByActionId;
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

  // test(`Récupération du score d'un référentiel avec sauvegarde d'un snapshot non autorisée pour un utilisateur en lecture seule`, async () => {
  //   await request(app.getHttpServer())
  //     .get(
  //       `/collectivites/${rhoneAggloCollectiviteId}/referentiels/cae/scores?snapshotNom=test`
  //     )
  //     .set('Authorization', `Bearer ${yoloDodoToken}`)
  //     .expect(401);

  //   await request(app.getHttpServer())
  //     .get(
  //       `/collectivites/${rhoneAggloCollectiviteId}/referentiels/cae/scores?snapshot=true`
  //     )
  //     .set('Authorization', `Bearer ${yoloDodoToken}`)
  //     .expect(401);
  // });

  // test(`Récupération du snapshot pour un utilisateur anonyme`, async () => {
  //   // Recalcul du score courant
  //   const responseSnapshotCreation = await request(app.getHttpServer())
  //     .get(`/collectivites/1/referentiels/cae/scores?snapshot=true`)
  //     .set('Authorization', `Bearer ${yoloDodoToken}`)
  //     .expect(200);
  //   const getReferentielScoresResponseType: ScoresPayload =
  //     responseSnapshotCreation.body as ScoresPayload;
  //   expect(getReferentielScoresResponseType.snapshot?.ref).toBe(
  //     'score-courant'
  //   );

  //   // Récupération du snapshot pour un utilisateur anonyme
  //   const responseSnapshot = await request(app.getHttpServer())
  //     .get(`/collectivites/1/referentiels/cae/score-snapshots/score-courant`)
  //     .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
  //     .expect(200);
  //   const reponseSnapshotGetReferentielScores: ScoresPayload =
  //     responseSnapshot.body as ScoresPayload;

  //   expect(reponseSnapshotGetReferentielScores).toEqual(
  //     getReferentielScoresResponseType
  //   );
  //   const expectedRootScore: Score = {
  //     etoiles: 1,
  //     actionId: 'cae',
  //     concerne: true,
  //     desactive: false,
  //     pointFait: 0.36,
  //     renseigne: false,
  //     pointPasFait: 0.03,
  //     pointPotentiel: 490.9,
  //     pointProgramme: 0.21,
  //     pointReferentiel: 500,
  //     totalTachesCount: 1111,
  //     pointNonRenseigne: 490.3,
  //     pointPotentielPerso: null,
  //     completedTachesCount: 2,
  //     faitTachesAvancement: 1.2,
  //     pasFaitTachesAvancement: 0.1,
  //     programmeTachesAvancement: 0.7,
  //     pasConcerneTachesAvancement: 0,
  //   };
  //   expect(reponseSnapshotGetReferentielScores.scores.score).toEqual(
  //     expectedRootScore
  //   );
  // });

  test(`Export du snapshot pour un utilisateur non authentifié`, async () => {
    await request(app.getHttpServer())
      .get(
        `/collectivites/1/referentiels/eci/score-snapshots/score-courant/export`
      )
      .expect(401);
  });

  test(`Export du snapshot pour un utilisateur anonyme`, async () => {
    const responseSnapshotExport = await request(app.getHttpServer())
      .get(
        `/collectivites/1/referentiels/eci/score-snapshots/score-courant/export`
      )
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200)
      .responseType('blob');

    const currentDate = DateTime.now().toISODate();
    const exportFileName = responseSnapshotExport.headers['content-disposition']
      .split('filename=')[1]
      .split(';')[0];
    expect(exportFileName).toBe(
      `"Export_ECI_Ambe?rieu-en-Bugey_${currentDate}.xlsx"`
    );
    const expectedExportSize = 33.702;
    const exportFileSize = parseInt(
      responseSnapshotExport.headers['content-length']
    );
    expect(exportFileSize / 1000).toBeCloseTo(expectedExportSize, 0);
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
