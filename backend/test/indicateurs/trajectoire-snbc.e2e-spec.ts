import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { IndicateursModule } from '../../src/indicateurs/indicateurs.module';

describe('Calcul de trajectoire SNBC', () => {
  let app: INestApplication;
  //const indicateursService = { getIndicateursValeurs: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [IndicateursModule],
    })
      //.overrideProvider(IndicateursService)
      //.useValue(indicateursService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`Commune non supportées lors de la verification`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/verification?collectivite_id=1')
      .expect(200)
      .expect({ status: 'commune_non_supportee' });
  });

  it(`Commune non supportées`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc?collectivite_id=1')
      .expect(422)
      .expect({
        message:
          'Le calcul de trajectoire SNBC peut uniquement être effectué pour un EPCI.',
        error: 'Unprocessable Entity',
        statusCode: 422,
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
