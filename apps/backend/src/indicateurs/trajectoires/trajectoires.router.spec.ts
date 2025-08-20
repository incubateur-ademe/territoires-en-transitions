import {
  VerificationTrajectoireResponseType,
  VerificationTrajectoireStatus,
} from '@/backend/indicateurs/trajectoires/verification-trajectoire.response';
import {
  getAuthUser,
  getTestApp,
  getTestRouter,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import {
  ForbiddenException,
  INestApplication,
  UnprocessableEntityException,
} from '@nestjs/common';
import { expect } from 'vitest';

describe('Calcul de trajectoire SNBC', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    yoloDodoUser = await getAuthUser(YOLO_DODO);
  });

  test(`Suppression sans acces`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(() =>
      caller.indicateurs.trajectoires.snbc.delete({
        collectiviteId: 3,
      })
    ).toThrowTrpcHttpError(
      new ForbiddenException(
        `Droits insuffisants, l'utilisateur 17440546-f389-4d4f-bfdb-b0c94a1bd0f9 n'a pas l'autorisation indicateurs.edition sur la ressource Collectivité 3`
      )
    );
  });

  test(`Verification avec une commune`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const statusResponse =
      await caller.indicateurs.trajectoires.snbc.checkStatus({
        collectiviteId: 1,
      });

    const expectedResponse: VerificationTrajectoireResponseType = {
      status: VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE,
    };

    expect(statusResponse).toMatchObject(expectedResponse);
  });

  test(`Calcul avec une commune`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(() =>
      caller.indicateurs.trajectoires.snbc.getOrCompute({
        collectiviteId: 1,
      })
    ).toThrowTrpcHttpError(
      new UnprocessableEntityException(
        `Le calcul de trajectoire SNBC peut uniquement être effectué pour un EPCI.`
      )
    );
  });

  test(`Verification avec donnees manquantes`, async () => {
    const verifcationReponseAttendue: VerificationTrajectoireResponseType = {
      status: VerificationTrajectoireStatus.DONNEES_MANQUANTES,
      epci: {
        id: 3812,
        nom: 'CA du Bassin de Bourg-en-Bresse',
        siren: '200071751',
        natureInsee: 'CA',
      },
      donneesEntree: {
        sources: [],
        emissionsGes: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_1.c'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.d'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.i'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.g'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.e'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.f'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.h'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.j'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
          ],
          identifiantsReferentielManquants: [
            'cae_1.c',
            'cae_1.d',
            'cae_1.i',
            'cae_1.g',
            'cae_1.e',
            'cae_1.f',
            'cae_1.h',
            'cae_1.j',
          ],
        },
        consommationsFinales: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_2.e'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.f'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.k'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.i'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.g', 'cae_2.h'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.j'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.l_pcaet'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
          ],
          identifiantsReferentielManquants: [
            'cae_2.e',
            'cae_2.f',
            'cae_2.k',
            'cae_2.i',
            'cae_2.g',
            'cae_2.h',
            'cae_2.j',
            'cae_2.l_pcaet',
          ],
        },
        sequestrations: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_63.ca'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cb'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.da'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cd'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cc'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.db'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.b'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.e'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
          ],
          identifiantsReferentielManquants: [
            'cae_63.ca',
            'cae_63.cb',
            'cae_63.da',
            'cae_63.cd',
            'cae_63.cc',
            'cae_63.db',
            'cae_63.b',
            'cae_63.e',
          ],
        },
        lastModifiedAt: null,
      },
    };

    const caller = router.createCaller({ user: yoloDodoUser });

    const statusResponse =
      await caller.indicateurs.trajectoires.snbc.checkStatus({
        collectiviteId: 3812,
        epciInfo: true,
      });
    expect(statusResponse).toMatchObject(verifcationReponseAttendue);
  });

  test(`Calcul avec donnees manquantes`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(() =>
      caller.indicateurs.trajectoires.snbc.getOrCompute({
        collectiviteId: 3812,
      })
    ).toThrowTrpcHttpError(
      new UnprocessableEntityException(
        `Les indicateurs suivants n'ont pas de valeur pour l'année 2015 ou avec une interpolation possible : cae_1.c, cae_1.d, cae_1.i, cae_1.g, cae_1.e, cae_1.f, cae_1.h, cae_1.j, cae_2.e, cae_2.f, cae_2.k, cae_2.i, cae_2.g, cae_2.h, cae_2.j, cae_2.l_pcaet, impossible de calculer la trajectoire SNBC.`
      )
    );
  }, 10000);

  test(`Calcul/récupération avec droit suffisant - visite`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const trajectoire = await caller.indicateurs.trajectoires.snbc.getOrCompute(
      {
        collectiviteId: 3895,
      }
    );
    expect(trajectoire).toBeDefined();
  }, 30000);

  test(`Calcul/récupération avec droit suffisant - lecture`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const trajectoire = await caller.indicateurs.trajectoires.snbc.getOrCompute(
      {
        collectiviteId: 3895,
      }
    );
    expect(trajectoire).toBeDefined();
  }, 30000);

  /*

  it(`Verification, calcul avec donnees completes et gestion de la mise à jour`, async () => {
    // Restauration de la valeur d'indicateur
    const response = await request(app.getHttpServer())
      .get(
        `/indicateurs?identifiantsReferentiel=cae_1.e&collectiviteId=4936&sources=rare`
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const indicateurExistingValeurs =
      response.body as GetIndicateursValeursResponseType;
    const indicateurCae1eId =
      indicateurExistingValeurs.indicateurs[0].definition.id;
    const indicateurCae1eMetadataId =
      indicateurExistingValeurs.indicateurs[0].sources['rare'].metadonnees[0]
        .id;
    const restaureIndicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: 4936,
          indicateurId: indicateurCae1eId,
          dateValeur: '2015-01-01',
          metadonneeId: indicateurCae1eMetadataId,
          resultat: 653.598,
        },
      ],
    };
    await request(app.getHttpServer())
      .post('/indicateurs')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send(restaureIndicateurValeurPayload)
      .expect(201);

    // Suppression de la trajectoire snbc existante si le test est joué plusieurs fois
    await request(app.getHttpServer())
      .delete('/trajectoires/snbc?collectiviteId=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const verifcationReponseAttendue: VerificationTrajectoireResponseType = {
      status: VerificationTrajectoireStatus.PRET_A_CALCULER,
      epci: {
        id: 4936,
        nom: 'Eurométropole de Strasbourg',
        siren: '246700488',
        natureInsee: 'METRO',
      },
      donneesEntree: {
        sources: ['rare', 'aldo'],
        emissionsGes: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_1.c'],
              valeur: 447.868,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_1.d'],
              valeur: 471.107,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_1.i'],
              valeur: 348.525,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_1.g'],
              valeur: 28.839,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_1.e'],
              valeur: 653.6,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_1.f'],
              valeur: 21.492,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_1.h'],
              valeur: 39.791,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_1.j'],
              valeur: 13.5,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
          ],
          identifiantsReferentielManquants: [],
        },
        consommationsFinales: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_2.e'],
              valeur: 3092.7,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_2.f'],
              valeur: 3295.15,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_2.k'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.i'],
              valeur: 61,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_2.g', 'cae_2.h'],
              valeur: 2668.6499999999996,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_2.j'],
              valeur: 0,
              dateMin: '2015-01-01',
              dateMax: '2015-01-01',
            },
            {
              identifiantsReferentiel: ['cae_2.l_pcaet'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
          ],
          identifiantsReferentielManquants: ['cae_2.k', 'cae_2.l_pcaet'],
        },
        sequestrations: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_63.ca'],
              valeur: -0.13844,
              dateMin: '2018-01-01',
              dateMax: '2018-01-01',
            },
            {
              identifiantsReferentiel: ['cae_63.cb'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.da'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cd'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cc'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.db'],
              valeur: -0.2279,
              dateMin: '2018-01-01',
              dateMax: '2018-01-01',
            },
            {
              identifiantsReferentiel: ['cae_63.b'],
              valeur: 7.81264,
              dateMin: '2018-01-01',
              dateMax: '2018-01-01',
            },
            {
              identifiantsReferentiel: ['cae_63.e'],
              valeur: 0.62713,
              dateMin: '2018-01-01',
              dateMax: '2018-01-01',
            },
          ],
          identifiantsReferentielManquants: [
            'cae_63.cb',
            'cae_63.da',
            'cae_63.cd',
            'cae_63.cc',
          ],
        },
      },
    };
    const verificationResponse = await request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectiviteId=4936&epciInfo=true')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    expect(verificationResponse.body).toMatchObject(verifcationReponseAttendue);

    // Calcul de la trajectoire
    const responseCalcul = await request(app.getHttpServer())
      .get('/trajectoires/snbc?collectiviteId=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    expect((responseCalcul.body as CalculTrajectoireResponse).mode).toEqual(
      CalculTrajectoireResultatMode.MAJ_SPREADSHEET_EXISTANT
    );

    // La vérification doit maintenant retourner "calculé"
    const verificationReponseAttendueApresCalcul: VerificationTrajectoireResponseType =
      {
        status: VerificationTrajectoireStatus.DEJA_CALCULE,
        sourcesDonneesEntree: ['rare', 'aldo'],
        indentifiantsReferentielManquantsDonneesEntree: [
          'cae_2.k',
          'cae_2.l_pcaet',
          'cae_63.cb',
          'cae_63.da',
          'cae_63.cd',
          'cae_63.cc',
        ],
      };
    const verificationApresCalculResponse = await request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectiviteId=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    expect(verificationApresCalculResponse.body).toMatchObject(
      verificationReponseAttendueApresCalcul
    );

    // Si on requête de nouveau le calcul, il doit provenir de la base de données
    const responseRecalcul = await request(app.getHttpServer())
      .get('/trajectoires/snbc?collectiviteId=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    expect((responseRecalcul.body as CalculTrajectoireResponse).mode).toEqual(
      CalculTrajectoireResultatMode.DONNEES_EN_BDD
    );

    // Maintenant on met à jour une valeur d'indicateur
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: 4936,
          indicateurId: indicateurCae1eId,
          dateValeur: '2015-01-01',
          metadonneeId: indicateurCae1eMetadataId,
          resultat: 663,
        },
      ],
    };
    const upsertIndicateurResponse = await request(app.getHttpServer())
      .post('/indicateurs')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send(indicateurValeurPayload)
      .expect(201);

    await sleep(1000);

    // La verification doit indiquer qu'il y a une mise à jour disponible
    const verificationApresMajResponse = await request(app.getHttpServer())
      .get(
        '/trajectoires/snbc/verification?collectiviteId=4936&forceRecuperationDonnees=true'
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    expect(verificationApresMajResponse.body.status).toEqual(
      VerificationTrajectoireStatus.MISE_A_JOUR_DISPONIBLE
    );

    // On force un recalcul
    const responseApresMajEtRecalcul = await request(app.getHttpServer())
      .get(
        `/trajectoires/snbc?collectiviteId=4936&mode=${CalculTrajectoireResultatMode.MAJ_SPREADSHEET_EXISTANT}`
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const calculTrajectoireResponse =
      responseApresMajEtRecalcul.body as CalculTrajectoireResponse;
    expect(calculTrajectoireResponse.mode).toEqual(
      CalculTrajectoireResultatMode.MAJ_SPREADSHEET_EXISTANT
    );

    // La vérification doit maintenant envoyer 'deja_calcule'
    const verificationApresMajEtRecalculResponse = await request(
      app.getHttpServer()
    )
      .get(
        '/trajectoires/snbc/verification?collectiviteId=4936&forceRecuperationDonnees=true'
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    expect(verificationApresMajEtRecalculResponse.body.status).toEqual(
      VerificationTrajectoireStatus.DEJA_CALCULE
    );
  }, 30000);

  */

  afterAll(async () => {
    await app.close();
  });
});
