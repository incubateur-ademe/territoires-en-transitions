import { instanceGouvernanceTagTable } from '@tet/backend/collectivites/tags/instance-gouvernance.table';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { ficheActionInstanceGouvernanceTableTag } from '@tet/backend/plans/fiches/shared/models/fiche-action-instance-gouvernance';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
  YOULOU_DOUDOU
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { InstanceGouvernance } from '@tet/domain/collectivites';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { createInstanceGouvernanceTagAndCleanupFunction } from './handle-instance-gouvernance.test-fixture';

type CreateInput = inferProcedureInput<
  AppRouter['collectivites']['tags']['instanceGouvernance']['create']
>;
type ListInput = inferProcedureInput<
  AppRouter['collectivites']['tags']['instanceGouvernance']['list']
>;
type UpdateInput = inferProcedureInput<
  AppRouter['collectivites']['tags']['instanceGouvernance']['update']
>;
type DeleteInput = inferProcedureInput<
  AppRouter['collectivites']['tags']['instanceGouvernance']['delete']
>;

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.admin;

describe('InstanceGouvernanceRouter', () => {
  let router: TrpcRouter;
  let db: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);
  });

  test('list: rejects when user has no rights on collectivite', async () => {
    const userWithNoRights = await getAuthUser(YOLO_DODO);
    const caller = router.createCaller({ user: userWithNoRights });

    const input: ListInput = {
      collectiviteId: 9999,
    };

    await expect(async () => {
      await caller.collectivites.tags.instanceGouvernance.list(input);
    }).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });

  test('create / list / update / delete: happy path', async () => {
    // YOULOU_DOUDOU has EDITION rights on COLLECTIVITE_ID (1)
    const userWithRights = await getAuthUser(YOULOU_DOUDOU);
    const caller = router.createCaller({ user: userWithRights });

    const createInput: CreateInput = {
      collectiviteId: COLLECTIVITE_ID,
      nom: 'Comité de pilotage test',
    };

    const { instanceGouvernanceTagId, instanceGouvernanceTagCleanup } =
      await createInstanceGouvernanceTagAndCleanupFunction({
        caller,
        instanceGouvernanceTagInput: createInput,
      });

    const createdId = instanceGouvernanceTagId;

    // Vérifie que l'instance apparaît bien dans la liste
    const listInput: ListInput = {
      collectiviteId: COLLECTIVITE_ID,
    };

    const listed = await caller.collectivites.tags.instanceGouvernance.list(
      listInput
    );

    // Find our specific instance (there might be others from parallel tests)
    const ourInstance = listed.find(
      (item: InstanceGouvernance) => item.id === createdId
    );
    expect(ourInstance).toBeDefined();
    expect(ourInstance).toMatchObject({
      id: createdId,
      nom: createInput.nom,
      collectiviteId: COLLECTIVITE_ID,
    });

    const updateInput: UpdateInput = {
      id: createdId,
      collectiviteId: COLLECTIVITE_ID,
      nom: 'Comité de pilotage test mis à jour',
    };

    await caller.collectivites.tags.instanceGouvernance.update(updateInput);

    const listedAfterUpdate =
      await caller.collectivites.tags.instanceGouvernance.list(listInput);
    // Find our specific instance (there might be others from parallel tests)
    const ourUpdatedInstance = listedAfterUpdate.find(
      (item: InstanceGouvernance) => item.id === createdId
    );
    expect(ourUpdatedInstance).toBeDefined();
    expect(ourUpdatedInstance?.nom).toBe('Comité de pilotage test mis à jour');

    const deleted = await caller.collectivites.tags.instanceGouvernance.delete({
      id: createdId,
      collectiviteId: COLLECTIVITE_ID,
    });

    expect(deleted).toBe(true);

    const listedAfterDelete =
      await caller.collectivites.tags.instanceGouvernance.list(listInput);

    // Verify our instance is deleted (there might be others from parallel tests)
    const ourDeletedInstance = listedAfterDelete.find(
      (item: InstanceGouvernance) => item.id === createdId
    );
    expect(ourDeletedInstance).toBeUndefined();

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionInstanceGouvernanceTableTag)
        .where(
          eq(
            ficheActionInstanceGouvernanceTableTag.instanceGouvernanceTagId,
            createdId
          )
        );
      await instanceGouvernanceTagCleanup();
    });
  });

  test('update and link to fiche: happy path', async () => {
    // YOULOU_DOUDOU has EDITION rights on COLLECTIVITE_ID (1)
    const userWithRights = await getAuthUser(YOULOU_DOUDOU);
    const caller = router.createCaller({ user: userWithRights });

    const { ficheId, ficheCleanup } = await createFicheAndCleanupFunction({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche test instance-gouvernance update',
      },
    });

    const { instanceGouvernanceTagId, instanceGouvernanceTagCleanup } =
      await createInstanceGouvernanceTagAndCleanupFunction({
        caller,
        instanceGouvernanceTagInput: {
          collectiviteId: COLLECTIVITE_ID,
          nom: 'Instance à mettre à jour',
        },
      });

    const instanceId = instanceGouvernanceTagId;

    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        instanceGouvernance: [{ id: instanceId }],
      },
    });

    const fiche = await caller.plans.fiches.get({
      id: ficheId,
    });

    expect(fiche.instanceGouvernance?.length).toBe(1);
    expect(fiche.instanceGouvernance?.[0].nom).toEqual(
      'Instance à mettre à jour'
    );

    onTestFinished(async () => {
      await ficheCleanup();
      await instanceGouvernanceTagCleanup();
    });

    const updateInput: UpdateInput = {
      id: instanceId,
      collectiviteId: COLLECTIVITE_ID,
      nom: 'Instance mise à jour',
    };

    const updated = await caller.collectivites.tags.instanceGouvernance.update(
      updateInput
    );

    expect(updated).toMatchObject({
      id: instanceId,
      nom: 'Instance mise à jour',
      collectiviteId: COLLECTIVITE_ID,
    });

    const [fromDb] = await db.db
      .select()
      .from(instanceGouvernanceTagTable)
      .where(eq(instanceGouvernanceTagTable.id, instanceId));

    expect(fromDb.nom).toBe('Instance mise à jour');
  });

  test('create: rejects when user has no update rights on collectivite', async () => {
    // YOLO_DODO has rights on collectivite 1 and 2, but not on collectivite 9999
    const userWithNoRights = await getAuthUser(YOLO_DODO);
    const caller = router.createCaller({ user: userWithNoRights });

    const input: CreateInput = {
      collectiviteId: 9999, // User has no rights on this collectivite (only on collectivites 1 and 2)
      nom: 'Instance non autorisée',
    };

    await expect(async () => {
      await caller.collectivites.tags.instanceGouvernance.create(input);
    }).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });

  test('update: rejects when user has no update rights on collectivite', async () => {
    // First, create an instance with a user that has permissions (YOULOU_DOUDOU has EDITION rights on COLLECTIVITE_ID)
    const userWithRights = await getAuthUser(YOULOU_DOUDOU);
    const callerWithRights = router.createCaller({ user: userWithRights });

    const { instanceGouvernanceTagId, instanceGouvernanceTagCleanup } =
      await createInstanceGouvernanceTagAndCleanupFunction({
        caller: callerWithRights,
        instanceGouvernanceTagInput: {
          collectiviteId: COLLECTIVITE_ID,
          nom: "Instance à mettre à jour pour l'update",
        },
      });

    // Try to update with YOLO_DODO who has rights on collectivite 1 and 2, but not on collectivite 9999
    const userWithNoRights = await getAuthUser(YOLO_DODO);
    const callerWithNoRights = router.createCaller({ user: userWithNoRights });

    const updateInput: UpdateInput = {
      id: instanceGouvernanceTagId,
      collectiviteId: 9999, // User has no rights on this collectivite (only on collectivites 1 and 2)
      nom: 'Instance non autorisée',
    };

    await expect(async () => {
      await callerWithNoRights.collectivites.tags.instanceGouvernance.update(
        updateInput
      );
    }).rejects.toThrow("Vous n'avez pas les permissions nécessaires");

    // Cleanup
    onTestFinished(async () => {
      await instanceGouvernanceTagCleanup();
    });
  });

  test('delete: rejects when user has no update rights on collectivite', async () => {
    // First, create an instance with a user that has permissions (YOULOU_DOUDOU has EDITION rights on COLLECTIVITE_ID)
    const userWithRights = await getAuthUser(YOULOU_DOUDOU);
    const callerWithRights = router.createCaller({ user: userWithRights });

    const { instanceGouvernanceTagId, instanceGouvernanceTagCleanup } =
      await createInstanceGouvernanceTagAndCleanupFunction({
        caller: callerWithRights,
        instanceGouvernanceTagInput: {
          collectiviteId: COLLECTIVITE_ID,
          nom: 'Instance à supprimer permissions',
        },
      });

    // Try to delete with YOLO_DODO who has rights on collectivite 1 and 2, but not on collectivite 9999
    const userWithNoRights = await getAuthUser(YOLO_DODO);
    const callerWithNoRights = router.createCaller({ user: userWithNoRights });

    const deleteInput: DeleteInput = {
      id: instanceGouvernanceTagId,
      collectiviteId: 9999, // User has no rights on this collectivite (only on collectivites 1 and 2)
    };

    await expect(async () => {
      await callerWithNoRights.collectivites.tags.instanceGouvernance.delete(
        deleteInput
      );
    }).rejects.toThrow("Vous n'avez pas les permissions nécessaires");

    // Cleanup
    onTestFinished(async () => {
      await instanceGouvernanceTagCleanup();
    });
  });
});
