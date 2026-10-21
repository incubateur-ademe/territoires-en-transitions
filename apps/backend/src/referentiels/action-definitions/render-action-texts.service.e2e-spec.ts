import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  DROM_REGION_CODE,
  setActionTemplatesForTest,
} from './action-definitions.test-fixture';
import { TEMPLATE_RENDER_VERSION } from './action-text-variant.rules';
import { RenderActionTextsService } from './render-action-texts.service';

const TE_TEST: ReferentielId = 'te-test';
const ACTION_ID = 'te-test_1.1.1';
const DOM_KEY = `r${TEMPLATE_RENDER_VERSION};localisation=dom`;

describe('RenderActionTextsService', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let service: RenderActionTextsService;
  let collectiviteMetropoleId: number;
  let collectiviteDomId: number;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    service = app.get(RenderActionTextsService);

    const metropole = await addTestCollectivite(databaseService);
    const dom = await addTestCollectivite(databaseService, {
      regionCode: DROM_REGION_CODE,
    });
    collectiviteMetropoleId = metropole.collectivite.id;
    collectiviteDomId = dom.collectivite.id;

    return async () => {
      await metropole.cleanup();
      await dom.cleanup();
      await app.close();
    };
  });

  test('clé de variante : null en métropole, profil DOM sinon', async () => {
    expect(await service.getTextVariantKey(collectiviteMetropoleId)).toBeNull();
    expect(await service.getTextVariantKey(collectiviteDomId)).toBe(DOM_KEY);
  });

  test('surcharges d’une variante : seuls les champs qui diffèrent du défaut', async () => {
    onTestFinished(
      await setActionTemplatesForTest(app, {
        actionId: ACTION_ID,
        templates: {
          nom: 'Suivre le {{si dom}}SAR{{sinon}}SRADDET{{/si}}',
          description: 'Identique{{si dom}}{{/si}} partout',
        },
      })
    );

    const result = await service.getTextOverridesForVariant(TE_TEST, DOM_KEY);
    if (!result.success) {
      throw new Error(result.error);
    }
    expect(result.data.overridesById[ACTION_ID]).toEqual({
      nom: 'Suivre le SAR',
    });
    expect(result.data.referentielVersion).toBeTruthy();
  });

  test('clé invalide', async () => {
    const result = await service.getTextOverridesForVariant(
      TE_TEST,
      'r0;localisation=dom'
    );
    expect(result).toMatchObject({
      success: false,
      error: 'INVALID_TEXT_VARIANT_KEY',
    });
  });

  test('applyNomOverrides ne touche que les lignes surchargées, et rien en métropole', async () => {
    onTestFinished(
      await setActionTemplatesForTest(app, {
        actionId: ACTION_ID,
        templates: { nom: 'Suivre le {{si dom}}SAR{{sinon}}SRADDET{{/si}}' },
      })
    );
    const rows = [
      { actionId: ACTION_ID, nom: 'Suivre le SRADDET' },
      { actionId: 'te-test_1.1', nom: 'Autre' },
      { actionId: null, nom: 'Sans action' },
    ];
    const accessors = {
      getActionId: (row: (typeof rows)[number]) => row.actionId,
      setNom: (row: (typeof rows)[number], nom: string) => ({ ...row, nom }),
    };

    expect(
      await service.applyNomOverrides(collectiviteDomId, rows, accessors)
    ).toEqual([
      { actionId: ACTION_ID, nom: 'Suivre le SAR' },
      { actionId: 'te-test_1.1', nom: 'Autre' },
      { actionId: null, nom: 'Sans action' },
    ]);
    expect(
      await service.applyNomOverrides(collectiviteMetropoleId, rows, accessors)
    ).toBe(rows);
  });
});
