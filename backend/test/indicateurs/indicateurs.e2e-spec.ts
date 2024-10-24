import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { default as request } from 'supertest';
import { AppModule } from '../../src/app.module';
import { UpsertIndicateursValeursRequest } from '../../src/indicateurs/models/upsertIndicateurs.models';
import { YOLO_DODO_CREDENTIALS } from '../auth/test-users.samples';

describe('Route de lecture / ecriture des indicateurs', () => {
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
      process.env.SUPABASE_ANON_KEY!
    );
    const signinResponse = await supabase.auth.signInWithPassword(
      YOLO_DODO_CREDENTIALS
    );
    yoloDodoToken = signinResponse.data.session?.access_token || '';
  });

  afterAll(async () => {
    await app.close();
  });

  it(`Lecture sans acces`, () => {
    return request(app.getHttpServer())
      .get('/indicateurs?collectivite_id=3')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        message: 'Droits insuffisants',
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it(`Ecriture sans acces (uniquement lecture sur un des deux)`, () => {
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectivite_id: 4936,
          indicateur_id: 4,
          date_valeur: '2015-01-01',
          metadonnee_id: 1,
          resultat: 447868,
        },
        {
          collectivite_id: 3895,
          indicateur_id: 4,
          date_valeur: '2015-01-01',
          metadonnee_id: 1,
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
        message: 'Droits insuffisants',
        error: 'Unauthorized',
        statusCode: 401,
      });
  });
});
