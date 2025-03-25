import { collectiviteTable } from '@/backend/collectivites/index-domain';
import {
  getAuthToken,
  getCollectiviteIdBySiren,
  getIndicateurIdByIdentifiant,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@/backend/test';
import { DatabaseService } from '@/backend/utils';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { default as request } from 'supertest';
import {
  UpsertIndicateursValeursRequest,
  UpsertIndicateursValeursResponse,
} from '../shared/models/upsert-indicateurs-valeurs.request';

const collectiviteId = 3;

describe('Indicateurs', () => {
  let app: INestApplication;
  let yoloDodoToken: string;
  let databaseService: DatabaseService;
  let paysDuLaonCollectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getAuthToken();
    databaseService = await getTestDatabase(app);
    paysDuLaonCollectiviteId = await getCollectiviteIdBySiren(
      databaseService,
      '200043495'
    );

    await databaseService.db
      .update(collectiviteTable)
      .set({ accessRestreint: false })
      .where(eq(collectiviteTable.id, collectiviteId));

    return async () => {
      await databaseService.db
        .update(collectiviteTable)
        .set({ accessRestreint: false })
        .where(eq(collectiviteTable.id, collectiviteId));

      await app.close();
    };
  });

  it(`Lecture sans acces`, async () => {
    // on peut lire les valeurs en mode visite
    const response = await request(app.getHttpServer())
      .get(`/indicateurs?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      count: expect.any(Number),
      indicateurs: expect.any(Array),
    });

    // mais pas si la collectivité est en accès restreint
    await databaseService.db
      .update(collectiviteTable)
      .set({ accessRestreint: true })
      .where(eq(collectiviteTable.id, collectiviteId));

    return request(app.getHttpServer())
      .get(`/indicateurs?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        message: `Droits insuffisants, l'utilisateur 17440546-f389-4d4f-bfdb-b0c94a1bd0f9 n'a pas l'autorisation indicateurs.lecture sur la ressource Collectivité ${collectiviteId}`,
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it(`Lecture sans collectivite nécessite un accès service role`, async () => {
    // on peut lire les valeurs en mode visite
    await request(app.getHttpServer())
      .get(`/indicateurs?identifiantsReferentiel=cae_1.a`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        error: 'Unauthorized',
        message:
          "Droits insuffisants, l'utilisateur n'a pas le rôle service_role",
        statusCode: 401,
      });

    const response = await request(app.getHttpServer())
      .get(`/indicateurs?identifiantsReferentiel=cae_1.a&sources=collectivite`)
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
      .expect(200);

    expect(response.body).toMatchObject({
      count: expect.any(Number),
      indicateurs: expect.any(Array),
    });
  }, 10000);

  it(`Ecriture sans acces (uniquement lecture sur un des deux)`, () => {
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: 4936,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 447868,
        },
        {
          collectiviteId: 3895,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 54086,
        },
      ],
    };
    return request(app.getHttpServer())
      .post('/indicateurs')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send(indicateurValeurPayload)
      .expect(401)
      .expect({
        message:
          "Droits insuffisants, l'utilisateur 17440546-f389-4d4f-bfdb-b0c94a1bd0f9 n'a pas l'autorisation indicateurs.edition sur la ressource Collectivité 3895",
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it(`Ecriture avec accès et calcul d'un autre indicateur pour la collectivité > désactivé temporairement`, async () => {
    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.f'
    );
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: indicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: null,
          resultat: 2.039,
        },
      ],
    };
    const response = await request(app.getHttpServer())
      .post('/indicateurs')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send(indicateurValeurPayload)
      .expect(201);
    const upserIndicateurValeursResponse: UpsertIndicateursValeursResponse =
      response.body;
    expect(upserIndicateurValeursResponse.valeurs).toBeInstanceOf(Array);
    expect(upserIndicateurValeursResponse.valeurs.length).toEqual(1);
    expect(upserIndicateurValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: 15,
      indicateurIdentifiant: 'cae_1.f',
      metadonneeId: null,
      modifiedBy: YOLO_DODO.id,
      objectif: null,
      objectifCommentaire: null,
      resultat: 2.04,
      resultatCommentaire: null,
    });
  });

  it(`Ecriture avec accès et calcul d'un autre indicateur de la même source`, async () => {
    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.f'
    );
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: indicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: 2,
          resultat: 2.039,
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/indicateurs')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send(indicateurValeurPayload)
      .expect(201);
    const upserIndicateurValeursResponse: UpsertIndicateursValeursResponse =
      response.body;
    expect(upserIndicateurValeursResponse.valeurs).toBeInstanceOf(Array);
    expect(
      upserIndicateurValeursResponse.valeurs.length
    ).toBeGreaterThanOrEqual(2);
    expect(upserIndicateurValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: 15,
      indicateurIdentifiant: 'cae_1.f',
      metadonneeId: 2,
      modifiedBy: YOLO_DODO.id,
      objectif: null,
      objectifCommentaire: null,
      resultat: 2.04,
      resultatCommentaire: null,
      sourceId: 'rare',
    });
    // Calculated indicateur
    const cae1kIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.k'
    );
    const cae1kCalculatedValeur = upserIndicateurValeursResponse.valeurs.find(
      (v) => v.indicateurId === cae1kIndicateurId
    );
    expect(cae1kCalculatedValeur).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: 30,
      indicateurIdentifiant: 'cae_1.k',
      metadonneeId: 2,
      objectif: null,
      objectifCommentaire: null,
      resultat: 104.09,
      resultatCommentaire: null,
      sourceId: 'rare',
    });
  });

  it(`Ecriture avec accès et calcul d'un autre indicateur impliquant une autre source avec arrondi`, async () => {
    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.a'
    );
    const indicateurPopulationId = await getIndicateurIdByIdentifiant(
      databaseService,
      'terr_1'
    );

    // restore the population value
    await request(app.getHttpServer())
      .post('/indicateurs')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send({
        valeurs: [
          {
            collectiviteId: paysDuLaonCollectiviteId,
            indicateurId: indicateurPopulationId,
            dateValeur: '2015-01-01',
            metadonneeId: 5,
            resultat: 41739,
          },
        ],
      })
      .expect(201);

    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: indicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: 2,
          resultat: 10000.000002,
        },
      ],
    };
    const response = await request(app.getHttpServer())
      .post('/indicateurs')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send(indicateurValeurPayload)
      .expect(201);
    const upserIndicateurValeursResponse: UpsertIndicateursValeursResponse =
      response.body;
    expect(upserIndicateurValeursResponse.valeurs).toBeInstanceOf(Array);
    expect(
      upserIndicateurValeursResponse.valeurs.length
    ).toBeGreaterThanOrEqual(2);
    expect(upserIndicateurValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurId,
      indicateurIdentifiant: 'cae_1.a',
      metadonneeId: 2,
      modifiedBy: YOLO_DODO.id,
      objectif: null,
      objectifCommentaire: null,
      resultat: 10000,
      resultatCommentaire: null,
      sourceId: 'rare',
    });
    const computedIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.b'
    );
    const computedValeur = upserIndicateurValeursResponse.valeurs.find(
      (v) => v.indicateurId === computedIndicateurId
    );
    // Calculated indicateur
    expect(computedValeur).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: 3,
      indicateurIdentifiant: 'cae_1.b',
      metadonneeId: 2,
      objectif: null,
      objectifCommentaire: null,
      resultat: 239.58,
      resultatCommentaire: null,
      sourceId: 'rare',
    });

    // We now test to change the population value from 41739 to 20000
    const indicateurPopulationValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: indicateurPopulationId,
          dateValeur: '2015-01-01',
          metadonneeId: 5,
          resultat: 20000,
        },
      ],
    };

    const responseAfterPopulationUpdate = await request(app.getHttpServer())
      .post('/indicateurs')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send(indicateurPopulationValeurPayload)
      .expect(201);
    const upsertIndicateurPopulationValeursResponse: UpsertIndicateursValeursResponse =
      responseAfterPopulationUpdate.body;
    expect(upsertIndicateurPopulationValeursResponse.valeurs).toBeInstanceOf(
      Array
    );
    expect(
      upsertIndicateurPopulationValeursResponse.valeurs.length
    ).toBeGreaterThanOrEqual(2);
    expect(upsertIndicateurPopulationValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurPopulationId,
      indicateurIdentifiant: 'terr_1',
      metadonneeId: 5,
      modifiedBy: YOLO_DODO.id,
      objectif: null,
      objectifCommentaire: null,
      resultat: 20000,
      resultatCommentaire: null,
      sourceId: 'insee',
    });
    // Calculated indicateur
    const computedValeurAfterPopulation =
      upsertIndicateurPopulationValeursResponse.valeurs.find(
        (v) => v.indicateurId === computedIndicateurId
      );
    expect(computedValeurAfterPopulation).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: 3,
      indicateurIdentifiant: 'cae_1.b',
      metadonneeId: 2,
      objectif: null,
      objectifCommentaire: null,
      resultat: 500,
      resultatCommentaire: null,
      sourceId: 'rare',
    });

    // restore the population value
    await request(app.getHttpServer())
      .post('/indicateurs')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send({
        valeurs: [
          {
            collectiviteId: paysDuLaonCollectiviteId,
            indicateurId: indicateurPopulationId,
            dateValeur: '2015-01-01',
            metadonneeId: 5,
            resultat: 41739,
          },
        ],
      })
      .expect(201);
  });
});
