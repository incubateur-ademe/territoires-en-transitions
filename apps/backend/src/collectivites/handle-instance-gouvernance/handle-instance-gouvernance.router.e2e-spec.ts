import { INestApplication } from '@nestjs/common';
import { instanceGouvernanceTagTable } from '@tet/backend/collectivites/tags/instance-gouvernance.table';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { ficheActionInstanceGouvernanceTableTag } from '@tet/backend/plans/fiches/shared/models/fiche-action-instance-gouvernance';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { InstanceGouvernance } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
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

describe('InstanceGouvernanceRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let collectivite: Collectivite;
  let editionUser: AuthenticatedUser;
  let userWithNoRights: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUsers(db, {
      users: [
        { role: CollectiviteRole.ADMIN },
        { role: CollectiviteRole.EDITION },
      ],
    });

    collectivite = testResult.collectivite;
    editionUser = getAuthUserFromUserCredentials(testResult.users[1]);

    const noAccessResult = await addTestUser(db);
    userWithNoRights = getAuthUserFromUserCredentials(noAccessResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('list: verified visiting user is allowed to read', async () => {
    // Any verified user can read (even on a non-existent collectivite)
    const caller = router.createCaller({ user: userWithNoRights });

    const input: ListInput = {
      collectiviteId: 9999,
    };

    await expect(async () => {
      await caller.collectivites.tags.instanceGouvernance.list(input);
    }).not.toThrow();
  });

  test('create / list / update / delete: happy path', async () => {
    const caller = router.createCaller({ user: editionUser });

    const createInput: CreateInput = {
      collectiviteId: collectivite.id,
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
      collectiviteId: collectivite.id,
    };

    const listed = await caller.collectivites.tags.instanceGouvernance.list(
      listInput
    );

    const ourInstance = listed.find(
      (item: InstanceGouvernance) => item.id === createdId
    );
    expect(ourInstance).toBeDefined();
    expect(ourInstance).toMatchObject({
      id: createdId,
      nom: createInput.nom,
      collectiviteId: collectivite.id,
    });

    const updateInput: UpdateInput = {
      id: createdId,
      collectiviteId: collectivite.id,
      nom: 'Comité de pilotage test mis à jour',
    };

    await caller.collectivites.tags.instanceGouvernance.update(updateInput);

    const listedAfterUpdate =
      await caller.collectivites.tags.instanceGouvernance.list(listInput);
    const ourUpdatedInstance = listedAfterUpdate.find(
      (item: InstanceGouvernance) => item.id === createdId
    );
    expect(ourUpdatedInstance).toBeDefined();
    expect(ourUpdatedInstance?.nom).toBe('Comité de pilotage test mis à jour');

    const deleted = await caller.collectivites.tags.instanceGouvernance.delete({
      id: createdId,
      collectiviteId: collectivite.id,
    });

    expect(deleted).toBe(true);

    const listedAfterDelete =
      await caller.collectivites.tags.instanceGouvernance.list(listInput);

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
    const caller = router.createCaller({ user: editionUser });

    const { ficheId, ficheCleanup } = await createFicheAndCleanupFunction({
      caller,
      ficheInput: {
        collectiviteId: collectivite.id,
        titre: 'Fiche test instance-gouvernance update',
      },
    });

    const { instanceGouvernanceTagId, instanceGouvernanceTagCleanup } =
      await createInstanceGouvernanceTagAndCleanupFunction({
        caller,
        instanceGouvernanceTagInput: {
          collectiviteId: collectivite.id,
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
      collectiviteId: collectivite.id,
      nom: 'Instance mise à jour',
    };

    const updated = await caller.collectivites.tags.instanceGouvernance.update(
      updateInput
    );

    expect(updated).toMatchObject({
      id: instanceId,
      nom: 'Instance mise à jour',
      collectiviteId: collectivite.id,
    });

    const [fromDb] = await db.db
      .select()
      .from(instanceGouvernanceTagTable)
      .where(eq(instanceGouvernanceTagTable.id, instanceId));

    expect(fromDb.nom).toBe('Instance mise à jour');
  });

  test('create: rejects when user has no update rights on collectivite', async () => {
    const caller = router.createCaller({ user: userWithNoRights });

    const input: CreateInput = {
      collectiviteId: collectivite.id,
      nom: 'Instance non autorisée',
    };

    await expect(
      caller.collectivites.tags.instanceGouvernance.create(input)
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });

  test('update: rejects when user has no update rights on collectivite', async () => {
    const callerWithRights = router.createCaller({ user: editionUser });

    const { instanceGouvernanceTagId, instanceGouvernanceTagCleanup } =
      await createInstanceGouvernanceTagAndCleanupFunction({
        caller: callerWithRights,
        instanceGouvernanceTagInput: {
          collectiviteId: collectivite.id,
          nom: "Instance à mettre à jour pour l'update",
        },
      });

    const callerWithNoRights = router.createCaller({ user: userWithNoRights });

    const updateInput: UpdateInput = {
      id: instanceGouvernanceTagId,
      collectiviteId: collectivite.id,
      nom: 'Instance non autorisée',
    };

    await expect(
      callerWithNoRights.collectivites.tags.instanceGouvernance.update(
        updateInput
      )
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");

    onTestFinished(async () => {
      await instanceGouvernanceTagCleanup();
    });
  });

  test('delete: rejects when user has no update rights on collectivite', async () => {
    const callerWithRights = router.createCaller({ user: editionUser });

    const { instanceGouvernanceTagId, instanceGouvernanceTagCleanup } =
      await createInstanceGouvernanceTagAndCleanupFunction({
        caller: callerWithRights,
        instanceGouvernanceTagInput: {
          collectiviteId: collectivite.id,
          nom: 'Instance à supprimer permissions',
        },
      });

    const callerWithNoRights = router.createCaller({ user: userWithNoRights });

    const deleteInput: DeleteInput = {
      id: instanceGouvernanceTagId,
      collectiviteId: collectivite.id,
    };

    await expect(
      callerWithNoRights.collectivites.tags.instanceGouvernance.delete(
        deleteInput
      )
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");

    onTestFinished(async () => {
      await instanceGouvernanceTagCleanup();
    });
  });
});
