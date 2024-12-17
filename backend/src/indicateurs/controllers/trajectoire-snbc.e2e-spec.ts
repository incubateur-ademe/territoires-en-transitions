import { CalculTrajectoireResultatMode } from '@/backend/indicateurs/models/calcul-trajectoire.request';
import { CalculTrajectoireResponseType } from '@/backend/indicateurs/models/calcul-trajectoire.response';
import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { getTestApp } from '../../../test/app-utils';
import { signInWith } from '../../../test/auth-utils';
import { YOLO_DODO } from '../../../test/test-users.samples';
import {
  VerificationTrajectoireResponseType,
  VerificationTrajectoireStatus,
} from '../models/verification-trajectoire.response';

describe('Calcul de trajectoire SNBC', () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();

    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';
  });

  it(`Verification sans acces`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectiviteId=3')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        message: "Droits insuffisants, l'utilisateur 17440546-f389-4d4f-bfdb-b0c94a1bd0f9 n'a pas l'autorisation indicateurs.trajectoire.lecture sur la ressource Collectivité 3",
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it(`Suppression sans acces`, () => {
    return request(app.getHttpServer())
      .delete('/trajectoires/snbc?collectiviteId=3')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        message: "Droits insuffisants, l'utilisateur 17440546-f389-4d4f-bfdb-b0c94a1bd0f9 n'a pas l'autorisation indicateurs.trajectoire.edition sur la ressource Collectivité 3",
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it(`Verification avec une commune`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectiviteId=1')
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
      .expect(200)
      .expect({ status: 'commune_non_supportee' });
  });

  it(`Calcul avec une commune`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc?collectiviteId=1')
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
      .expect(422)
      .expect({
        message:
          'Le calcul de trajectoire SNBC peut uniquement être effectué pour un EPCI.',
        error: 'Unprocessable Entity',
        statusCode: 422,
      });
  });

  it(`Verification avec donnees manquantes`, () => {
    const verifcationReponseAttendue: VerificationTrajectoireResponseType = {
      status: VerificationTrajectoireStatus.DONNEES_MANQUANTES,
      epci: {
        id: 2,
        collectiviteId: 3812,
        nom: 'CA du Bassin de Bourg-en-Bresse',
        siren: '200071751',
        nature: 'CA',
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
      },
    };
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectiviteId=3812&epciInfo=true')
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
      .expect(200)
      .expect(verifcationReponseAttendue);
  });

  it(`Calcul avec donnees manquantes`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc?collectiviteId=3812')
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
      .expect(422)
      .expect({
        message:
          "Les indicateurs suivants n'ont pas de valeur pour l'année 2015 ou avec une interpolation possible : cae_1.c, cae_1.d, cae_1.i, cae_1.g, cae_1.e, cae_1.f, cae_1.h, cae_1.j, cae_2.e, cae_2.f, cae_2.k, cae_2.i, cae_2.g, cae_2.h, cae_2.j, cae_2.l_pcaet, impossible de calculer la trajectoire SNBC.",
        error: 'Unprocessable Entity',
        statusCode: 422,
      });
  }, 10000);

  it(`Calcul sans droit suffisant (uniquement lecture)`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc?collectiviteId=3895')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        message: "Droits insuffisants, l'utilisateur 17440546-f389-4d4f-bfdb-b0c94a1bd0f9 n'a pas l'autorisation indicateurs.trajectoire.edition sur la ressource Collectivité 3895",
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it(`Verification et calcul avec donnees completes`, async () => {
    // Suppression de la trajectoire snbc existante si le test est joué plusieurs fois
    await request(app.getHttpServer())
      .delete('/trajectoires/snbc?collectiviteId=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const verifcationReponseAttendue: VerificationTrajectoireResponseType = {
      status: VerificationTrajectoireStatus.PRET_A_CALCULER,
      epci: {
        id: 1126,
        collectiviteId: 4936,
        nom: 'Eurométropole de Strasbourg',
        siren: '246700488',
        nature: 'METRO',
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
              valeur: 653.598,
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
    await request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectiviteId=4936&epciInfo=true')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .expect(verifcationReponseAttendue);

    // Calcul de la trajectoire
    const responseCalcul = await request(app.getHttpServer())
      .get('/trajectoires/snbc?collectiviteId=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    expect((responseCalcul.body as CalculTrajectoireResponseType).mode).toEqual(
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
    await request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectiviteId=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .expect(verificationReponseAttendueApresCalcul);

    // Si on requête de nouveau le calcul, il doit provenir de la base de données
    const responseRecalcul = await request(app.getHttpServer())
      .get('/trajectoires/snbc?collectiviteId=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    expect(
      (responseRecalcul.body as CalculTrajectoireResponseType).mode
    ).toEqual(CalculTrajectoireResultatMode.DONNEES_EN_BDD);
  }, 30000);

  it(`Telechargement du modele`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/modele') // Accès public, pas la peine de mettre le token
      .expect(200);
  }, 30000);

  it(`Téléchargement du fichier xlsx prérempli pour un epci avec donnees completes`, async () => {
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

  afterAll(async () => {
    await app.close();
  });
});
