import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { ReferentielActionType } from '../../src/referentiels/models/referentiel-action.dto';
import { getTestApp } from '../common/app-utils';

describe('Referentiels routes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it(`Récupération publique du référentiel`, async () => {
    const response = await request(app.getHttpServer())
      .get('/referentiels/cae')
      .expect(200);
    const referentiel = response.body as ReferentielActionType;
    const { actions_enfant, ...referentielWithoutActionsEnfant } = referentiel;
    expect(actions_enfant.length).toBe(6);
    expect(referentielWithoutActionsEnfant).toEqual({
      action_id: 'cae',
      action_type: 'referentiel',
      level: 0,
      nom: 'Climat Air Énergie',
      points: 500,
      pourcentage: null,
    });
  });

  it(`Référentiel inconnu`, async () => {
    const response = await request(app.getHttpServer())
      .get('/referentiels/inconnu')
      .expect(404)
      .expect({
        message: 'Referentiel inconnu not found',
        error: 'Not Found',
        statusCode: 404,
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
