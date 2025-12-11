import { createPersonneTag } from '@tet/backend/collectivites/collectivites.test-fixture';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.fixture';
import {
  getAuthUser,
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteAccessLevelEnum } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { planPiloteTable } from '../../fiches/shared/models/plan-pilote.table';
import { planReferentTable } from '../../fiches/shared/models/plan-referent.table';

describe('Créer ou modifier un plan', () => {
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(db, {
      user: {
        accessLevel: CollectiviteAccessLevelEnum.ADMIN,
      },
    });

    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromDcp(testCollectiviteAndUserResult.user);

    return async () => {
      await testCollectiviteAndUserResult.cleanup();
    };
  });

  describe('Créer ou modifier un plan - Cas de succès', () => {
    test('Créer avec succès un plan', async () => {
      const caller = router.createCaller({ user: editorUser });

      const planInput = {
        nom: 'Plan à créer',
        collectiviteId: collectivite.id,
      };

      const createdPlan = await caller.plans.plans.upsert(planInput);
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
      const createdPlan = await caller.plans.plans.upsert({
        nom: 'Plan à modifier',
        collectiviteId: collectivite.id,
      });
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId });
      });

      // Modifier le plan
      const updatedPlan = await caller.plans.plans.upsert({
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
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.plans.plans.upsert({
          nom: 'Plan non autorisé',
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité ne peut pas créer un plan', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: lectureUser });

      await expect(
        caller.plans.plans.upsert({
          nom: 'Plan non autorisé',
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test("Un utilisateur avec des droits d'édition limités sur la collectivité ne peut pas créer un plan", async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const limitedEditionUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: limitedEditionUser });

      await expect(
        caller.plans.plans.upsert({
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

      const createdPlan = await caller.plans.plans.upsert(planInput);
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
      const createdPlan = await caller.plans.plans.upsert({
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
      await caller.plans.plans.upsert({
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
      const createdPlan = await caller.plans.plans.upsert({
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
      await caller.plans.plans.upsert({
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
      const createdPlan = await caller.plans.plans.upsert({
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
      await caller.plans.plans.upsert({
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

      const createdPlan = await caller.plans.plans.upsert(planInput);
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
      const createdPlan = await caller.plans.plans.upsert({
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
      await caller.plans.plans.upsert({
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
      const createdPlan = await caller.plans.plans.upsert({
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
      await caller.plans.plans.upsert({
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
      const createdPlan = await caller.plans.plans.upsert({
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
      await caller.plans.plans.upsert({
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
});
