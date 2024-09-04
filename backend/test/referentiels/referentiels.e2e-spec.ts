import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { ReferentielActionType } from '../../src/referentiels/models/referentiel-action.dto';
import { getTestApp } from '../common/app-utils';
import { GetReferentielResponseType } from '../../src/referentiels/models/get-referentiel.response';
import { ActionType } from '../../src/referentiels/models/action-type.enum';

describe('Referentiels routes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it(`Récupération publique du référentiel`, async () => {
    const response = await request(app.getHttpServer())
      .get('/referentiels/cae')
      .expect(200);
    const referentiel = response.body as GetReferentielResponseType;
    expect(referentiel.ordered_item_types).toEqual([
      ActionType.REFERENTIEL,
      ActionType.AXE,
      ActionType.SOUS_AXE,
      ActionType.ACTION,
      ActionType.SOUS_ACTION,
      ActionType.TACHE,
    ]);
    const { actions_enfant, ...referentielWithoutActionsEnfant } =
      referentiel.items_tree!;
    expect(actions_enfant.length).toBe(6);
    const {
      actions_enfant: expectedActionEnfants,
      ...referentielCaeRoot
    }: ReferentielActionType = {
      action_id: 'cae',
      action_type: 'referentiel',
      level: 0,
      nom: 'Climat Air Énergie',
      points: 500,
      pourcentage: null,
      actions_enfant: [],
    };
    expect(referentielWithoutActionsEnfant).toEqual(referentielCaeRoot);
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
