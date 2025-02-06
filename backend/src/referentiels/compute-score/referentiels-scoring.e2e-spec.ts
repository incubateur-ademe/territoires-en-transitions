import { INestApplication } from '@nestjs/common';
import { DateTime } from 'luxon';
import { default as request } from 'supertest';
import { getTestApp } from '../../../test/app-utils';
import { getAuthToken } from '../../../test/auth-utils';
import { getCollectiviteIdBySiren } from '../../../test/collectivites-utils';
import { HttpErrorResponse } from '../../utils/nest/http-error.response';
import { ActionStatut, referentielIdEnumSchema } from '../index-domain';
import { ActionTypeEnum } from '../models/action-type.enum';
import { GetScoreSnapshotsResponseType } from '../models/get-score-snapshots.response';
import { HistoriqueActionStatutType } from '../models/historique-action-statut.table';
import { SnapshotJalon } from '../snapshots/snapshot-jalon.enum';
import { ActionStatutsByActionId } from './action-statuts-by-action-id.dto';
import { GetReferentielScoresResponseType } from './get-referentiel-scores.response';
import { Score } from './score.dto';

describe('Referentiels scoring routes', () => {
  let app: INestApplication;
  let yoloDodoToken: string;
  let rhoneAggloCollectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getAuthToken();
    rhoneAggloCollectiviteId = await getCollectiviteIdBySiren('200072015');
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
        message:
          "Commune avec l'identifiant de collectivite 10000000 introuvable",
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

  test(`Récupération du score d'un référentiel sans token non autorisée`, async () => {
    await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores')
      .expect(401);
  });

  test(`Récupération anonyme du score d'un référentiel`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const referentielScores = response.body as GetReferentielScoresResponseType;
    const { actionsEnfant, ...referentielScoreWithoutActionsEnfant } =
      referentielScores.scores;
    expect(actionsEnfant.length).toBe(6);
    const { actionsEnfant: expectedActionEnfant, ...expectedCaeRoot } = {
      actionId: 'cae',
      identifiant: '',
      nom: 'Climat Air Énergie',
      points: 500,
      categorie: null,
      pourcentage: null,
      level: 0,
      actionType: ActionTypeEnum.REFERENTIEL,
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

  test(`Récupération anonyme du score d'un référentiel pour une collectivite inconnue`, async () => {
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

  test(`Récupération anonyme du score d'un référentiel inconnu`, async () => {
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

  test(`Récupération anonyme du score d'un référentiel avec sauvegarde d'un snapshot non autorisée`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores?snapshotNom=test')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(401);
    expect((response.body as HttpErrorResponse).message).toEqual(
      "L'utilisateur n'a pas de rôles"
    );

    const response2 = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores?snapshot=true')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(401);
    expect((response2.body as HttpErrorResponse).message).toEqual(
      "L'utilisateur n'a pas de rôles"
    );
  });

  test(`Récupération du score d'un référentiel avec sauvegarde d'un snapshot non autorisée pour un utilisateur en lecture seule`, async () => {
    await request(app.getHttpServer())
      .get(
        `/collectivites/${rhoneAggloCollectiviteId}/referentiels/cae/scores?snapshotNom=test`
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .get(
        `/collectivites/${rhoneAggloCollectiviteId}/referentiels/cae/scores?snapshot=true`
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401);
  });

  test(`Récupération du score d'un référentiel avec sauvegarde d'un snapshot autorisée pour un utilisateur en écriture`, async () => {
    const responseSnapshotScoreCourantCreation = await request(
      app.getHttpServer()
    )
      .get(`/collectivites/1/referentiels/cae/score-snapshots/score-courant`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const getReferentielScoresCourantResponseType: GetReferentielScoresResponseType =
      responseSnapshotScoreCourantCreation.body as GetReferentielScoresResponseType;
    expect(getReferentielScoresCourantResponseType.snapshot?.ref).toBe(
      'score-courant'
    );

    const responseCurrentSnapshotList = await request(app.getHttpServer())
      .get(
        `/collectivites/1/referentiels/cae/score-snapshots?typesJalon=score_courant`
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const expectedCurrentSnapshotList: GetScoreSnapshotsResponseType = {
      collectiviteId: 1,
      referentielId: referentielIdEnumSchema.enum.cae,
      typesJalon: [SnapshotJalon.SCORE_COURANT],
      snapshots: [
        {
          auditId: null,
          createdAt: expect.toEqualDate(
            getReferentielScoresCourantResponseType.snapshot!.createdAt
          ),
          createdBy: null,
          modifiedBy: getReferentielScoresCourantResponseType.snapshot
            ?.modifiedBy as string,
          date: expect.toEqualDate(
            getReferentielScoresCourantResponseType.date
          ),
          modifiedAt: expect.toEqualDate(
            getReferentielScoresCourantResponseType.snapshot!.modifiedAt
          ),
          nom: 'Score courant',
          pointFait: 0.36,
          pointNonRenseigne: 490.3,
          pointPasFait: 0.03,
          pointPotentiel: 490.9,
          pointProgramme: 0.21,
          ref: 'score-courant',
          referentielVersion: '1.0.0',
          typeJalon: SnapshotJalon.SCORE_COURANT,
        },
      ],
    };
    expect(responseCurrentSnapshotList.body).toEqual(
      expectedCurrentSnapshotList
    );

    const responseSnapshotCreation = await request(app.getHttpServer())
      .get(
        `/collectivites/1/referentiels/cae/scores?snapshotNom=test%20à%20accent&snapshotForceUpdate=true`
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const getReferentielScoresResponseType: GetReferentielScoresResponseType =
      responseSnapshotCreation.body as GetReferentielScoresResponseType;
    expect(getReferentielScoresResponseType.snapshot?.ref).toBe(
      'user-test-a-accent'
    );

    const responseSnapshotList = await request(app.getHttpServer())
      .get(
        `/collectivites/1/referentiels/cae/score-snapshots?typesJalon=date_personnalisee`
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const expectedSnapshotList: GetScoreSnapshotsResponseType = {
      collectiviteId: 1,
      referentielId: referentielIdEnumSchema.enum.cae,
      typesJalon: [SnapshotJalon.DATE_PERSONNALISEE],
      snapshots: [
        {
          date: expect.toEqualDate(getReferentielScoresResponseType.date),
          nom: 'test à accent',
          ref: 'user-test-a-accent',
          typeJalon: SnapshotJalon.DATE_PERSONNALISEE,
          modifiedAt: getReferentielScoresResponseType.snapshot!.modifiedAt,
          createdAt: getReferentielScoresResponseType.snapshot!.createdAt,
          referentielVersion: '1.0.0',
          auditId: null,
          createdBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
          modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
          pointFait: 0.36,
          pointNonRenseigne: 490.3,
          pointPasFait: 0.03,
          pointPotentiel: 490.9,
          pointProgramme: 0.21,
        },
      ],
    };
    expect(responseSnapshotList.body).toEqual(expectedSnapshotList);

    onTestFinished(async () => {
      await request(app.getHttpServer())
        .delete(
          `/collectivites/1/referentiels/cae/score-snapshots/test-a-accent`
        )
        .set('Authorization', `Bearer ${yoloDodoToken}`);
    });
  });

  test(`Suppression d'un snapshot non-autorisée pour un utilisateur en écriture mais sur un snapshot qui ne soit pas de type date personnalisée`, async () => {
    // Recalcul du score courant
    const responseSnapshotCreation = await request(app.getHttpServer())
      .get(`/collectivites/1/referentiels/cae/scores?snapshot=true`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const getReferentielScoresResponseType: GetReferentielScoresResponseType =
      responseSnapshotCreation.body as GetReferentielScoresResponseType;
    expect(getReferentielScoresResponseType.snapshot?.ref).toBe(
      'score-courant'
    );

    // Suppression du score courant interdite
    const deletionResponse = await request(app.getHttpServer())
      .delete(`/collectivites/1/referentiels/cae/score-snapshots/score-courant`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401);
    expect((deletionResponse.body as HttpErrorResponse).message).toEqual(
      `Uniquement les snaphots de type date_personnalisee,visite_annuelle peuvent être supprimés par un utilisateur.`
    );
  });

  test(`Récupération du snapshot pour un utilisateur anonyme`, async () => {
    // Recalcul du score courant
    const responseSnapshotCreation = await request(app.getHttpServer())
      .get(`/collectivites/1/referentiels/cae/scores?snapshot=true`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const getReferentielScoresResponseType: GetReferentielScoresResponseType =
      responseSnapshotCreation.body as GetReferentielScoresResponseType;
    expect(getReferentielScoresResponseType.snapshot?.ref).toBe(
      'score-courant'
    );

    // Récupération du snapshot pour un utilisateur anonyme
    const responseSnapshot = await request(app.getHttpServer())
      .get(`/collectivites/1/referentiels/cae/score-snapshots/score-courant`)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const reponseSnapshotGetReferentielScores: GetReferentielScoresResponseType =
      responseSnapshot.body as GetReferentielScoresResponseType;

    expect(reponseSnapshotGetReferentielScores).toEqual(
      getReferentielScoresResponseType
    );
    const expectedRootScore: Score = {
      etoiles: 1,
      actionId: 'cae',
      concerne: true,
      desactive: false,
      pointFait: 0.36,
      renseigne: false,
      pointPasFait: 0.03,
      pointPotentiel: 490.9,
      pointProgramme: 0.21,
      pointReferentiel: 500,
      totalTachesCount: 1111,
      pointNonRenseigne: 490.3,
      pointPotentielPerso: null,
      completedTachesCount: 2,
      faitTachesAvancement: 1.2,
      pasFaitTachesAvancement: 0.1,
      programmeTachesAvancement: 0.7,
      pasConcerneTachesAvancement: 0,
    };
    expect(reponseSnapshotGetReferentielScores.scores.score).toEqual(
      expectedRootScore
    );
  });

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

  test(`Récupération de l'historique du score d'un référentiel pour un utilisateur autorisé`, async () => {
    const response = await request(app.getHttpServer())
      .get('/collectivites/1/referentiels/cae/scores?date=2019-01-01T00:00:01Z')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const referentielScores = response.body as GetReferentielScoresResponseType;
    const { actionsEnfant, ...referentielScoreWithoutActionsEnfant } =
      referentielScores.scores;
    expect(referentielScores.date).toBe('2019-01-01T00:00:01Z');
    expect(actionsEnfant.length).toBe(6);

    const { actionsEnfant: expectedActionEnfant, ...expectedCaeRoot } = {
      actionId: 'cae',
      identifiant: '',
      nom: 'Climat Air Énergie',
      points: 500,
      categorie: null,
      pourcentage: null,
      level: 0,
      actionType: ActionTypeEnum.REFERENTIEL,
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
    if (app) {
      await app.close();
    }
  });
});
