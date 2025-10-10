import { ReferentielIdEnum } from '@/backend/referentiels/models/referentiel-id.enum';
import { getTestApp, ISO_8601_DATE_TIME_REGEX } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { ReferentielResponse } from '../../get-referentiel/get-referentiel.service';
import { ActionTypeEnum } from '../../models/action-type.enum';
import { GetReferentielDefinitionOutput } from './get-referentiel-definition.output';

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
        expect(res.body).toMatchObject(expect.any(Array));
      });

    const referentiels = response.body as GetReferentielDefinitionOutput[];

    const caeReferentiel = referentiels.find(
      (referentiel) => referentiel.id === ReferentielIdEnum.CAE
    );

    expect(caeReferentiel).toEqual({
      modifiedAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      nom: 'Climat Air Énergie',
      hierarchie: [
        'referentiel',
        'axe',
        'sous-axe',
        'action',
        'sous-action',
        'tache',
      ],
      id: 'cae',
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

    // vérifie le tri des lignes par actionId
    // (1.2.3.2.1 doit être suivie de 1.2.3.2.2 et non pas 1.2.3.2.10)
    expect(
      actionsEnfant[0]?.actionsEnfant[1]?.actionsEnfant[2]?.actionsEnfant[1]
        ?.actionsEnfant[0]?.actionId
    ).toEqual('cae_1.2.3.2.1');
    expect(
      actionsEnfant[0]?.actionsEnfant[1]?.actionsEnfant[2]?.actionsEnfant[1]
        ?.actionsEnfant[1]?.actionId
    ).toEqual('cae_1.2.3.2.2');
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
