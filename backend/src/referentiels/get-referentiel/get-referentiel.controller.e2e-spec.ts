import { getTestApp } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { ActionTypeEnum } from '../models/action-type.enum';
import { GetReferentielResponseType } from './get-referentiel.response';

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

    expect(referentiel.orderedItemTypes).toEqual([
      ActionTypeEnum.REFERENTIEL,
      ActionTypeEnum.AXE,
      ActionTypeEnum.SOUS_AXE,
      ActionTypeEnum.ACTION,
      ActionTypeEnum.SOUS_ACTION,
      ActionTypeEnum.TACHE,
    ]);

    const { actionsEnfant, ...referentielWithoutActionsEnfant } =
      referentiel.itemsTree;

    expect(actionsEnfant.length).toBe(6);

    const { actionsEnfant: expectedActionEnfants, ...referentielCaeRoot } = {
      actionId: 'cae',
      identifiant: '',
      actionType: ActionTypeEnum.REFERENTIEL,
      categorie: null,
      level: 0,
      nom: 'Climat Air Énergie',
      points: 500,
      pourcentage: null,
      actionsEnfant: [],
      tags: [],
    };

    expect(referentielWithoutActionsEnfant).toEqual(referentielCaeRoot);
  });

  it(`Référentiel inconnu`, async () => {
    await request(app.getHttpServer())
      .get('/referentiels/inconnu')
      .expect(404)
      .expect({
        message: 'Referentiel definition inconnu not found',
        error: 'Not Found',
        statusCode: 404,
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
