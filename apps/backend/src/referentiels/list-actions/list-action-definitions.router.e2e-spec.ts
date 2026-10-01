import { INestApplication } from '@nestjs/common';
import {
  ActionCategorieEnum,
  ActionTypeEnum,
  ReferentielIdEnum,
  ReferentielLabelEnum,
} from '@tet/domain/referentiels';
import { getTestApp, getTestRouter } from '../../../test/app-utils';
import { getAnonUser } from '../../../test/auth-utils';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

describe('ListActionDefinitionsRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);

    return async () => {
      await app.close();
    };
  });

  test('accessible sans authentification', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    const result = await caller.referentiels.actions.listActionDefinitions({
      referentielId: ReferentielIdEnum.ECI,
    });

    expect(Object.keys(result.definitionsById).length).toBeGreaterThan(0);
  });

  test('renvoie la version publiée du référentiel', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    const [result, referentiel] = await Promise.all([
      caller.referentiels.actions.listActionDefinitions({
        referentielId: ReferentielIdEnum.CAE,
      }),
      caller.referentiels.definitions.get({
        referentielId: ReferentielIdEnum.CAE,
      }),
    ]);

    expect(result.referentielVersion).toBe(referentiel.version);
    for (const definition of Object.values(result.definitionsById)) {
      expect(definition.referentielVersion).toBe(referentiel.version);
    }
  });

  test('définitions ECI', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    const { definitionsById } =
      await caller.referentiels.actions.listActionDefinitions({
        referentielId: ReferentielIdEnum.ECI,
      });

    const actionTypes: string[] = [
      ActionTypeEnum.AXE,
      ActionTypeEnum.ACTION,
      ActionTypeEnum.SOUS_ACTION,
    ];
    expect(
      Object.values(definitionsById).filter((definition) =>
        actionTypes.includes(definition.actionType)
      )
    ).toHaveLength(106);

    expect(definitionsById['eci_1']).toMatchObject({
      actionId: 'eci_1',
      referentiel: 'eci',
      referentielId: ReferentielIdEnum.ECI,
      depth: 1,
      actionType: ActionTypeEnum.AXE,
      identifiant: '1',
      nom: "Définition d'une stratégie globale de la politique économie circulaire et inscription dans le territoire",
      description: '',
      exemples: '',
      questionIds: [],
      labels: [],
      categorie: null,
    });

    expect(definitionsById['eci_1.1']).toMatchObject({
      actionId: 'eci_1.1',
      depth: 2,
      actionType: ActionTypeEnum.ACTION,
      identifiant: '1.1',
      nom: 'Définir une stratégie globale de la politique Economie Circulaire et assurer un portage politique fort',
      description: expect.any(String),
      exemples: expect.any(String),
      categorie: null,
    });

    expect(definitionsById['eci_1.1.1']).toMatchObject({
      actionId: 'eci_1.1.1',
      depth: 3,
      actionType: ActionTypeEnum.SOUS_ACTION,
      identifiant: '1.1.1',
      nom: "S'engager politiquement et mettre en place des moyens",
      categorie: ActionCategorieEnum.BASES,
    });

    // les données dynamiques ne sont pas renvoyées
    expect(definitionsById['eci_1']).not.toHaveProperty('score');
    expect(definitionsById['eci_1']).not.toHaveProperty('pilotes');
    expect(definitionsById['eci_1']).not.toHaveProperty('childrenIds');
  });

  test('définitions CAE jusqu’au niveau tâche', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    const { definitionsById } =
      await caller.referentiels.actions.listActionDefinitions({
        referentielId: ReferentielIdEnum.CAE,
      });

    expect(definitionsById['cae_1.1.1.1']).toMatchObject({
      actionId: 'cae_1.1.1.1',
      identifiant: '1.1.1.1',
      nom: 'Formaliser la vision et les engagements',
      depth: 4,
      actionType: ActionTypeEnum.SOUS_ACTION,
      categorie: ActionCategorieEnum.BASES,
      questionIds: [],
      labels: [],
    });

    expect(definitionsById['cae_1.1.1.1.1']).toMatchObject({
      actionId: 'cae_1.1.1.1.1',
      identifiant: '1.1.1.1.1',
      nom: 'Formaliser une vision et des engagements dans une décision de politique générale (délibération)',
      depth: 5,
      actionType: ActionTypeEnum.TACHE,
      categorie: null,
    });
  });

  test('labels et questions TE', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    const { definitionsById } =
      await caller.referentiels.actions.listActionDefinitions({
        referentielId: ReferentielIdEnum.TE,
      });

    expect(definitionsById['te_1.1.1']).toMatchObject({
      questionIds: ['PCAET_1'],
      labels: expect.arrayContaining([ReferentielLabelEnum.TE_CAE]),
    });
  });
});
