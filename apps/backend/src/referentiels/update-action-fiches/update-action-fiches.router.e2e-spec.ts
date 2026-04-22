import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { ReferentielsRouter } from '@tet/backend/referentiels/referentiels.router';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
} from 'vitest';

describe('referentiels.actions.updateLinkedFiches', () => {
  const actionId = 'cae_1.1.1';

  let db: DatabaseService;
  let app: INestApplication;
  let referentielsRouter: ReferentielsRouter;
  let adminUser: AuthenticatedUser;
  let userWithNoRights: AuthenticatedUser;
  let collectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    referentielsRouter = app.get(ReferentielsRouter);
    db = await getTestDatabase(app);

    const { collectivite } = await addTestCollectivite(db);
    collectiviteId = collectivite.id;

    const adminResult1 = await addTestUser(db);
    adminUser = getAuthUserFromUserCredentials(adminResult1.user);

    await setUserCollectiviteRole(db, {
      userId: adminResult1.user.id,
      collectiviteId,
      role: CollectiviteRole.ADMIN,
    });

    const noAccessResult = await addTestUser(db);
    userWithNoRights = getAuthUserFromUserCredentials(noAccessResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  // Crée N fiches dans la collectivité de test et retourne leurs IDs.
  const createFiches = async (count: number): Promise<number[]> => {
    const ids: number[] = [];
    for (let i = 0; i < count; i++) {
      const [row] = await db.db
        .insert(ficheActionTable)
        .values({
          titre: `Fiche lien action ${i}`,
          collectiviteId,
        })
        .returning({ id: ficheActionTable.id });
      ids.push(row.id);
    }
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionActionTable)
        .where(inArray(ficheActionActionTable.ficheId, ids));
      await db.db
        .delete(ficheActionTable)
        .where(inArray(ficheActionTable.id, ids));
    });
    return ids;
  };

  const getLinkedFicheIds = async (
    targetActionId: string
  ): Promise<number[]> => {
    const rows = await db.db
      .select({ ficheId: ficheActionActionTable.ficheId })
      .from(ficheActionActionTable)
      .where(eq(ficheActionActionTable.actionId, targetActionId));
    return rows.map((r) => r.ficheId).filter((id): id is number => id !== null);
  };

  test('Rattache une liste complète de fiches à une action', async () => {
    const ficheIds = await createFiches(3);
    const caller = referentielsRouter.createCaller({ user: adminUser });

    await caller.actions.updateLinkedFiches({
      actionId,
      collectiviteId,
      ficheIds,
    });

    const linked = await getLinkedFicheIds(actionId);
    for (const id of ficheIds) {
      expect(linked).toContain(id);
    }
  });

  test('Remplace la liste (ajout + retrait) en une seule mutation', async () => {
    const [fiche1, fiche2, fiche3] = await createFiches(3);
    const caller = referentielsRouter.createCaller({ user: adminUser });

    // Initial : 1 + 2
    await caller.actions.updateLinkedFiches({
      actionId,
      collectiviteId,
      ficheIds: [fiche1, fiche2],
    });
    let linked = await getLinkedFicheIds(actionId);
    expect(linked).toEqual(expect.arrayContaining([fiche1, fiche2]));
    expect(linked).not.toContain(fiche3);

    // Remplace : 2 + 3 (fiche1 retiré, fiche3 ajouté)
    await caller.actions.updateLinkedFiches({
      actionId,
      collectiviteId,
      ficheIds: [fiche2, fiche3],
    });
    linked = await getLinkedFicheIds(actionId);
    expect(linked).toEqual(expect.arrayContaining([fiche2, fiche3]));
    expect(linked).not.toContain(fiche1);
  });

  test('Idempotence : deux appels identiques produisent le même état', async () => {
    const ficheIds = await createFiches(2);
    const caller = referentielsRouter.createCaller({ user: adminUser });

    await caller.actions.updateLinkedFiches({
      actionId,
      collectiviteId,
      ficheIds,
    });
    await caller.actions.updateLinkedFiches({
      actionId,
      collectiviteId,
      ficheIds,
    });

    const linked = await getLinkedFicheIds(actionId);
    expect(linked.filter((id) => ficheIds.includes(id))).toHaveLength(
      ficheIds.length
    );
  });

  test('Erreur ACTION_NOT_FOUND si actionId inexistant', async () => {
    const [fiche] = await createFiches(1);
    const caller = referentielsRouter.createCaller({ user: adminUser });

    await expect(
      caller.actions.updateLinkedFiches({
        actionId: 'inexistant_9.9.9',
        collectiviteId,
        ficheIds: [fiche],
      })
    ).rejects.toThrow("n'existe pas");
  });

  test("Un utilisateur sans droits d'écriture ne peut pas rattacher", async () => {
    const ficheIds = await createFiches(1);
    const caller = referentielsRouter.createCaller({ user: userWithNoRights });

    await expect(
      caller.actions.updateLinkedFiches({ actionId, collectiviteId, ficheIds })
    ).rejects.toThrow();
  });

  test("ficheIds vide détache toutes les fiches liées à l'action", async () => {
    const ficheIds = await createFiches(2);
    const caller = referentielsRouter.createCaller({ user: adminUser });

    // Rattache d'abord
    await caller.actions.updateLinkedFiches({
      actionId,
      collectiviteId,
      ficheIds,
    });
    expect(await getLinkedFicheIds(actionId)).toEqual(
      expect.arrayContaining(ficheIds)
    );

    // ficheIds vide → détache toutes les fiches de la collectivité liées à cette action
    await caller.actions.updateLinkedFiches({
      actionId,
      collectiviteId,
      ficheIds: [],
    });

    const linked = await getLinkedFicheIds(actionId);
    for (const id of ficheIds) {
      expect(linked).not.toContain(id);
    }
  });

  test('Détache seulement les fiches de la collectivité cible (scope strict)', async () => {
    const ficheIds = await createFiches(1);
    const caller = referentielsRouter.createCaller({ user: adminUser });

    const { collectivite } = await addTestCollectivite(db);

    await setUserCollectiviteRole(db, {
      userId: adminUser.id,
      collectiviteId: collectivite.id,
      role: CollectiviteRole.ADMIN,
    });

    // Rattache une fiche de la collectivité de test à cae_1.1.1
    await caller.actions.updateLinkedFiches({
      actionId,
      collectiviteId,
      ficheIds,
    });
    expect(await getLinkedFicheIds(actionId)).toEqual(
      expect.arrayContaining(ficheIds)
    );

    // Appelle l'endpoint pour une AUTRE collectivité — ne doit rien toucher
    // sur les fiches de la collectivité de test.
    await caller.actions.updateLinkedFiches({
      actionId,
      collectiviteId: collectivite.id,
      ficheIds: [],
    });

    const linked = await getLinkedFicheIds(actionId);
    for (const id of ficheIds) {
      expect(linked).toContain(id);
    }
  });
});
