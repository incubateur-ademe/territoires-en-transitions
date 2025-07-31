import { collectiviteDefaultModuleKeysSchema } from '@/backend/collectivites/tableau-de-bord/collectivite-default-module-keys.schema';
import { CreateModuleFicheActionCountByType } from '@/backend/collectivites/tableau-de-bord/module-fiche-action-count-by.schema';
import { getAuthUser, getTestRouter } from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { cloneDeep } from 'es-toolkit';

export const moduleNew: CreateModuleFicheActionCountByType = {
  id: '6957441c-c083-44f8-a464-65174e5438f2',
  collectiviteId: 2,
  titre: 'Actions par priorité',
  type: 'fiche-action.count-by',
  options: {
    countByProperty: 'priorite',
    filtre: {
      statuts: ['En retard', 'En cours'],
    },
  },
};

describe('TableauDeBordCollectiviteRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
  });

  test('authenticated with edition access, list default modules', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const moduleList = await caller.collectivites.tableauDeBord.list({
      collectiviteId: 2,
    });

    expect(moduleList).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length
    );

    expect(moduleList?.[0]).toMatchObject({
      titre: /plans d'action/i,
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
    const caller = router.createCaller({ user: yoloDodoUser });

    const moduleList = await caller.collectivites.tableauDeBord.list({
      collectiviteId: 3,
    });

    expect(moduleList).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length
    );

    expect(moduleList?.[0]).toMatchObject({
      titre: /plans d'action/i,
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
        collectiviteId: 2,
      });
    }).rejects.toThrowError(/not authenticated/i);
  });

  test('authenticated with edition access, try to add a module', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const moduleToUpsert = cloneDeep(moduleNew);
    moduleToUpsert.collectiviteId = 2;

    await expect(async () => {
      await caller.collectivites.tableauDeBord.upsert(moduleToUpsert);
    }).rejects.toThrowError(/Droits insuffisants/i);
  });

  test('authenticated with addmin access, add a new module, delete module', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const newModuleToUpsert = cloneDeep(moduleNew);
    newModuleToUpsert.collectiviteId = 1;

    await caller.collectivites.tableauDeBord.upsert(newModuleToUpsert);

    const moduleList = await caller.collectivites.tableauDeBord.list({
      collectiviteId: 1,
    });

    expect(moduleList).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length + 1
    );

    const createdModule = moduleList?.find(
      (module) => module.id === newModuleToUpsert.id
    );
    expect(createdModule).toMatchObject(newModuleToUpsert);

    await caller.collectivites.tableauDeBord.delete({
      collectiviteId: 1,
      moduleId: createdModule!.id,
    });

    const moduleListAfterDelete = await caller.collectivites.tableauDeBord.list(
      {
        collectiviteId: 1,
      }
    );
    expect(moduleListAfterDelete).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length
    );
  });

  test('authenticated with addmin access, personnalize a default module', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const moduleList = await caller.collectivites.tableauDeBord.list({
      collectiviteId: 1,
    });
    expect(moduleList).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length
    );

    const moduleToPersonnalize = moduleList?.find(
      (module) =>
        module.defaultKey ===
        collectiviteDefaultModuleKeysSchema.enum['fiche-actions-par-statut']
    ) as ModuleFicheActionCountByType | undefined;
    moduleToPersonnalize!.titre = 'Actions par priorité';
    moduleToPersonnalize!.options.countByProperty = 'priorite';

    await caller.collectivites.tableauDeBord.upsert(moduleToPersonnalize!);

    const moduleListAfterCreation =
      await caller.collectivites.tableauDeBord.list({
        collectiviteId: 1,
      });

    const foundModuleToPersonnalize = moduleListAfterCreation?.find(
      (module) => module.id === moduleToPersonnalize!.id
    ) as ModuleFicheActionCountByType | undefined;

    expect(foundModuleToPersonnalize?.options.countByProperty).toMatchObject(
      moduleToPersonnalize!.options.countByProperty
    );

    // Delete the personnalization
    await caller.collectivites.tableauDeBord.delete({
      collectiviteId: 1,
      moduleId: moduleToPersonnalize!.id,
    });

    // Module should be back to default but still here
    const moduleListAfterDelete = await caller.collectivites.tableauDeBord.list(
      {
        collectiviteId: 1,
      }
    );
    expect(moduleListAfterDelete).toHaveLength(
      collectiviteDefaultModuleKeysSchema.options.length
    );
  });
});
