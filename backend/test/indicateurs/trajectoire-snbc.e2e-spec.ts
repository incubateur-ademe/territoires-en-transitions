import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as _ from 'lodash';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  CalculTrajectoireResultatMode,
  VerificationDonneesSNBCResponseType,
  VerificationDonneesSNBCStatus,
} from '../../src/indicateurs/models/calcultrajectoire.models';
import { YOLO_DODO_CREDENTIALS } from '../auth/test-users.samples';
import { trajectoireSnbcCalculRetour } from './test-data/trajectoire-snbc-calcul-retour';

describe('Calcul de trajectoire SNBC', () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let yoloDodoToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
    const signinResponse = await supabase.auth.signInWithPassword(
      YOLO_DODO_CREDENTIALS,
    );
    yoloDodoToken = signinResponse.data.session?.access_token || '';
  });

  it(`Verification sans acces`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectivite_id=3')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        message: 'Droits insuffisants',
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it(`Suppression sans acces`, () => {
    return request(app.getHttpServer())
      .delete('/trajectoires/snbc?collectivite_id=3')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        message: 'Droits insuffisants',
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it(`Verification avec une commune`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectivite_id=1')
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
      .expect(200)
      .expect({ status: 'commune_non_supportee' });
  });

  it(`Calcul avec une commune`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc?collectivite_id=1')
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
    const verifcationReponseAttendue: VerificationDonneesSNBCResponseType = {
      status: VerificationDonneesSNBCStatus.DONNEES_MANQUANTES,
      epci: {
        id: 19,
        collectivite_id: 3829,
        nom: 'CA du Pays de Laon',
        siren: '200043495',
        nature: 'CA',
      },
      donnees_entree: {
        source: 'rare',
        emissions_ges: {
          valeurs: [
            {
              identifiants_referentiel: ['cae_1.c'],
              valeur: 56729,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.d'],
              valeur: 41448,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.i'],
              valeur: 19760,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.g'],
              valeur: 28860,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.e'],
              valeur: 102045,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.f'],
              valeur: 1039,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.h'],
              valeur: 3371,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.j'],
              valeur: 807,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
          ],
          identifiants_referentiel_manquants: [],
        },
        consommations_finales: {
          valeurs: [
            {
              identifiants_referentiel: ['cae_2.e'],
              valeur: 334.7,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_2.f'],
              valeur: 247.25,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_2.k'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_2.i'],
              valeur: 24.77,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_2.g', 'cae_2.h'],
              valeur: 406.57,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_2.j'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_2.l_pcaet'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
          ],
          identifiants_referentiel_manquants: [
            'cae_2.k',
            'cae_2.j',
            'cae_2.l_pcaet',
          ],
        },
        sequestrations: {
          valeurs: [
            {
              identifiants_referentiel: ['cae_63.ca'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.cb'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.da'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.cc'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.cd'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.db'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.b'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.e'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
          ],
          identifiants_referentiel_manquants: [
            'cae_63.ca',
            'cae_63.cb',
            'cae_63.da',
            'cae_63.cc',
            'cae_63.cd',
            'cae_63.db',
            'cae_63.b',
            'cae_63.e',
          ],
        },
      },
    };
    return request(app.getHttpServer())
      .get(
        '/trajectoires/snbc/verification?collectivite_id=3829&epci_info=true',
      )
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
      .expect(200)
      .expect(verifcationReponseAttendue);
  });

  it(`Calcul avec donnees manquantes`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc?collectivite_id=3829')
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
      .expect(422)
      .expect({
        message:
          "Les indicateurs suivants n'ont pas de valeur pour l'année 2015 ou avec une interpolation possible : cae_2.k, cae_2.j, cae_2.l_pcaet, impossible de calculer la trajectoire SNBC.",
        error: 'Unprocessable Entity',
        statusCode: 422,
      });
  });

  it(`Calcul sans droit suffisant (uniquement lecture)`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc?collectivite_id=3895')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        message: 'Droits insuffisants',
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it(`Verification et calcul avec donnees completes`, () => {
    // Suppression de la trajectoire snbc existante si le test est joué plusieurs fois
    request(app.getHttpServer())
      .delete('/trajectoires/snbc/verification?collectivite_id=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const verifcationReponseAttendue: VerificationDonneesSNBCResponseType = {
      status: VerificationDonneesSNBCStatus.PRET_A_CALCULER,
      epci: {
        id: 1126,
        collectivite_id: 4936,
        nom: 'Eurométropole de Strasbourg',
        siren: '246700488',
        nature: 'METRO',
      },
      donnees_entree: {
        source: 'rare',
        emissions_ges: {
          valeurs: [
            {
              identifiants_referentiel: ['cae_1.c'],
              valeur: 447868,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.d'],
              valeur: 471107,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.i'],
              valeur: 348525,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.g'],
              valeur: 28839,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.e'],
              valeur: 653598,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.f'],
              valeur: 21492,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.h'],
              valeur: 39791,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_1.j'],
              valeur: 13500,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
          ],
          identifiants_referentiel_manquants: [],
        },
        consommations_finales: {
          valeurs: [
            {
              identifiants_referentiel: ['cae_2.e'],
              valeur: 3092.7,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_2.f'],
              valeur: 3295.15,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_2.k'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_2.i'],
              valeur: 61,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_2.g', 'cae_2.h'],
              valeur: 2668.6499999999996,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_2.j'],
              valeur: 0,
              date_min: '2015-01-01',
              date_max: '2015-01-01',
            },
            {
              identifiants_referentiel: ['cae_2.l_pcaet'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
          ],
          identifiants_referentiel_manquants: ['cae_2.k', 'cae_2.l_pcaet'],
        },
        sequestrations: {
          valeurs: [
            {
              identifiants_referentiel: ['cae_63.ca'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.cb'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.da'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.cc'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.cd'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.db'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.b'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
            {
              identifiants_referentiel: ['cae_63.e'],
              valeur: null,
              date_min: null,
              date_max: null,
            },
          ],
          identifiants_referentiel_manquants: [
            'cae_63.ca',
            'cae_63.cb',
            'cae_63.da',
            'cae_63.cc',
            'cae_63.cd',
            'cae_63.db',
            'cae_63.b',
            'cae_63.e',
          ],
        },
      },
    };
    request(app.getHttpServer())
      .get(
        '/trajectoires/snbc/verification?collectivite_id=4936&epci_info=true',
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .expect(verifcationReponseAttendue);

    // Calcul de la trajectoire
    request(app.getHttpServer())
      .get('/trajectoires/snbc?collectivite_id=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .expect(trajectoireSnbcCalculRetour);

    // La vérification doit maintenant retourner "calculé"
    const verificationReponseAttendueApresCalcul: VerificationDonneesSNBCResponseType =
      {
        status: VerificationDonneesSNBCStatus.DEJA_CALCULE,
        source_donnees_entree: 'rare',
        indentifiants_referentiel_manquants_donnees_entree: [
          'cae_2.k',
          'cae_2.l_pcaet',
          'cae_63.ca',
          'cae_63.cb',
          'cae_63.da',
          'cae_63.cc',
          'cae_63.cd',
          'cae_63.db',
          'cae_63.b',
          'cae_63.e',
        ],
      };
    request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectivite_id=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .expect(verificationReponseAttendueApresCalcul);

    // Si on requête de nouveau le calcul, il doit provenir de la base de données
    const trajectoireSnbcCalculRetourExistant = _.cloneDeep(
      trajectoireSnbcCalculRetour,
    );
    trajectoireSnbcCalculRetourExistant.mode =
      CalculTrajectoireResultatMode.DONNEES_EN_BDD;
    request(app.getHttpServer())
      .get('/trajectoires/snbc?collectivite_id=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .expect(trajectoireSnbcCalculRetourExistant);
  }, 30000);

  it(`Telechargement du modele`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/modele') // Accès public, pas la peine de mettre le token
      .expect(200);
  }, 30000);

  it(`Téléchargement du fichier xlsx prérempli pour un epci avec donnees completes`, async () => {
    const response = await request(app.getHttpServer())
      .get('/trajectoires/snbc/telechargement?collectivite_id=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .responseType('blob');

    const fileName = response.headers['content-disposition']
      .split('filename=')[1]
      .split(';')[0];
    expect(fileName).toBe(
      '"Trajectoire SNBC - 246700488 - Eurome?tropole de Strasbourg.xlsx"',
    );
  }, 30000);

  afterAll(async () => {
    await app.close();
  });
});
