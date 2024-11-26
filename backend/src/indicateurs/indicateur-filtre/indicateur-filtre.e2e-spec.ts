import { INestApplication } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { YOLO_DODO_CREDENTIALS } from '../../../test/auth/test-users.samples';
import { default as request } from 'supertest';
import {
  GetFilteredIndicateurRequestQueryOptionType,
  GetFilteredIndicateursRequestOptionType,
} from '@tet/backend/indicateurs/indicateur-filtre/get-filtered-indicateurs.request';
import { getFilteredIndicateursResponseSchema } from '@tet/backend/indicateurs/indicateur-filtre/get-filtered-indicateurs.response';

describe('Route de lecture des indicateurs filtrés', () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let yoloDodoToken: string;
  const queryOptions: GetFilteredIndicateurRequestQueryOptionType = {
    page: 1,
    limit: 10,
    sort: [
      {
        field: 'estComplet',
        direction: 'asc',
      },
    ],
  };

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

  it(`Test que la requête s'exécute sans filtres`, async () => {
    const options: GetFilteredIndicateursRequestOptionType = {};

    const params = new URLSearchParams();
    params.append('collectiviteId', '1');
    params.append('options', JSON.stringify(options));
    params.append('queryOptions', JSON.stringify(queryOptions));

    const result = await request(app.getHttpServer())
      .get(`/indicateurs/filtre?${params.toString()}`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    const toCheck = getFilteredIndicateursResponseSchema.safeParse(result.body);
    expect(toCheck.success).toBeTruthy;
  });

  it(`Test que la requête s'exécute avec tous les filtres`, async () => {
    const options: GetFilteredIndicateursRequestOptionType = {
      actionId: 'eci_2',
      participationScore: false,
      estComplet: false,
      estConfidentiel: true,
      estFavorisCollectivite: true,
      fichesNonClassees: true,
      text: 'de',
      estPerso: false,
      categorieNoms: ['cae'],
      hasOpenData: true,
      thematiqueIds: [1],
      planActionIds: [1],
      utilisateurPiloteIds: ['t'],
      personnePiloteIds: [1],
      servicePiloteIds: [1],
      ficheActionIds: [1],
      withChildren: false,
    };

    const params = new URLSearchParams();
    params.append('collectiviteId', '1');
    params.append('options', JSON.stringify(options));
    params.append('queryOptions', JSON.stringify(queryOptions));

    await request(app.getHttpServer())
      .get(`/indicateurs/filtre?${params.toString()}`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
  });
});
