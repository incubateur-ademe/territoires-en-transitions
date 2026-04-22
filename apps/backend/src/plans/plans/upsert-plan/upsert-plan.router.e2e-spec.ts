import { INestApplication } from '@nestjs/common';
import { createPersonneTag } from '@tet/backend/collectivites/collectivites.test-fixture';
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
import { eq, inArray } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '../../fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../../fiches/shared/models/fiche-action.table';
import { planPiloteTable } from '../../fiches/shared/models/plan-pilote.table';
import { planReferentTable } from '../../fiches/shared/models/plan-referent.table';

describe('Créer ou modifier un plan', () => {
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
      user: {
        role: CollectiviteRole.ADMIN,
      },
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

  describe('Créer ou modifier un plan - Cas de succès', () => {
    test('Créer avec succès un plan', async () => {
      const caller = router.createCaller({ user: editorUser });

      const planInput = {
        nom: 'Plan à créer',
        collectiviteId: collectivite.id,
      };

      const createdPlan = await caller.plans.plans.create(planInput);
      const planId = createdPlan.id;
      expect(planId).toBeDefined();

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      const plan = await caller.plans.plans.get({ planId });

      expect(plan).toEqual(
        expect.objectContaining({
          id: planId,
          nom: planInput.nom,
          collectiviteId: collectivite.id,
        })
      );
    });

    test('Modifier avec succès un plan', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan à modifier',
        collectiviteId: collectivite.id,
      });
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      // Modifier le plan
      const updatedPlan = await caller.plans.plans.update({
        id: planId,
        nom: 'Plan modifié',
        collectiviteId: collectivite.id,
      });

      expect(updatedPlan).toEqual(
        expect.objectContaining({
          id: planId,
          nom: 'Plan modifié',
          collectiviteId: collectivite.id,
        })
      );
    });
  });

  describe("Créer ou modifier un plan - Droits d'accès", () => {
    test('Un utilisateur sans droits sur la collectivité ne peut pas créer un plan', async () => {
      const caller = router.createCaller({ user: noAccessUser });

      await expect(
        caller.plans.plans.create({
          nom: 'Plan non autorisé',
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité ne peut pas créer un plan', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromUserCredentials(user);
      const caller = router.createCaller({ user: lectureUser });

      await expect(
        caller.plans.plans.create({
          nom: 'Plan non autorisé',
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test("Un utilisateur avec des droits d'édition limités sur la collectivité ne peut pas créer un plan", async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const limitedEditionUser = getAuthUserFromUserCredentials(user);
      const caller = router.createCaller({ user: limitedEditionUser });

      await expect(
        caller.plans.plans.create({
          nom: 'Plan non autorisé',
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });

  describe('Créer ou modifier un plan - Référents', () => {
    test('Créer avec succès un plan avec des référents', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des tags de test pour les référents
      const tag1 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Référent 1 pour test plan',
        },
      });

      const tag2 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Référent 2 pour test plan',
        },
      });

      // Créer un plan avec des référents
      const planInput = {
        nom: 'Plan avec référents',
        collectiviteId: collectivite.id,
        referents: [{ tagId: tag1.id }, { tagId: tag2.id }],
      };

      const createdPlan = await caller.plans.plans.create(planInput);
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      // Vérifier que les référents sont associés au plan
      const planReferents = await db.db
        .select()
        .from(planReferentTable)
        .where(eq(planReferentTable.planId, planId));

      expect(planReferents).toHaveLength(2);
      expect(planReferents.map((pr) => pr.tagId)).toEqual(
        expect.arrayContaining([tag1.id, tag2.id])
      );
    });

    test('Ajouter avec succès des référents à un plan existant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan sans référents
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan sans référents',
        collectiviteId: collectivite.id,
      });
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      // Vérifier qu'il n'y a pas de référents associés
      let planReferents = await db.db
        .select()
        .from(planReferentTable)
        .where(eq(planReferentTable.planId, planId));
      expect(planReferents).toHaveLength(0);

      // Créer des tags de test
      const tag1 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Référent à ajouter 1',
        },
      });

      const tag2 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Référent à ajouter 2',
        },
      });

      // Ajouter des référents au plan
      await caller.plans.plans.update({
        id: planId,
        collectiviteId: collectivite.id,
        referents: [{ tagId: tag1.id }, { tagId: tag2.id }],
      });

      // Vérifier que les référents sont maintenant associés
      planReferents = await db.db
        .select()
        .from(planReferentTable)
        .where(eq(planReferentTable.planId, planId));

      expect(planReferents).toHaveLength(2);
      expect(planReferents.map((pr) => pr.tagId)).toEqual(
        expect.arrayContaining([tag1.id, tag2.id])
      );
    });

    test("Supprimer avec succès des référents d'un plan", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des tags de test
      const tag1 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Référent à supprimer 1',
        },
      });

      const tag2 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Référent à supprimer 2',
        },
      });

      // Créer un plan avec des référents
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan avec référents à supprimer',
        collectiviteId: collectivite.id,
        referents: [{ tagId: tag1.id }, { tagId: tag2.id }],
      });
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      // Vérifier que les référents sont associés
      let planReferents = await db.db
        .select()
        .from(planReferentTable)
        .where(eq(planReferentTable.planId, planId));
      expect(planReferents).toHaveLength(2);

      // Supprimer tous les référents (passer un tableau vide)
      await caller.plans.plans.update({
        id: planId,
        collectiviteId: collectivite.id,
        referents: [],
      });

      // Vérifier qu'il n'y a plus de référents associés
      planReferents = await db.db
        .select()
        .from(planReferentTable)
        .where(eq(planReferentTable.planId, planId));
      expect(planReferents).toHaveLength(0);
    });

    test("Remplacer avec succès les référents d'un plan", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des tags de test initiaux
      const tag1 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Référent initial 1',
        },
      });

      const tag2 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Référent initial 2',
        },
      });

      // Créer des tags de remplacement
      const tag3 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Référent remplacement 1',
        },
      });

      const tag4 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Référent remplacement 2',
        },
      });

      // Créer un plan avec les référents initiaux
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan avec référents à remplacer',
        collectiviteId: collectivite.id,
        referents: [{ tagId: tag1.id }, { tagId: tag2.id }],
      });
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      // Vérifier les référents initiaux
      let planReferents = await db.db
        .select()
        .from(planReferentTable)
        .where(eq(planReferentTable.planId, planId));
      expect(planReferents).toHaveLength(2);
      expect(planReferents.map((pr) => pr.tagId)).toEqual(
        expect.arrayContaining([tag1.id, tag2.id])
      );

      // Remplacer par de nouveaux référents
      await caller.plans.plans.update({
        id: planId,
        collectiviteId: collectivite.id,
        referents: [{ tagId: tag3.id }, { tagId: tag4.id }],
      });

      // Vérifier que les nouveaux référents sont associés
      planReferents = await db.db
        .select()
        .from(planReferentTable)
        .where(eq(planReferentTable.planId, planId));

      expect(planReferents).toHaveLength(2);
      expect(planReferents.map((pr) => pr.tagId)).toEqual(
        expect.arrayContaining([tag3.id, tag4.id])
      );
      // Vérifier que les anciens référents ne sont plus associés
      expect(planReferents.map((pr) => pr.tagId)).not.toContain(tag1.id);
      expect(planReferents.map((pr) => pr.tagId)).not.toContain(tag2.id);
    });
  });

  describe('Créer ou modifier un plan - Pilotes', () => {
    test('Créer avec succès un plan avec des pilotes', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des tags de test pour les pilotes
      const tag1 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Pilote 1 pour test plan',
        },
      });

      const tag2 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Pilote 2 pour test plan',
        },
      });

      // Créer un plan avec des pilotes
      const planInput = {
        nom: 'Plan avec pilotes',
        collectiviteId: collectivite.id,
        pilotes: [{ tagId: tag1.id }, { tagId: tag2.id }],
      };

      const createdPlan = await caller.plans.plans.create(planInput);
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      // Vérifier que les pilotes sont associés au plan
      const planPilotes = await db.db
        .select()
        .from(planPiloteTable)
        .where(eq(planPiloteTable.planId, planId));

      expect(planPilotes).toHaveLength(2);
      expect(planPilotes.map((pp) => pp.tagId)).toEqual(
        expect.arrayContaining([tag1.id, tag2.id])
      );
    });

    test('Ajouter avec succès des pilotes à un plan existant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan sans pilotes
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan sans pilotes',
        collectiviteId: collectivite.id,
      });
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      // Vérifier qu'il n'y a pas de pilotes associés
      let planPilotes = await db.db
        .select()
        .from(planPiloteTable)
        .where(eq(planPiloteTable.planId, planId));
      expect(planPilotes).toHaveLength(0);

      // Créer des tags de test
      const tag1 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Pilote à ajouter 1',
        },
      });

      const tag2 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Pilote à ajouter 2',
        },
      });

      // Ajouter des pilotes au plan
      await caller.plans.plans.update({
        id: planId,
        collectiviteId: collectivite.id,
        pilotes: [{ tagId: tag1.id }, { tagId: tag2.id }],
      });

      // Vérifier que les pilotes sont maintenant associés
      planPilotes = await db.db
        .select()
        .from(planPiloteTable)
        .where(eq(planPiloteTable.planId, planId));

      expect(planPilotes).toHaveLength(2);
      expect(planPilotes.map((pp) => pp.tagId)).toEqual(
        expect.arrayContaining([tag1.id, tag2.id])
      );
    });

    test("Supprimer avec succès des pilotes d'un plan", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des tags de test
      const tag1 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Pilote à supprimer 1',
        },
      });

      const tag2 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Pilote à supprimer 2',
        },
      });

      // Créer un plan avec des pilotes
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan avec pilotes à supprimer',
        collectiviteId: collectivite.id,
        pilotes: [{ tagId: tag1.id }, { tagId: tag2.id }],
      });
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      // Vérifier que les pilotes sont associés
      let planPilotes = await db.db
        .select()
        .from(planPiloteTable)
        .where(eq(planPiloteTable.planId, planId));
      expect(planPilotes).toHaveLength(2);

      // Supprimer tous les pilotes (passer un tableau vide)
      await caller.plans.plans.update({
        id: planId,
        collectiviteId: collectivite.id,
        pilotes: [],
      });

      // Vérifier qu'il n'y a plus de pilotes associés
      planPilotes = await db.db
        .select()
        .from(planPiloteTable)
        .where(eq(planPiloteTable.planId, planId));
      expect(planPilotes).toHaveLength(0);
    });

    test("Remplacer avec succès les pilotes d'un plan", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des tags de test initiaux
      const tag1 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Pilote initial 1',
        },
      });

      const tag2 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Pilote initial 2',
        },
      });

      // Créer des tags de remplacement
      const tag3 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Pilote remplacement 1',
        },
      });

      const tag4 = await createPersonneTag({
        database: db,
        tagData: {
          collectiviteId: collectivite.id,
          nom: 'Pilote remplacement 2',
        },
      });

      // Créer un plan avec les pilotes initiaux
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan avec pilotes à remplacer',
        collectiviteId: collectivite.id,
        pilotes: [{ tagId: tag1.id }, { tagId: tag2.id }],
      });
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      // Vérifier les pilotes initiaux
      let planPilotes = await db.db
        .select()
        .from(planPiloteTable)
        .where(eq(planPiloteTable.planId, planId));
      expect(planPilotes).toHaveLength(2);
      expect(planPilotes.map((pp) => pp.tagId)).toEqual(
        expect.arrayContaining([tag1.id, tag2.id])
      );

      // Remplacer par de nouveaux pilotes
      await caller.plans.plans.update({
        id: planId,
        collectiviteId: collectivite.id,
        pilotes: [{ tagId: tag3.id }, { tagId: tag4.id }],
      });

      // Vérifier que les nouveaux pilotes sont associés
      planPilotes = await db.db
        .select()
        .from(planPiloteTable)
        .where(eq(planPiloteTable.planId, planId));

      expect(planPilotes).toHaveLength(2);
      expect(planPilotes.map((pp) => pp.tagId)).toEqual(
        expect.arrayContaining([tag3.id, tag4.id])
      );
      // Vérifier que les anciens pilotes ne sont plus associés
      expect(planPilotes.map((pp) => pp.tagId)).not.toContain(tag1.id);
      expect(planPilotes.map((pp) => pp.tagId)).not.toContain(tag2.id);
    });
  });

  describe('Rendre un plan privé (setFichesPrivate)', () => {
    // Crée un plan racine avec N fiches rattachées via fiche_action_axe.
    // Retourne l'id du plan et les ids des fiches (avec cleanup automatique).
    const createPlanWithFiches = async (count: number) => {
      const caller = router.createCaller({ user: editorUser });
      const plan = await caller.plans.plans.create({
        nom: `Plan setPrivate test ${Date.now()}`,
        collectiviteId: collectivite.id,
      });

      const ficheIds: number[] = [];
      for (let i = 0; i < count; i++) {
        const [row] = await db.db
          .insert(ficheActionTable)
          .values({
            titre: `Fiche setPrivate ${i}`,
            collectiviteId: collectivite.id,
            restreint: false,
          })
          .returning({ id: ficheActionTable.id });
        ficheIds.push(row.id);
        await db.db.insert(ficheActionAxeTable).values({
          ficheId: row.id,
          axeId: plan.id,
        });
      }

      onTestFinished(async () => {
        for (const id of ficheIds) {
          await db.db
            .delete(ficheActionAxeTable)
            .where(eq(ficheActionAxeTable.ficheId, id));
          await db.db
            .delete(ficheActionTable)
            .where(eq(ficheActionTable.id, id));
        }
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId: plan.id });
      });

      return { planId: plan.id, ficheIds };
    };

    const getIsPrivateByFicheId = async (ficheIds: number[]) => {
      const rows = await db.db
        .select({
          id: ficheActionTable.id,
          restreint: ficheActionTable.restreint,
        })
        .from(ficheActionTable)
        .where(inArray(ficheActionTable.id, ficheIds));
      return new Map(rows.map((r) => [r.id, r.restreint]));
    };

    test("Rend privées toutes les fiches d'un plan", async () => {
      const { planId, ficheIds } = await createPlanWithFiches(3);
      const caller = router.createCaller({ user: editorUser });

      await caller.plans.plans.setFichesPrivate({ planId, isPrivate: true });

      const ficheMap = await getIsPrivateByFicheId(ficheIds);
      for (const id of ficheIds) {
        expect(ficheMap.get(id)).toBe(true);
      }
    });

    test("Remet publiques toutes les fiches d'un plan", async () => {
      const { planId, ficheIds } = await createPlanWithFiches(2);
      const caller = router.createCaller({ user: editorUser });

      await caller.plans.plans.setFichesPrivate({ planId, isPrivate: true });
      await caller.plans.plans.setFichesPrivate({ planId, isPrivate: false });

      const ficheMap = await getIsPrivateByFicheId(ficheIds);
      for (const id of ficheIds) {
        expect(ficheMap.get(id)).toBe(false);
      }
    });

    test('Plan sans fiches : mutation succède sans erreur', async () => {
      const caller = router.createCaller({ user: editorUser });
      const plan = await caller.plans.plans.create({
        nom: 'Plan vide setPrivate',
        collectiviteId: collectivite.id,
      });
      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId: plan.id });
      });

      await expect(
        caller.plans.plans.setFichesPrivate({
          planId: plan.id,
          isPrivate: true,
        })
      ).resolves.toBeUndefined();
    });

    test("Erreur NOT_A_PLAN si l'axe cible a un parent", async () => {
      const caller = router.createCaller({ user: editorUser });
      const plan = await caller.plans.plans.create({
        nom: 'Plan parent',
        collectiviteId: collectivite.id,
      });
      const [childAxe] = await db.db
        .insert(axeTable)
        .values({
          nom: 'Axe enfant',
          collectiviteId: collectivite.id,
          parent: plan.id,
          plan: plan.id,
        })
        .returning({ id: axeTable.id });
      onTestFinished(async () => {
        await db.db.delete(axeTable).where(eq(axeTable.id, childAxe.id));
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId: plan.id });
      });

      await expect(
        caller.plans.plans.setFichesPrivate({
          planId: childAxe.id,
          isPrivate: true,
        })
      ).rejects.toThrow("n'est pas un plan");
    });

    test('Erreur PLAN_NOT_FOUND si le planId est inexistant', async () => {
      const caller = router.createCaller({ user: editorUser });
      await expect(
        caller.plans.plans.setFichesPrivate({
          planId: 999999999,
          isPrivate: true,
        })
      ).rejects.toThrow("Le plan demandé n'existe pas");
    });

    test(`Un utilisateur sans droits sur la collectivité ne peut pas rendre les fiches d'un plan privées`, async () => {
      const { planId } = await createPlanWithFiches(1);
      const caller = router.createCaller({ user: noAccessUser });

      await expect(
        caller.plans.plans.setFichesPrivate({ planId, isPrivate: true })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test("Un utilisateur avec des droits d'édition limités ne peut pas rendre privé", async () => {
      const { planId } = await createPlanWithFiches(1);
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });
      onTestFinished(async () => {
        await cleanup();
      });

      const limitedUser = getAuthUserFromUserCredentials(user);
      const caller = router.createCaller({ user: limitedUser });

      await expect(
        caller.plans.plans.setFichesPrivate({ planId, isPrivate: true })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Met à jour modifiedBy + modifiedAt de chaque fiche', async () => {
      const { planId, ficheIds } = await createPlanWithFiches(1);
      const ficheId = ficheIds[0];

      const caller = router.createCaller({ user: editorUser });
      await caller.plans.plans.setFichesPrivate({ planId, isPrivate: true });

      const [after] = await db.db
        .select({
          modifiedBy: ficheActionTable.modifiedBy,
          modifiedAt: ficheActionTable.modifiedAt,
        })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));

      expect(after.modifiedBy).toBe(editorUser.id);
      expect(after.modifiedAt).toBeTruthy();
    });
  });
});
