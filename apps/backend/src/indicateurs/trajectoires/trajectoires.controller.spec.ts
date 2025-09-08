import { CalculTrajectoireResultatMode } from '@/backend/indicateurs/trajectoires/calcul-trajectoire.request';
import { CalculTrajectoireResponse } from '@/backend/indicateurs/trajectoires/calcul-trajectoire.response';
import {
  VerificationTrajectoireResponseType,
  VerificationTrajectoireStatus,
} from '@/backend/indicateurs/trajectoires/verification-trajectoire.response';
import { GetIndicateursValeursResponseType } from '@/backend/indicateurs/valeurs/get-indicateur-valeurs.response';
import { UpsertIndicateursValeursRequest } from '@/backend/indicateurs/valeurs/upsert-indicateurs-valeurs.request';
import {
  getAuthUser,
  getTestApp,
  getTestRouter,
  signInWith,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { sleep } from '@/backend/utils/sleep.utils';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { expect } from 'vitest';

describe('Téléchargement de la trajectoire SNBC', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoToken: string;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';
    yoloDodoUser = await getAuthUser(YOLO_DODO);
  });

  test(`Telechargement du modele`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/modele') // Accès public, pas la peine de mettre le token
      .expect(200);
  }, 30000);

  test(`Téléchargement du fichier xlsx prérempli pour un epci avec donnees completes`, async () => {
    const response = await request(app.getHttpServer())
      .get('/trajectoires/snbc/telechargement?collectiviteId=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .responseType('blob');

    const fileName = response.headers['content-disposition']
      .split('filename=')[1]
      .split(';')[0];
    expect(fileName).toBe(
      '"Trajectoire SNBC - 246700488 - Eurome?tropole de Strasbourg.xlsx"'
    );
  }, 30000);

  test(`Verification, calcul avec donnees completes et gestion de la mise à jour`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const collectiviteId = 4936;

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
          collectiviteId: collectiviteId,
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
    await caller.indicateurs.trajectoires.snbc.delete({
      collectiviteId: collectiviteId,
    });

    const verifcationReponseAttendue: VerificationTrajectoireResponseType = {
      status: VerificationTrajectoireStatus.PRET_A_CALCULER,
      epci: {
        id: collectiviteId,
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
    const verificationResponse =
      await caller.indicateurs.trajectoires.snbc.checkStatus({
        collectiviteId: collectiviteId,
      });
    expect(verificationResponse).toMatchObject(verifcationReponseAttendue);

    // Calcul de la trajectoire
    const responseCalcul = await request(app.getHttpServer())
      .get(`/trajectoires/snbc?collectiviteId=${collectiviteId}`)
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
    const verificationApresCalculResponse =
      await caller.indicateurs.trajectoires.snbc.checkStatus({
        collectiviteId: collectiviteId,
      });

    expect(verificationApresCalculResponse).toMatchObject(
      verificationReponseAttendueApresCalcul
    );

    // Si on requête de nouveau le calcul, il doit provenir de la base de données
    const responseRecalcul = await request(app.getHttpServer())
      .get(`/trajectoires/snbc?collectiviteId=${collectiviteId}`)
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
    const verificationApresMajResponse =
      await caller.indicateurs.trajectoires.snbc.checkStatus({
        collectiviteId: collectiviteId,
        forceRecuperationDonnees: true,
      });
    expect(verificationApresMajResponse.status).toEqual(
      VerificationTrajectoireStatus.MISE_A_JOUR_DISPONIBLE
    );

    // On force un recalcul
    const responseApresMajEtRecalcul = await request(app.getHttpServer())
      .get(
        `/trajectoires/snbc?collectiviteId=${collectiviteId}&mode=${CalculTrajectoireResultatMode.MAJ_SPREADSHEET_EXISTANT}`
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const calculTrajectoireResponse =
      responseApresMajEtRecalcul.body as CalculTrajectoireResponse;
    expect(calculTrajectoireResponse.mode).toEqual(
      CalculTrajectoireResultatMode.MAJ_SPREADSHEET_EXISTANT
    );

    // La vérification doit maintenant envoyer 'deja_calcule'
    const verificationApresMajEtRecalculResponse =
      await caller.indicateurs.trajectoires.snbc.checkStatus({
        collectiviteId: collectiviteId,
        forceRecuperationDonnees: true,
      });
    expect(verificationApresMajEtRecalculResponse.status).toEqual(
      VerificationTrajectoireStatus.DEJA_CALCULE
    );
  }, 30000);

  afterAll(async () => {
    await app.close();
  });
});
