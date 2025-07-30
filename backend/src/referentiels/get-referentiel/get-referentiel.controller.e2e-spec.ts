import { ListReferentielsResponseClass } from '@/backend/referentiels/get-referentiel/get-referentiel.controller';
import { ReferentielIdEnum } from '@/backend/referentiels/models/referentiel-id.enum';
import { getTestApp } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import { ISO_8601_DATE_TIME_REGEX } from 'backend/test/vitest-matchers';
import { default as request } from 'supertest';
import { ActionTypeEnum } from '../models/action-type.enum';
import { ReferentielResponse } from './get-referentiel.service';

describe('Referentiels routes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
  });

  test(`Récupération publique de la liste des définitions de référentiel`, async () => {
    const response = await request(app.getHttpServer())
      .get('/referentiels')
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          referentiels: expect.any(Array),
        });
      });

    const referentiels = response.body as ListReferentielsResponseClass;
    const caeReferentiel = referentiels.referentiels.find(
      (referentiel) => referentiel.id === ReferentielIdEnum.CAE
    );

    expect(caeReferentiel).toEqual({
      createdAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      modifiedAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      nom: 'Climat Air Energie',
      hierarchie: [
        'referentiel',
        'axe',
        'sous-axe',
        'action',
        'sous-action',
        'tache',
      ],
      id: 'cae',
      locked: false,
      version: expect.any(String),
    });
  });

  test(`Récupération publique du référentiel`, async () => {
    const response = await request(app.getHttpServer())
      .get('/referentiels/cae')
      .expect(200);
    const referentiel = response.body as ReferentielResponse;

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
