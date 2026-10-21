import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  DROM_REGION_CODE,
  setActionTemplatesForTest,
} from '@tet/backend/referentiels/action-definitions/action-definitions.test-fixture';
import { TEMPLATE_RENDER_VERSION } from '@tet/backend/referentiels/action-definitions/action-text-variant.rules';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  mergeActionDefinitionsAndState,
  ReferentielId,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import {
  getAnonUser,
  getAuthUserFromUserCredentials,
} from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

const TE_TEST: ReferentielId = 'te-test';
const ACTION_ID = 'te-test_1.1.1';
const DOM_KEY = `r${TEMPLATE_RENDER_VERSION};localisation=dom`;
const TEMPLATES = { nom: 'Suivre le {{si dom}}SAR{{sinon}}SRADDET{{/si}}' };

describe('ListActionTextOverridesRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let metropole: { collectiviteId: number; user: AuthenticatedUser };
  let dom: { collectiviteId: number; user: AuthenticatedUser };

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const metropoleFixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const domFixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: DROM_REGION_CODE },
    });
    metropole = {
      collectiviteId: metropoleFixture.collectivite.id,
      user: getAuthUserFromUserCredentials(metropoleFixture.user),
    };
    dom = {
      collectiviteId: domFixture.collectivite.id,
      user: getAuthUserFromUserCredentials(domFixture.user),
    };

    return async () => {
      await metropoleFixture.cleanup();
      await domFixture.cleanup();
      await app.close();
    };
  });

  /** Reconstitue les actions comme le fait le front */
  async function listMergedActions({
    collectiviteId,
    user,
  }: {
    collectiviteId: number;
    user: AuthenticatedUser;
  }) {
    const caller = router.createCaller({ user });
    const [definitions, state] = await Promise.all([
      caller.referentiels.actions.listActionDefinitions({
        referentielId: TE_TEST,
      }),
      caller.referentiels.actions.listActionsGroupedById({
        collectiviteId,
        referentielId: TE_TEST,
      }),
    ]);
    const textOverrides = state.textVariantKey
      ? await caller.referentiels.actions.listActionTextOverrides({
          referentielId: TE_TEST,
          referentielVersion: state.referentielVersion,
          textVariantKey: state.textVariantKey,
        })
      : undefined;
    return {
      state,
      definitions,
      merged: mergeActionDefinitionsAndState(definitions, state, textOverrides),
    };
  }

  test('l’état donne la clé de variante : null en métropole, profil DOM sinon', async () => {
    const [metropoleResult, domResult] = await Promise.all([
      listMergedActions(metropole),
      listMergedActions(dom),
    ]);
    expect(metropoleResult.state.textVariantKey).toBeNull();
    expect(domResult.state.textVariantKey).toBe(DOM_KEY);
  });

  test('chaque collectivité voit le texte de son profil, les définitions restent les mêmes', async () => {
    onTestFinished(
      await setActionTemplatesForTest(app, {
        actionId: ACTION_ID,
        templates: TEMPLATES,
      })
    );

    const [metropoleResult, domResult] = await Promise.all([
      listMergedActions(metropole),
      listMergedActions(dom),
    ]);

    expect(metropoleResult.definitions).toEqual(domResult.definitions);
    expect(domResult.definitions.definitionsById[ACTION_ID].nom).toBe(
      'Suivre le SRADDET'
    );
    expect(domResult.definitions.definitionsById[ACTION_ID]).not.toHaveProperty(
      'templates'
    );

    const metropoleNom =
      metropoleResult.merged.actionsById[ACTION_ID]?.nom ??
      metropoleResult.merged.hiddenActions.find(
        ({ actionId }) => actionId === ACTION_ID
      )?.nom;
    const domNom =
      domResult.merged.actionsById[ACTION_ID]?.nom ??
      domResult.merged.hiddenActions.find(
        ({ actionId }) => actionId === ACTION_ID
      )?.nom;
    expect(metropoleNom).toBe('Suivre le SRADDET');
    expect(domNom).toBe('Suivre le SAR');
  });

  test('accessible sans authentification', async () => {
    onTestFinished(
      await setActionTemplatesForTest(app, {
        actionId: ACTION_ID,
        templates: TEMPLATES,
      })
    );
    const caller = router.createCaller({ user: getAnonUser() });

    const result = await caller.referentiels.actions.listActionTextOverrides({
      referentielId: TE_TEST,
      referentielVersion: '0.0.0',
      textVariantKey: DOM_KEY,
    });

    expect(result.overridesById[ACTION_ID]).toEqual({ nom: 'Suivre le SAR' });
    expect(result.textVariantKey).toBe(DOM_KEY);
    // une version périmée en entrée : la réponse porte la version publiée
    const definitions = await caller.referentiels.actions.listActionDefinitions(
      {
        referentielId: TE_TEST,
      }
    );
    expect(result.referentielVersion).toBe(definitions.referentielVersion);
  });

  test('clé invalide : BAD_REQUEST', async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    await expect(
      caller.referentiels.actions.listActionTextOverrides({
        referentielId: TE_TEST,
        referentielVersion: '0.0.0',
        textVariantKey: 'r0;localisation=dom',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});
