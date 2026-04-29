import { INestApplication } from '@nestjs/common';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { CollectiviteRole } from '@tet/domain/users';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import * as fs from 'node:fs';
import path from 'path';
import { expect, onTestFinished } from 'vitest';
import z from 'zod';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { addAndEnableUserSuperAdminMode } from '../../../users/users/users.test-fixture';
import { TrpcRouter } from '../../../utils/trpc/trpc.router';
import { importPlanInputSchema } from './import-plan.input';

const TEST_COLLECTIVITE_ID = 50;
const TEST_PLAN_NAME = 'import test';

const pathToInput = async ({
  pathName,
  collectiviteId = 1,
}: {
  pathName: string;
  collectiviteId?: number;
}): Promise<z.infer<typeof importPlanInputSchema>> => {
  const filePath = path.resolve(__dirname, pathName);
  const buff = fs.readFileSync(filePath);
  return {
    collectiviteId,
    planName: TEST_PLAN_NAME,
    planType: 1,
    file: buff.toString('base64'),
  };
};

describe("Test import Plan d'action", { timeout: 30_000 }, () => {
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;
  let app: INestApplication;
  let databaseService: DatabaseService;

  const deletePlan = async (
    caller: ReturnType<TrpcRouter['createCaller']>,
    planId: number
  ) => {
    // Supprime les pilotes des fiches du plan avant de supprimer le plan
    // car la suppression du plan ne cascade pas sur ficheActionPiloteTable
    const axeIds = await databaseService.db
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(eq(axeTable.plan, planId));

    const allAxeIds = [planId, ...axeIds.map((a) => a.id)];

    const ficheIds = await databaseService.db
      .select({ ficheId: ficheActionAxeTable.ficheId })
      .from(ficheActionAxeTable)
      .where(inArray(ficheActionAxeTable.axeId, allAxeIds));

    const ids = ficheIds
      .map((f) => f.ficheId)
      .filter((id): id is number => id !== null);

    if (ids.length > 0) {
      await databaseService.db
        .delete(ficheActionPiloteTable)
        .where(inArray(ficheActionPiloteTable.ficheId, ids));
    }

    await caller.plans.plans.delete({ planId });
  };

  const getFichesByTitreInPlan = async (titre: string, planId: number) => {
    const axeIds = await databaseService.db
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(eq(axeTable.plan, planId));

    const allAxeIds = [planId, ...axeIds.map((a) => a.id)];

    return databaseService.db
      .select({
        id: ficheActionTable.id,
        titre: ficheActionTable.titre,
        description: ficheActionTable.description,
        statut: ficheActionTable.statut,
        priorite: ficheActionTable.priorite,
        budgetPrevisionnel: ficheActionTable.budgetPrevisionnel,
        parentId: ficheActionTable.parentId,
        dateDebut: ficheActionTable.dateDebut,
        dateFin: ficheActionTable.dateFin,
        collectiviteId: ficheActionTable.collectiviteId,
      })
      .from(ficheActionTable)
      .innerJoin(
        ficheActionAxeTable,
        eq(ficheActionTable.id, ficheActionAxeTable.ficheId)
      )
      .where(
        and(
          eq(ficheActionTable.titre, titre),
          inArray(ficheActionAxeTable.axeId, allAxeIds)
        )
      );
  };

  const deleteAllTestPlans = async (
    caller: ReturnType<TrpcRouter['createCaller']>
  ) => {
    const plans = await databaseService.db
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(and(eq(axeTable.nom, TEST_PLAN_NAME), isNull(axeTable.parent)));

    for (const plan of plans) {
      await deletePlan(caller, plan.id);
    }
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testUserResult = await addTestUser(databaseService, {
      collectiviteId: 1,
      role: CollectiviteRole.ADMIN,
    });
    testUser = getAuthUserFromUserCredentials(testUserResult.user);

    const caller = router.createCaller({ user: testUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: testUser.id,
    });
    await deleteAllTestPlans(caller);
    await cleanup();
  });

  afterAll(async () => {
    await app.close();
  });

  test('Test utilisateur non support', async () => {
    const caller = router.createCaller({ user: testUser });
    const pathName = './__fixtures__/nouveau-plan-valide.xlsx';
    const input = await pathToInput({
      pathName,
      collectiviteId: TEST_COLLECTIVITE_ID,
    });
    await expect(caller.plans.plans.import(input)).rejects.toThrowError();
  });

  test('Utilisateur support même sans droits sur la collectivité doit pouvoir importer le plan', async () => {
    const caller = router.createCaller({ user: testUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: testUser.id,
    });

    const pathName = './__fixtures__/nouveau-plan-valide.xlsx';
    const input = await pathToInput({
      pathName,
      collectiviteId: TEST_COLLECTIVITE_ID,
    });

    const { planId } = await caller.plans.plans.import(input);
    expect(planId).toBeGreaterThan(0);

    onTestFinished(async () => {
      await deletePlan(caller, planId);
      await cleanup();
    });
  });

  test('Test import plan sans axes', async () => {
    const caller = router.createCaller({ user: testUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: testUser.id,
    });

    const pathName = './__fixtures__/plan_sans_axes.xlsx';
    const input = await pathToInput({
      pathName,
      collectiviteId: TEST_COLLECTIVITE_ID,
    });
    const { planId } = await caller.plans.plans.import(input);
    expect(planId).toBeGreaterThan(0);

    onTestFinished(async () => {
      await deletePlan(caller, planId);
      await cleanup();
    });
  });

  test('Test import plan avec une seule fiche', async () => {
    const caller = router.createCaller({ user: testUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: testUser.id,
    });

    const pathName = './__fixtures__/one_fiche_plan.xlsx';
    const input = await pathToInput({
      pathName,
      collectiviteId: TEST_COLLECTIVITE_ID,
    });
    const { planId, fichesCount } = await caller.plans.plans.import(input);
    expect(planId).toBeGreaterThan(0);
    expect(fichesCount).toBe(1);

    onTestFinished(async () => {
      await deletePlan(caller, planId);
      await cleanup();
    });

    const titreFiche =
      "Action 1. Création d'un comité de suivi d'élus autour du CLS";
    const fiches = await getFichesByTitreInPlan(titreFiche, planId);

    expect(fiches).toHaveLength(1);
    expect(fiches[0]).toMatchObject({
      titre: titreFiche,
      description: expect.stringContaining('permettre aux élus communautaires'),
      statut: 'À venir',
      priorite: 'Élevé',
      budgetPrevisionnel: '5000000',
      parentId: null,
      dateDebut: expect.stringContaining('2025-12-01'),
      dateFin: expect.stringContaining('2030-09-01'),
    });
  });

  test("Test import plan avec sous-actions échoue si l'action parente n'a pas de ligne dédiée", async () => {
    const caller = router.createCaller({ user: testUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: testUser.id,
    });
    onTestFinished(cleanup);

    const pathName = './__fixtures__/plan_with_sous_actions.xlsx';
    const input = await pathToInput({
      pathName,
      collectiviteId: TEST_COLLECTIVITE_ID,
    });
    await expect(caller.plans.plans.import(input)).rejects.toThrowError(
      'Sous-action(s) sans action parente trouvée(s) : "Sous-action 1.1", "Sous-action 1.2", "Sous-action 3.1"'
    );
  });

  test('Test import plan avec sous-actions crée les fiches parentes et les sous-actions avec parentId', async () => {
    const caller = router.createCaller({ user: testUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: testUser.id,
    });

    const pathName = './__fixtures__/plan_with_sous_actions_valid.xlsx';
    const input = await pathToInput({
      pathName,
      collectiviteId: TEST_COLLECTIVITE_ID,
    });
    const { planId } = await caller.plans.plans.import(input);
    expect(planId).toBeGreaterThan(0);

    onTestFinished(async () => {
      await deletePlan(caller, planId);
      await cleanup();
    });

    const fichesByTitre = async (titre: string) =>
      getFichesByTitreInPlan(titre, planId);

    const piloteNomsByFicheId = async (ficheId: number) =>
      databaseService.db
        .select({ nom: personneTagTable.nom })
        .from(ficheActionPiloteTable)
        .innerJoin(
          personneTagTable,
          eq(ficheActionPiloteTable.tagId, personneTagTable.id)
        )
        .where(
          and(
            eq(ficheActionPiloteTable.ficheId, ficheId),
            isNull(ficheActionPiloteTable.userId)
          )
        );

    // Normal action without sous-action
    const actionNormale = await fichesByTitre('Action normale');
    expect(actionNormale).toHaveLength(1);
    expect(actionNormale[0]).toMatchObject({
      parentId: null,
      description: 'Description action normale',
    });

    // "Action 1" has a dedicated row and should exist with no parentId
    const parentFiches = await fichesByTitre('Action 1');
    expect(parentFiches).toHaveLength(1);
    expect(parentFiches[0]).toMatchObject({ parentId: null });
    const parentId = parentFiches[0].id;

    // Sous-action 1.1 and 1.2 should reference "Action 1" as parent
    const sousAction11 = await fichesByTitre('Sous-action 1.1');
    expect(sousAction11).toHaveLength(1);
    expect(sousAction11[0]).toMatchObject({
      titre: 'Sous-action 1.1',
      description: 'Description sous-action 1.1',
      statut: 'En cours',
      dateFin: expect.stringContaining('2025-12-31'),
      parentId,
    });
    const pilotes11 = await piloteNomsByFicheId(sousAction11[0].id);
    expect(pilotes11).toHaveLength(1);
    expect(pilotes11[0].nom).toBe('Pilote SA1.1');

    const sousAction12 = await fichesByTitre('Sous-action 1.2');
    expect(sousAction12).toHaveLength(1);
    expect(sousAction12[0]).toMatchObject({
      titre: 'Sous-action 1.2',
      description: 'Description sous-action 1.2',
      statut: 'Réalisé',
      dateFin: expect.stringContaining('2026-06-30'),
      parentId,
    });
    const pilotes12 = await piloteNomsByFicheId(sousAction12[0].id);
    expect(pilotes12).toHaveLength(1);
    expect(pilotes12[0].nom).toBe('Pilote SA1.2');

    // Normal action in Axe 2
    const action2 = await fichesByTitre('Action 2');
    expect(action2).toHaveLength(1);
    expect(action2[0]).toMatchObject({
      parentId: null,
      description: 'Description action 2',
    });

    // "Action 3" has a dedicated row in a sub-axis and should exist with no parentId
    const parentFiches3 = await fichesByTitre('Action 3');
    expect(parentFiches3).toHaveLength(1);
    expect(parentFiches3[0]).toMatchObject({ parentId: null });
    const parentId3 = parentFiches3[0].id;

    // Sous-action 3.1 should reference "Action 3" as parent
    const sousAction31 = await fichesByTitre('Sous-action 3.1');
    expect(sousAction31).toHaveLength(1);
    expect(sousAction31[0]).toMatchObject({
      titre: 'Sous-action 3.1',
      description: 'Description sous-action 3.1',
      statut: 'En pause',
      dateFin: expect.stringContaining('2027-03-31'),
      parentId: parentId3,
    });
    const pilotes31 = await piloteNomsByFicheId(sousAction31[0].id);
    expect(pilotes31).toHaveLength(1);
    expect(pilotes31[0].nom).toBe('Pilote SA3.1');
  });

  test('Test import plan avec actions en doublon dans le même axe échoue', async () => {
    const caller = router.createCaller({ user: testUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: testUser.id,
    });
    onTestFinished(cleanup);

    const pathName = './__fixtures__/plan_with_duplicate_actions.xlsx';
    const input = await pathToInput({
      pathName,
      collectiviteId: TEST_COLLECTIVITE_ID,
    });
    await expect(caller.plans.plans.import(input)).rejects.toThrowError(
      "Erreur lors de la création du plan : Titres d'actions en doublon dans le même axe : Axe 1::Action dupliquée"
    );
  });

  test('Test erreur budget', async () => {
    const caller = router.createCaller({ user: testUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: testUser.id,
    });

    onTestFinished(cleanup);

    const pathName = './__fixtures__/plan_budget_issue.xlsx';
    const input = await pathToInput({ pathName });
    await expect(caller.plans.plans.import(input)).rejects.toThrowError(
      `Erreur lors de la transformation des données :
 Action avec le titre "Ajouter caméra de surveillance au parking à vélo 2040-2044" : Colonne budget: Un nombre est attendu`
    );
  });

  test('Test erreur colonne', async () => {
    const caller = router.createCaller({ user: testUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: testUser.id,
    });

    onTestFinished(cleanup);

    const pathName = './__fixtures__/plan_column_order_issue.xlsx';
    const input = await pathToInput({ pathName });
    await expect(caller.plans.plans.import(input)).rejects.toThrowError(
      `Erreur lors de la lecture du fichier Excel : La colonne B devrait être "Sous-axe (x.x)" et non "Sous-sous axe (x.x.x)"`
    );
  });

  test('Test import plan avec instances de gouvernance', async () => {
    const caller = router.createCaller({ user: testUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: testUser.id,
    });

    const pathName = './__fixtures__/one_fiche_plan.xlsx';
    const input = await pathToInput({
      pathName,
      collectiviteId: TEST_COLLECTIVITE_ID,
    });
    const { planId } = await caller.plans.plans.import(input);
    expect(planId).toBeGreaterThan(0);

    onTestFinished(async () => {
      await deletePlan(caller, planId);
      await cleanup();
    });

    const titreFiche =
      "Action 1. Création d'un comité de suivi d'élus autour du CLS";
    const fiches = await getFichesByTitreInPlan(titreFiche, planId);

    expect(fiches).toHaveLength(1);
    expect(fiches[0]).toMatchObject({ titre: titreFiche });
  });
});
