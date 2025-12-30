import { instanceGouvernanceTable } from '@tet/backend/collectivites/tags/instance-gouvernance.table';
import { ficheActionInstanceGouvernanceTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-instance-gouvernance';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
  YOULOU_DOUDOU,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';

type CreateInput = inferProcedureInput<
  AppRouter['collectivites']['instanceGouvernance']['create']
>;
type ListInput = inferProcedureInput<
  AppRouter['collectivites']['instanceGouvernance']['list']
>;
type DeleteInput = inferProcedureInput<
  AppRouter['collectivites']['instanceGouvernance']['delete']
>;
type UpdateInput = inferProcedureInput<
  AppRouter['collectivites']['instanceGouvernance']['update']
>;

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.admin;

describe('InstanceGouvernanceRouter', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);
    yoloDodoUser = await getAuthUser(YOLO_DODO);
  });

  test('list: rejects when user has no rights on collectivite', async () => {
    const userWithNoRights = await getAuthUser(YOULOU_DOUDOU);
    const caller = router.createCaller({ user: userWithNoRights });

    const input: ListInput = {
      collectiviteId: 9999,
    };

    await expect(async () => {
      await caller.collectivites.instanceGouvernance.list(input);
    }).rejects.toThrowError();
  });

  test('create / list / delete: happy path', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Crée une fiche action de test pour y rattacher une instance de gouvernance
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche test instance-gouvernance',
        createdBy: yoloDodoUser.id,
      })
      .returning();

    const ficheId = fiche.id;

    const createInput: CreateInput = {
      collectiviteId: COLLECTIVITE_ID,
      actionId: ficheId,
      nom: 'Comité de pilotage test',
    };

    const created = await caller.collectivites.instanceGouvernance.create(
      createInput
    );

    expect(created).toMatchObject({
      id: expect.any(Number),
      nom: createInput.nom,
      collectiviteId: COLLECTIVITE_ID,
    });

    const createdId = created.id;

    // Vérifie que l'instance apparaît bien dans la liste
    const listInput: ListInput = {
      collectiviteId: COLLECTIVITE_ID,
    };

    const listed = await caller.collectivites.instanceGouvernance.list(
      listInput
    );

    expect(listed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdId,
          nom: createInput.nom,
          collectiviteId: COLLECTIVITE_ID,
        }),
      ])
    );

    // Supprime l'instance
    const deleteInput: DeleteInput = {
      id: createdId,
      collectiviteId: COLLECTIVITE_ID,
    };

    const deleted = await caller.collectivites.instanceGouvernance.delete(
      deleteInput
    );

    expect(deleted).toBe(true);

    // Vérifie que l'instance et le lien ont bien été supprimés
    const remainingInstances = await db.db
      .select()
      .from(instanceGouvernanceTable)
      .where(eq(instanceGouvernanceTable.id, createdId));
    expect(remainingInstances.length).toBe(0);

    const remainingLinks = await db.db
      .select()
      .from(ficheActionInstanceGouvernanceTable)
      .where(
        eq(ficheActionInstanceGouvernanceTable.instanceGouvernanceId, createdId)
      );
    expect(remainingLinks.length).toBe(0);

    onTestFinished(async () => {
      // Nettoyage des liens et de la fiche
      await db.db
        .delete(ficheActionInstanceGouvernanceTable)
        .where(eq(ficheActionInstanceGouvernanceTable.ficheId, ficheId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));
      await db.db
        .delete(ficheActionInstanceGouvernanceTable)
        .where(
          eq(
            ficheActionInstanceGouvernanceTable.instanceGouvernanceId,
            createdId
          )
        );
      await db.db
        .delete(instanceGouvernanceTable)
        .where(eq(instanceGouvernanceTable.id, createdId));
    });
  });

  test('update: happy path', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Crée une fiche action de test
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche test instance-gouvernance update',
        createdBy: yoloDodoUser.id,
      })
      .returning();
    const ficheId = fiche.id;

    // Crée une instance de gouvernance liée à cette fiche
    const [instance] = await db.db
      .insert(instanceGouvernanceTable)
      .values({
        collectiviteId: COLLECTIVITE_ID,
        nom: 'Instance à mettre à jour',
        createdBy: yoloDodoUser.id,
      })
      .returning();
    const instanceId = instance.id;

    await db.db.insert(ficheActionInstanceGouvernanceTable).values({
      ficheId,
      instanceGouvernanceId: instanceId,
      createdBy: yoloDodoUser.id,
    });

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionInstanceGouvernanceTable)
        .where(eq(ficheActionInstanceGouvernanceTable.ficheId, ficheId));
      await db.db
        .delete(instanceGouvernanceTable)
        .where(eq(instanceGouvernanceTable.id, instanceId));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));
    });

    const updateInput: UpdateInput = {
      id: instanceId,
      collectiviteId: COLLECTIVITE_ID,
      nom: 'Instance mise à jour',
    };

    const updated = await caller.collectivites.instanceGouvernance.update(
      updateInput
    );

    expect(updated).toMatchObject({
      id: instanceId,
      nom: 'Instance mise à jour',
      collectiviteId: COLLECTIVITE_ID,
    });

    const [fromDb] = await db.db
      .select()
      .from(instanceGouvernanceTable)
      .where(eq(instanceGouvernanceTable.id, instanceId));

    expect(fromDb.nom).toBe('Instance mise à jour');
  });

  test('create: rejects when user has no update rights on collectivite', async () => {
    const userWithNoRights = await getAuthUser(YOULOU_DOUDOU);
    const caller = router.createCaller({ user: userWithNoRights });

    const input: CreateInput = {
      collectiviteId: 9999,
      actionId: 1,
      nom: 'Instance non autorisée',
    };

    await expect(async () => {
      await caller.collectivites.instanceGouvernance.create(input);
    }).rejects.toThrowError();
  });
});
