import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import {
  collectiviteDefaultModuleKeysSchema,
  ModuleFicheCountBy,
  ModuleFicheCountByCreate,
} from '@tet/domain/collectivites/tableau-de-bord';
import { CollectiviteRole } from '@tet/domain/users';
import { cloneDeep } from 'es-toolkit';

describe('TableauDeBordCollectiviteRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let adminCollectivite: Collectivite;
  let editionCollectivite: Collectivite;
  let visitCollectivite: Collectivite;
  let collectiviteCleanups: (() => Promise<void>)[];

  let moduleNew: ModuleFicheCountByCreate;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);
    collectiviteCleanups = [];

    // Create a test user
    const userResult = await addTestUser(db);
    authenticatedUser = getAuthUserFromUserCredentials(userResult.user);

    // Create 3 collectivites with different access levels
    const adminResult = await addTestCollectivite(db);
    adminCollectivite = adminResult.collectivite;
    collectiviteCleanups.push(adminResult.cleanup);
    await setUserCollectiviteRole(db, {
      userId: userResult.user.id,
      collectiviteId: adminCollectivite.id,
      role: CollectiviteRole.ADMIN,
    });

    const editionResult = await addTestCollectivite(db);
    editionCollectivite = editionResult.collectivite;
    collectiviteCleanups.push(editionResult.cleanup);
    await setUserCollectiviteRole(db, {
      userId: userResult.user.id,
      collectiviteId: editionCollectivite.id,
      role: CollectiviteRole.EDITION,
    });

    const visitResult = await addTestCollectivite(db);
    visitCollectivite = visitResult.collectivite;
    collectiviteCleanups.push(visitResult.cleanup);
    // No role set → visitor access

    moduleNew = {
      id: crypto.randomUUID(),
      collectiviteId: editionCollectivite.id,
      titre: 'Actions par priorité',
      type: 'fiche-action.count-by',
      options: {
        countByProperty: 'priorite',
        filtre: {
          statuts: ['En retard', 'En cours'],
        },
      },
    };
  });

  afterAll(async () => {
    for (const cleanup of collectiviteCleanups) {
      await cleanup?.();
    }
    await app.close();
  });

  test('authenticated with edition access, list default modules', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const moduleList = await caller.collectivites.tableauDeBord.list({
      collectiviteId: editionCollectivite.id,
    });

    expect(moduleList).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length
    );

    expect(moduleList?.[0]).toMatchObject({
      titre: /plans/i,
      type: 'plan-action.list',
      options: expect.any(Object),
    });

    expect(moduleList?.[1]).toMatchObject({
      titre: /statut/i,
      type: 'fiche-action.count-by',
      options: expect.objectContaining({
        filtre: expect.any(Object),
      }),
    });

    expect(moduleList?.[2]).toMatchObject({
      titre: /priorité/i,
      type: 'fiche-action.count-by',
      options: expect.objectContaining({
        filtre: expect.any(Object),
      }),
    });

    expect(moduleList?.[3]).toMatchObject({
      titre: /pilote/i,
      type: 'fiche-action.count-by',
      options: expect.objectContaining({
        filtre: expect.any(Object),
      }),
    });

    expect(moduleList?.[4]).toMatchObject({
      titre: /référent'/i,
      type: 'fiche-action.count-by',
      options: expect.objectContaining({
        filtre: expect.any(Object),
      }),
    });
  });

  test('authenticated with visit access, list default modules', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const moduleList = await caller.collectivites.tableauDeBord.list({
      collectiviteId: visitCollectivite.id,
    });

    expect(moduleList).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length
    );

    expect(moduleList?.[0]).toMatchObject({
      titre: /plans/i,
      type: 'plan-action.list',
      options: expect.any(Object),
    });

    expect(moduleList?.[1]).toMatchObject({
      titre: /statut/i,
      type: 'fiche-action.count-by',
      options: expect.objectContaining({
        filtre: expect.any(Object),
      }),
    });

    expect(moduleList?.[2]).toMatchObject({
      titre: /priorité/i,
      type: 'fiche-action.count-by',
      options: expect.objectContaining({
        filtre: expect.any(Object),
      }),
    });

    expect(moduleList?.[3]).toMatchObject({
      titre: /pilote/i,
      type: 'fiche-action.count-by',
      options: expect.objectContaining({
        filtre: expect.any(Object),
      }),
    });

    expect(moduleList?.[4]).toMatchObject({
      titre: /référent'/i,
      type: 'fiche-action.count-by',
      options: expect.objectContaining({
        filtre: expect.any(Object),
      }),
    });
  });

  test('not authenticated, list default modules', async () => {
    const caller = router.createCaller({ user: null });

    await expect(async () => {
      await caller.collectivites.tableauDeBord.list({
        collectiviteId: editionCollectivite.id,
      });
    }).rejects.toThrowError(/not authenticated/i);
  });

  test('authenticated with edition access, try to add a module', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const moduleToUpsert = cloneDeep(moduleNew);
    moduleToUpsert.collectiviteId = editionCollectivite.id;

    await expect(async () => {
      await caller.collectivites.tableauDeBord.upsert(moduleToUpsert);
    }).rejects.toThrowError(/Droits insuffisants/i);
  });

  test('authenticated with admin access, add a new module, delete module', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const newModuleToUpsert = cloneDeep(moduleNew);
    newModuleToUpsert.collectiviteId = adminCollectivite.id;

    await caller.collectivites.tableauDeBord.upsert(newModuleToUpsert);

    const moduleList = await caller.collectivites.tableauDeBord.list({
      collectiviteId: adminCollectivite.id,
    });

    expect(moduleList).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length + 1
    );

    const createdModule = moduleList?.find(
      (module) => module.id === newModuleToUpsert.id
    );
    expect(createdModule).toMatchObject(newModuleToUpsert);

    await caller.collectivites.tableauDeBord.delete({
      collectiviteId: adminCollectivite.id,
      moduleId: createdModule?.id ?? '',
    });

    const moduleListAfterDelete = await caller.collectivites.tableauDeBord.list(
      {
        collectiviteId: adminCollectivite.id,
      }
    );
    expect(moduleListAfterDelete).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length
    );
  });

  test('authenticated with admin access, personnalize a default module', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const moduleList = await caller.collectivites.tableauDeBord.list({
      collectiviteId: adminCollectivite.id,
    });
    expect(moduleList).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length
    );

    const moduleToPersonnalize = moduleList?.find(
      (module) =>
        module.defaultKey ===
        collectiviteDefaultModuleKeysSchema.enum['fiche-actions-par-statut']
    ) as ModuleFicheCountBy | undefined;

    if (!moduleToPersonnalize) {
      throw new Error('Module to personnalize not found');
    }

    moduleToPersonnalize.titre = 'Actions par priorité';
    moduleToPersonnalize.options.countByProperty = 'priorite';

    await caller.collectivites.tableauDeBord.upsert(moduleToPersonnalize);

    const moduleListAfterCreation =
      await caller.collectivites.tableauDeBord.list({
        collectiviteId: adminCollectivite.id,
      });

    const foundModuleToPersonnalize = moduleListAfterCreation?.find(
      (module) => module.id === moduleToPersonnalize?.id
    ) as ModuleFicheCountBy | undefined;

    if (!foundModuleToPersonnalize) {
      throw new Error('Module to personnalize after creation not found');
    }

    expect(foundModuleToPersonnalize.options.countByProperty).toEqual(
      moduleToPersonnalize.options.countByProperty
    );

    // Delete the personnalization
    await caller.collectivites.tableauDeBord.delete({
      collectiviteId: adminCollectivite.id,
      moduleId: moduleToPersonnalize.id,
    });

    // Module should be back to default but still here
    const moduleListAfterDelete = await caller.collectivites.tableauDeBord.list(
      {
        collectiviteId: adminCollectivite.id,
      }
    );
    expect(moduleListAfterDelete).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length
    );
  });
});
