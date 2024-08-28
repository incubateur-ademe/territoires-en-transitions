import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  VerificationDonneesSNBCResponse,
  VerificationDonneesSNBCStatus,
} from '../../src/indicateurs/models/verificationDonneesTrajectoire.models';
import { YOLO_DODO_CREDENTIALS } from '../auth/test-users.samples';

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
    const verifcationReponseAttendue: VerificationDonneesSNBCResponse = {
      status: VerificationDonneesSNBCStatus.DONNEES_MANQUANTES,
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
      },
    };
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectivite_id=3829')
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
    // TODO: suppression de la trajectoire snbc existante si le test est joué plusieurs fois
    const verifcationReponseAttendue: VerificationDonneesSNBCResponse = {
      status: VerificationDonneesSNBCStatus.PRET_A_CALCULER,
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
      },
    };
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectivite_id=4936')
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
      .expect(200)
      .expect(verifcationReponseAttendue);
  });

  it(`Telechargement du modele`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/modele') // Accès public, pas la peine de mettre le token
      .expect(200);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });
});
