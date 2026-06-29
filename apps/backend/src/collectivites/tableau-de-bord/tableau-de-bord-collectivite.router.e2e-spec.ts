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
  personalDefaultModuleKeysSchema,
} from '@tet/domain/collectivites/tableau-de-bord';
import { CollectiviteRole } from '@tet/domain/users';
import { cloneDeep } from 'es-toolkit';

describe('TableauDeBordCollectiviteRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  // Second utilisateur ayant aussi les droits d'édition sur `editionCollectivite`,
  // utilisé pour vérifier qu'on ne peut pas modifier le module d'un autre user.
  let otherEditionUser: AuthenticatedUser;
  let adminCollectivite: Collectivite;
  let editionCollectivite: Collectivite;
  let visitCollectivite: Collectivite;

  let moduleNew: ModuleFicheCountByCreate;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    // Create a test user
    const userResult = await addTestUser(db);
    authenticatedUser = getAuthUserFromUserCredentials(userResult.user);

    // Create 3 collectivites with different access levels
    const adminResult = await addTestCollectivite(db);
    adminCollectivite = adminResult.collectivite;
    await setUserCollectiviteRole(db, {
      userId: userResult.user.id,
      collectiviteId: adminCollectivite.id,
      role: CollectiviteRole.ADMIN,
    });

    const editionResult = await addTestCollectivite(db);
    editionCollectivite = editionResult.collectivite;
    await setUserCollectiviteRole(db, {
      userId: userResult.user.id,
      collectiviteId: editionCollectivite.id,
      role: CollectiviteRole.EDITION,
    });

    // Second utilisateur en édition sur la même collectivité
    const otherUserResult = await addTestUser(db);
    otherEditionUser = getAuthUserFromUserCredentials(otherUserResult.user);
    await setUserCollectiviteRole(db, {
      userId: otherUserResult.user.id,
      collectiviteId: editionCollectivite.id,
      role: CollectiviteRole.EDITION,
    });

    const visitResult = await addTestCollectivite(db);
    visitCollectivite = visitResult.collectivite;
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

  test('listPersonnel: returns the default personal modules', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const moduleList = await caller.collectivites.tableauDeBord.listPersonnel({
      collectiviteId: editionCollectivite.id,
    });

    expect(moduleList).toHaveLength(
      personalDefaultModuleKeysSchema.options.length
    );

    expect(moduleList[0]).toMatchObject({
      type: 'indicateur.list',
      defaultKey: 'indicateurs-dont-je-suis-pilote',
      userId: authenticatedUser.id,
    });
    expect(moduleList[1]).toMatchObject({
      type: 'fiche_action.list',
      defaultKey: 'actions-dont-je-suis-pilote',
    });
    expect(moduleList[2]).toMatchObject({
      type: 'fiche_action.list',
      defaultKey: 'sous-actions-dont-je-suis-pilote',
    });
    expect(moduleList[3]).toMatchObject({
      type: 'mesure.list',
      defaultKey: 'mesures-dont-je-suis-pilote',
    });
  });

  test('getPersonnel: returns a default personal module for a given key', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const module = await caller.collectivites.tableauDeBord.getPersonnel({
      collectiviteId: editionCollectivite.id,
      defaultKey: 'mesures-dont-je-suis-pilote',
    });

    expect(module).toMatchObject({
      type: 'mesure.list',
      defaultKey: 'mesures-dont-je-suis-pilote',
      userId: authenticatedUser.id,
    });
  });

  test('listPersonnel: not authenticated throws', async () => {
    const caller = router.createCaller({ user: null });

    await expect(async () => {
      await caller.collectivites.tableauDeBord.listPersonnel({
        collectiviteId: editionCollectivite.id,
      });
    }).rejects.toThrowError(/not authenticated/i);
  });

  describe('upsertPersonnel (save)', () => {
    test('edition access: crée puis met à jour un module personnel', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const moduleId = crypto.randomUUID();
      const moduleToSave = {
        id: moduleId,
        collectiviteId: editionCollectivite.id,
        titre: 'Mes actions filtrées',
        type: 'fiche_action.list' as const,
        defaultKey:
          personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote'],
        options: {
          filtre: {
            utilisateurPiloteIds: [authenticatedUser.id],
          },
        },
      };

      const saved = await caller.collectivites.tableauDeBord.upsertPersonnel(
        moduleToSave
      );

      expect(saved).toMatchObject({
        id: moduleId,
        userId: authenticatedUser.id,
        titre: 'Mes actions filtrées',
        type: 'fiche_action.list',
        defaultKey: 'actions-dont-je-suis-pilote',
      });
      // Le filtre est bien persisté (et relu) en camelCase
      expect(saved.options.filtre).toMatchObject({
        utilisateurPiloteIds: [authenticatedUser.id],
      });

      // getPersonnel renvoie désormais le module personnalisé (et non le défaut)
      const fetched = await caller.collectivites.tableauDeBord.getPersonnel({
        collectiviteId: editionCollectivite.id,
        defaultKey: 'actions-dont-je-suis-pilote',
      });
      expect(fetched.id).toEqual(moduleId);
      expect(fetched.titre).toEqual('Mes actions filtrées');

      // Mise à jour du même module (même id) → pas de doublon
      const updated = await caller.collectivites.tableauDeBord.upsertPersonnel({
        ...moduleToSave,
        titre: 'Titre mis à jour',
      });
      expect(updated.id).toEqual(moduleId);
      expect(updated.titre).toEqual('Titre mis à jour');

      // listPersonnel contient toujours les 4 modules, avec le module personnalisé
      const moduleList = await caller.collectivites.tableauDeBord.listPersonnel({
        collectiviteId: editionCollectivite.id,
      });
      expect(moduleList).toHaveLength(
        personalDefaultModuleKeysSchema.options.length
      );
      const actionsModule = moduleList.find(
        (m) => m.defaultKey === 'actions-dont-je-suis-pilote'
      );
      expect(actionsModule).toMatchObject({
        id: moduleId,
        titre: 'Titre mis à jour',
      });
    });

    test("ownership: un autre utilisateur ne peut pas modifier le module d'un user", async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const moduleId = crypto.randomUUID();
      await caller.collectivites.tableauDeBord.upsertPersonnel({
        id: moduleId,
        collectiviteId: editionCollectivite.id,
        titre: 'Sous-actions de authenticatedUser',
        type: 'fiche_action.list' as const,
        defaultKey:
          personalDefaultModuleKeysSchema.enum[
            'sous-actions-dont-je-suis-pilote'
          ],
        options: {
          filtre: {
            utilisateurPiloteIds: [authenticatedUser.id],
            onlyChildren: true,
          },
        },
      });

      const otherCaller = router.createCaller({ user: otherEditionUser });
      await expect(async () => {
        await otherCaller.collectivites.tableauDeBord.upsertPersonnel({
          id: moduleId,
          collectiviteId: editionCollectivite.id,
          titre: 'Tentative usurpation',
          type: 'fiche_action.list' as const,
          defaultKey:
            personalDefaultModuleKeysSchema.enum[
              'sous-actions-dont-je-suis-pilote'
            ],
          options: {
            filtre: {
              utilisateurPiloteIds: [otherEditionUser.id],
              onlyChildren: true,
            },
          },
        });
      }).rejects.toThrowError(/appartient à un autre utilisateur/i);
    });

    test('visit access: ne peut pas enregistrer de module personnel', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      await expect(async () => {
        await caller.collectivites.tableauDeBord.upsertPersonnel({
          id: crypto.randomUUID(),
          collectiviteId: visitCollectivite.id,
          titre: 'Interdit',
          type: 'fiche_action.list' as const,
          defaultKey:
            personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote'],
          options: {
            filtre: {
              utilisateurPiloteIds: [authenticatedUser.id],
            },
          },
        });
      }).rejects.toThrowError(/Droits insuffisants/i);
    });

    test('not authenticated: upsertPersonnel throws', async () => {
      const caller = router.createCaller({ user: null });

      await expect(async () => {
        await caller.collectivites.tableauDeBord.upsertPersonnel({
          id: crypto.randomUUID(),
          collectiviteId: editionCollectivite.id,
          titre: 'Interdit',
          type: 'fiche_action.list' as const,
          defaultKey:
            personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote'],
          options: {
            filtre: {
              utilisateurPiloteIds: [authenticatedUser.id],
            },
          },
        });
      }).rejects.toThrowError(/not authenticated/i);
    });
  });
});
