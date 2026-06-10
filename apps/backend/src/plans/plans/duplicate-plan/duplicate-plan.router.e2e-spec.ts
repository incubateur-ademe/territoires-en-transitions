import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';

describe('Dupliquer un plan', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let noAccessUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { accesRestreint: true },
    });

    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUserResult.user
    );

    const noAccessUserResult = await addTestUser(db);
    noAccessUser = getAuthUserFromUserCredentials(noAccessUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  const buildEditorCaller = () => router.createCaller({ user: editorUser });

  const cleanupPlans = (planIds: number[]) => {
    onTestFinished(async () => {
      const cleanupCaller = buildEditorCaller();
      for (const planId of planIds) {
        try {
          await cleanupCaller.plans.plans.delete({ planId });
        } catch {
          // déjà supprimé
        }
      }
    });
  };

  test("recrée le plan, son arborescence d'axes et le bon nombre de fiches", async () => {
    const caller = buildEditorCaller();

    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan source',
      collectiviteId: collectivite.id,
    });
    const axe1 = await caller.plans.axes.create({
      nom: 'Axe 1',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: sourcePlan.id,
    });
    const axe11 = await caller.plans.axes.create({
      nom: 'Axe 1.1',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: axe1.id,
    });
    const axe111 = await caller.plans.axes.create({
      nom: 'Axe 1.1.1',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: axe11.id,
    });

    const sourceFiche = await caller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Action A' },
      ficheFields: { axes: [{ id: axe111.id }] },
    });
    await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Sous-action A1',
        parentId: sourceFiche.id,
      },
    });

    const duplicated = await caller.plans.plans.duplicate({
      planId: sourcePlan.id,
      nom: 'Plan dupliqué',
    });
    cleanupPlans([sourcePlan.id, duplicated.planId]);

    expect(duplicated.planId).not.toBe(sourcePlan.id);

    const newPlan = await caller.plans.plans.get({ planId: duplicated.planId });
    expect(newPlan.nom).toBe('Plan dupliqué');
    const newAxeNoms = newPlan.axes.map((axe) => axe.nom);
    expect(newAxeNoms).toContain('Axe 1');
    expect(newAxeNoms).toContain('Axe 1.1');
    expect(newAxeNoms).toContain('Axe 1.1.1');

    const newAxe111Id = newPlan.axes.find((axe) => axe.nom === 'Axe 1.1.1')?.id;
    expect(newAxe111Id).toBeDefined();

    const { data: newParents } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { planActionIds: [duplicated.planId] },
      queryOptions: { limit: 'all' },
    });
    expect(newParents.length).toBe(1);
    const newParent = newParents[0];
    expect(newParent.id).not.toBe(sourceFiche.id);
    expect(newParent.axes?.map((axe) => axe.id)).toEqual([newAxe111Id]);

    const { data: newSousActions } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { parentsId: [newParent.id] },
      queryOptions: { limit: 'all' },
    });
    expect(newSousActions.length).toBe(1);
    expect(newSousActions[0].parentId).toBe(newParent.id);
  });

  test('recrée toutes les appartenances aux axes pour une fiche multi-axes', async () => {
    const caller = buildEditorCaller();

    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan multi-axes',
      collectiviteId: collectivite.id,
    });
    const axeA = await caller.plans.axes.create({
      nom: 'Axe A',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: sourcePlan.id,
    });
    const axeB = await caller.plans.axes.create({
      nom: 'Axe B',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: sourcePlan.id,
    });

    await caller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Action partagée' },
      ficheFields: { axes: [{ id: axeA.id }, { id: axeB.id }] },
    });

    const duplicated = await caller.plans.plans.duplicate({
      planId: sourcePlan.id,
      nom: 'Plan dupliqué',
    });
    cleanupPlans([sourcePlan.id, duplicated.planId]);

    const newPlan = await caller.plans.plans.get({ planId: duplicated.planId });
    const newAxeIds = newPlan.axes
      .filter((axe) => axe.id !== duplicated.planId)
      .map((axe) => axe.id);

    const { data: newFiches } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { planActionIds: [duplicated.planId], withChildren: true },
      queryOptions: { limit: 'all' },
    });
    const newFiche = newFiches[0];
    const ficheAxeIds = (newFiche.axes ?? []).map((axe) => axe.id).sort();

    expect(ficheAxeIds).toEqual([...newAxeIds].sort());
    expect(ficheAxeIds).not.toContain(axeA.id);
    expect(ficheAxeIds).not.toContain(axeB.id);
  });

  test('duplique un plan vide', async () => {
    const caller = buildEditorCaller();

    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan vide',
      collectiviteId: collectivite.id,
    });

    const duplicated = await caller.plans.plans.duplicate({
      planId: sourcePlan.id,
      nom: 'Plan dupliqué',
    });
    cleanupPlans([sourcePlan.id, duplicated.planId]);

    const newPlan = await caller.plans.plans.get({ planId: duplicated.planId });
    expect(newPlan.nom).toBe('Plan dupliqué');

    const { data: newFiches } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { planActionIds: [duplicated.planId], withChildren: true },
      queryOptions: { limit: 'all' },
    });
    expect(newFiches.length).toBe(0);
  });

  test('refuse la duplication à un utilisateur sans droit sur la collectivité', async () => {
    const caller = buildEditorCaller();
    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan protégé',
      collectiviteId: collectivite.id,
    });
    cleanupPlans([sourcePlan.id]);

    const unauthorizedCaller = router.createCaller({ user: noAccessUser });

    await expect(
      unauthorizedCaller.plans.plans.duplicate({
        planId: sourcePlan.id,
        nom: 'Plan dupliqué',
      })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });

  test('refuse la duplication inter-collectivités (IDOR) et ne crée rien', async () => {
    const caller = buildEditorCaller();
    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan collectivité A',
      collectiviteId: collectivite.id,
    });
    cleanupPlans([sourcePlan.id]);

    const otherResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const otherUser = getAuthUserFromUserCredentials(otherResult.user);
    const otherCaller = router.createCaller({ user: otherUser });

    const plansBefore = await otherCaller.plans.plans.list({
      collectiviteId: otherResult.collectivite.id,
    });

    await expect(
      otherCaller.plans.plans.duplicate({
        planId: sourcePlan.id,
        nom: 'Plan dupliqué',
      })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");

    const plansAfter = await otherCaller.plans.plans.list({
      collectiviteId: otherResult.collectivite.id,
    });
    expect(plansAfter.plans.length).toBe(plansBefore.plans.length);
  });

  test('renvoie une erreur quand le plan source est introuvable', async () => {
    const caller = buildEditorCaller();

    await expect(
      caller.plans.plans.duplicate({ planId: 999999, nom: 'Plan dupliqué' })
    ).rejects.toThrow("Le plan à dupliquer n'a pas été trouvé");
  });
});
