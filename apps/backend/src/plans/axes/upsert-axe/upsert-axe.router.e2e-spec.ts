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
import { and, eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { axeIndicateurTable } from '../../fiches/shared/models/axe-indicateur.table';

describe('Créer ou modifier un axe', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let noAccessUser: AuthenticatedUser;
  let planId: number;

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

    // Créer un plan pour les tests
    const caller = router.createCaller({ user: editorUser });
    const plan = await caller.plans.plans.create({
      nom: 'Plan de test',
      collectiviteId: collectivite.id,
    });
    planId = plan.id;

  });

  afterAll(async () => {
    await app.close();
  });

  describe('Créer ou modifier un axe - Cas de succès', () => {
    test('Créer avec succès un axe', async () => {
      const caller = router.createCaller({ user: editorUser });

      const axeInput = {
        nom: 'Axe à créer',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      };

      const createdAxe = await caller.plans.axes.create(axeInput);
      const axeId = createdAxe.id;
      expect(axeId).toBeDefined();

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      const plan = await caller.plans.plans.get({ planId });

      expect(plan.axes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: axeId,
            nom: axeInput.nom,
            parent: planId,
          }),
        ])
      );
    });

    test('Modifier avec succès un axe', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe à modifier',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      // Modifier l'axe
      const updatedAxe = await caller.plans.axes.update({
        id: axeId,
        nom: 'Axe modifié',
        collectiviteId: collectivite.id,
      });

      expect(updatedAxe).toEqual(
        expect.objectContaining({
          id: axeId,
          nom: 'Axe modifié',
          collectiviteId: collectivite.id,
          parent: planId,
        })
      );
    });
  });

  describe("Créer ou modifier un axe - Droits d'accès", () => {
    test('Un utilisateur sans droits sur la collectivité ne peut pas créer un axe', async () => {
      const caller = router.createCaller({ user: noAccessUser });

      await expect(
        caller.plans.axes.create({
          nom: 'Axe non autorisé',
          collectiviteId: collectivite.id,
          planId,
          parent: planId,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité ne peut pas créer un axe', async () => {
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
        caller.plans.axes.create({
          nom: 'Axe non autorisé',
          collectiviteId: collectivite.id,
          planId,
          parent: planId,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test("Un utilisateur avec des droits d'édition limités sur la collectivité ne peut pas créer un axe", async () => {
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
        caller.plans.axes.create({
          nom: 'Axe non autorisé',
          collectiviteId: collectivite.id,
          planId,
          parent: planId,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });

  describe('Créer ou modifier un axe - Indicateurs', () => {
    test('Créer avec succès un axe avec des indicateurs', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des indicateurs de test
      const indicateur1Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur 1 pour test axe',
        unite: 'kg',
      });

      const indicateur2Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur 2 pour test axe',
        unite: 'm²',
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur1Id,
          collectiviteId: collectivite.id,
        });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur2Id,
          collectiviteId: collectivite.id,
        });
      });

      // Créer un axe avec des indicateurs
      const axeInput = {
        nom: 'Axe avec indicateurs',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
        indicateurs: [{ id: indicateur1Id }, { id: indicateur2Id }],
      };

      const createdAxe = await caller.plans.axes.create(axeInput);
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      // Vérifier que les indicateurs sont associés à l'axe
      const axeIndicateurs = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));

      expect(axeIndicateurs).toHaveLength(2);
      expect(axeIndicateurs.map((ai) => ai.indicateurId)).toEqual(
        expect.arrayContaining([indicateur1Id, indicateur2Id])
      );
    });

    test('Ajouter avec succès des indicateurs à un axe existant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe sans indicateurs
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe sans indicateurs',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      // Vérifier qu'il n'y a pas d'indicateurs associés
      let axeIndicateurs = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));
      expect(axeIndicateurs).toHaveLength(0);

      // Créer des indicateurs de test
      const indicateur1Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur à ajouter 1',
        unite: 'kg',
      });

      const indicateur2Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur à ajouter 2',
        unite: 'm²',
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur1Id,
          collectiviteId: collectivite.id,
        });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur2Id,
          collectiviteId: collectivite.id,
        });
      });

      // Ajouter des indicateurs à l'axe
      await caller.plans.axes.update({
        id: axeId,
        collectiviteId: collectivite.id,
        indicateurs: [{ id: indicateur1Id }, { id: indicateur2Id }],
      });

      // Vérifier que les indicateurs sont maintenant associés
      axeIndicateurs = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));

      expect(axeIndicateurs).toHaveLength(2);
      expect(axeIndicateurs.map((ai) => ai.indicateurId)).toEqual(
        expect.arrayContaining([indicateur1Id, indicateur2Id])
      );
    });

    test("Supprimer avec succès des indicateurs d'un axe", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des indicateurs de test
      const indicateur1Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur à supprimer 1',
        unite: 'kg',
      });

      const indicateur2Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur à supprimer 2',
        unite: 'm²',
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur1Id,
          collectiviteId: collectivite.id,
        });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur2Id,
          collectiviteId: collectivite.id,
        });
      });

      // Créer un axe avec des indicateurs
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe avec indicateurs à supprimer',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
        indicateurs: [{ id: indicateur1Id }, { id: indicateur2Id }],
      });
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      // Vérifier que les indicateurs sont associés
      let axeIndicateurs = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));
      expect(axeIndicateurs).toHaveLength(2);

      // Supprimer tous les indicateurs (passer un tableau vide)
      await caller.plans.axes.update({
        id: axeId,
        collectiviteId: collectivite.id,
        indicateurs: [],
      });

      // Vérifier qu'il n'y a plus d'indicateurs associés
      axeIndicateurs = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));
      expect(axeIndicateurs).toHaveLength(0);
    });

    test("Remplacer avec succès les indicateurs d'un axe", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des indicateurs de test initiaux
      const indicateur1Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur initial 1',
        unite: 'kg',
      });

      const indicateur2Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur initial 2',
        unite: 'm²',
      });

      // Créer des indicateurs de remplacement
      const indicateur3Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur remplacement 1',
        unite: 'L',
      });

      const indicateur4Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur remplacement 2',
        unite: 'W',
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur1Id,
          collectiviteId: collectivite.id,
        });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur2Id,
          collectiviteId: collectivite.id,
        });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur3Id,
          collectiviteId: collectivite.id,
        });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur4Id,
          collectiviteId: collectivite.id,
        });
      });

      // Créer un axe avec les indicateurs initiaux
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe avec indicateurs à remplacer',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
        indicateurs: [{ id: indicateur1Id }, { id: indicateur2Id }],
      });
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      // Vérifier les indicateurs initiaux
      let axeIndicateurs = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));
      expect(axeIndicateurs).toHaveLength(2);
      expect(axeIndicateurs.map((ai) => ai.indicateurId)).toEqual(
        expect.arrayContaining([indicateur1Id, indicateur2Id])
      );

      // Remplacer par de nouveaux indicateurs
      await caller.plans.axes.update({
        id: axeId,
        collectiviteId: collectivite.id,
        indicateurs: [{ id: indicateur3Id }, { id: indicateur4Id }],
      });

      // Vérifier que les nouveaux indicateurs sont associés
      axeIndicateurs = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));

      expect(axeIndicateurs).toHaveLength(2);
      expect(axeIndicateurs.map((ai) => ai.indicateurId)).toEqual(
        expect.arrayContaining([indicateur3Id, indicateur4Id])
      );
      // Vérifier que les anciens indicateurs ne sont plus associés
      expect(axeIndicateurs.map((ai) => ai.indicateurId)).not.toContain(
        indicateur1Id
      );
      expect(axeIndicateurs.map((ai) => ai.indicateurId)).not.toContain(
        indicateur2Id
      );
    });

    test('Les colonnes createdBy/modifiedBy sont renseignées avec l’utilisateur à l’origine du lien', async () => {
      const caller = router.createCaller({ user: editorUser });

      const indicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur pour test audit',
        unite: 'kg',
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId,
          collectiviteId: collectivite.id,
        });
      });

      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe avec indicateur audité',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
        indicateurs: [{ id: indicateurId }],
      });
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      const [axeIndicateur] = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));

      expect(axeIndicateur.createdBy).toBe(editorUser.id);
      expect(axeIndicateur.modifiedBy).toBe(editorUser.id);
      expect(axeIndicateur.createdAt).not.toBeNull();
    });

    test('created_at/created_by d’un lien indicateur inchangé ne sont pas réinitialisés lors d’une mise à jour', async () => {
      const caller = router.createCaller({ user: editorUser });

      const keptIndicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur conservé',
        unite: 'kg',
      });
      const newIndicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur ajouté ensuite',
        unite: 'm²',
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: keptIndicateurId,
          collectiviteId: collectivite.id,
        });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: newIndicateurId,
          collectiviteId: collectivite.id,
        });
      });

      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe pour test de préservation',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
        indicateurs: [{ id: keptIndicateurId }],
      });
      const axeId = createdAxe.id;

      const [initialRow] = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(
          and(
            eq(axeIndicateurTable.axeId, axeId),
            eq(axeIndicateurTable.indicateurId, keptIndicateurId)
          )
        );

      // Un deuxième utilisateur ajoute un indicateur sans retirer le premier :
      // le lien préexistant ne doit pas changer de propriétaire ni de date.
      const { user: otherUser, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.ADMIN,
      });
      onTestFinished(cleanup);
      const otherCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(otherUser),
      });

      // Supprime l'axe (et en cascade ses axe_indicateur, dont le
      // created_by pointe vers otherUser) avant que le cleanup de
      // otherUser ne s'exécute (onTestFinished est LIFO).
      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      await otherCaller.plans.axes.update({
        id: axeId,
        collectiviteId: collectivite.id,
        indicateurs: [{ id: keptIndicateurId }, { id: newIndicateurId }],
      });

      const rows = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));

      const keptRow = rows.find((r) => r.indicateurId === keptIndicateurId);
      const newRow = rows.find((r) => r.indicateurId === newIndicateurId);

      expect(keptRow?.createdBy).toBe(initialRow.createdBy);
      expect(keptRow?.createdAt).toBe(initialRow.createdAt);

      expect(newRow?.createdBy).toBe(otherUser.id);
      expect(newRow?.modifiedBy).toBe(otherUser.id);
    });
  });
});
