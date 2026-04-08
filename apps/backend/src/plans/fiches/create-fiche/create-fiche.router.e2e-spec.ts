import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
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

describe('Create Fiche Action', () => {
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

  describe('Create Fiche Action - Success Cases', () => {
    test('Successfully create a fiche action', async () => {
      const caller = router.createCaller({ user: editorUser });

      const ficheInput = {
        titre: 'Fiche à créer',
        collectiviteId: collectivite.id,
      };

      const createdFiche = await caller.plans.fiches.create({
        fiche: ficheInput,
      });
      const ficheId = createdFiche.id;
      assert(ficheId);

      onTestFinished(async () => {
        await caller.plans.fiches.delete({ ficheId, deleteMode: 'hard' });
      });

      const fiche = await caller.plans.fiches.get({ id: ficheId });

      expect(fiche).toEqual(
        expect.objectContaining({
          id: ficheId,
          titre: ficheInput.titre,
          collectiviteId: collectivite.id,
        })
      );
    });
  });

  describe('Create Fiche Action - Validation', () => {
    test('Cannot create a fiche with a titre exceeding 300 characters', async () => {
      const caller = router.createCaller({ user: editorUser });

      const longTitre = 'a'.repeat(301);

      await expect(
        caller.plans.fiches.create({
          fiche: {
            titre: longTitre,
            collectiviteId: collectivite.id,
          },
        })
      ).rejects.toThrow('Le titre ne doit pas dépasser 300 caractères');
    });
  });

  describe('Create Fiche Action - Access Rights', () => {
    test('User without rights on collectivite cannot create fiche', async () => {
      const caller = router.createCaller({ user: noAccessUser });

      await expect(
        caller.plans.fiches.create({
          fiche: {
            titre: 'Fiche non autorisée',
            collectiviteId: collectivite.id,
          },
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${noAccessUser.id} n'a pas l'autorisation plans.fiches.create sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('User with lecture rights on collectivite cannot create fiche', async () => {
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
        caller.plans.fiches.create({
          fiche: {
            titre: 'Fiche non autorisée',
            collectiviteId: collectivite.id,
          },
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation plans.fiches.create sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('User with limited edition rights on collectivite cannot create fiche', async () => {
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
        caller.plans.fiches.create({
          fiche: {
            titre: 'Fiche non autorisée',
            collectiviteId: collectivite.id,
          },
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation plans.fiches.create sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('Contributeur pilote can create a sous-action under a fiche they pilot', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const editorCaller = router.createCaller({ user: editorUser });
      const parentFiche = await editorCaller.plans.fiches.create({
        fiche: {
          titre: 'Fiche parente pilotée par le contributeur',
          collectiviteId: collectivite.id,
        },
      });
      const parentFicheId = parentFiche.id;
      assert(parentFicheId);

      await db.db.insert(ficheActionPiloteTable).values({
        ficheId: parentFicheId,
        userId: user.id,
      });

      const contributeurUser = getAuthUserFromUserCredentials(user);
      const contributeurCaller = router.createCaller({
        user: contributeurUser,
      });

      const sousAction = await contributeurCaller.plans.fiches.create({
        fiche: {
          titre: 'Sous-action créée par le contributeur',
          collectiviteId: collectivite.id,
          parentId: parentFicheId,
        },
      });
      const sousActionId = sousAction.id;
      expect(sousActionId).toBeDefined();

      onTestFinished(async () => {
        await editorCaller.plans.fiches.delete({
          ficheId: sousActionId,
          deleteMode: 'hard',
        });
        await editorCaller.plans.fiches.delete({
          ficheId: parentFicheId,
          deleteMode: 'hard',
        });
      });

      expect(sousAction).toEqual(
        expect.objectContaining({
          id: sousActionId,
          parentId: parentFicheId,
          collectiviteId: collectivite.id,
        })
      );
    });

    test('Contributeur non-pilote cannot create a sous-action under a fiche they do not pilot', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const editorCaller = router.createCaller({ user: editorUser });
      const parentFiche = await editorCaller.plans.fiches.create({
        fiche: {
          titre: 'Fiche parente non pilotée par le contributeur',
          collectiviteId: collectivite.id,
        },
      });
      const parentFicheId = parentFiche.id;
      assert(parentFicheId);

      onTestFinished(async () => {
        await editorCaller.plans.fiches.delete({
          ficheId: parentFicheId,
          deleteMode: 'hard',
        });
      });

      const contributeurUser = getAuthUserFromUserCredentials(user);
      const contributeurCaller = router.createCaller({
        user: contributeurUser,
      });

      await expect(
        contributeurCaller.plans.fiches.create({
          fiche: {
            titre: 'Sous-action non autorisée',
            collectiviteId: collectivite.id,
            parentId: parentFicheId,
          },
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation plans.fiches.update sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('Cannot create a sous-action in a different collectivite than its parent fiche', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      const otherCollectiviteAndUser = await addTestCollectiviteAndUser(db, {
        user: {
          role: CollectiviteRole.ADMIN,
        },
      });
      const otherCollectivite = otherCollectiviteAndUser.collectivite;

      onTestFinished(async () => {
        await cleanup();
        await otherCollectiviteAndUser.cleanup();
      });

      const editorCaller = router.createCaller({ user: editorUser });
      const parentFiche = await editorCaller.plans.fiches.create({
        fiche: {
          titre: 'Fiche parente dans la collectivité principale',
          collectiviteId: collectivite.id,
        },
      });
      const parentFicheId = parentFiche.id;
      assert(parentFicheId);

      await db.db.insert(ficheActionPiloteTable).values({
        ficheId: parentFicheId,
        userId: user.id,
      });

      onTestFinished(async () => {
        await editorCaller.plans.fiches.delete({
          ficheId: parentFicheId,
          deleteMode: 'hard',
        });
      });

      const contributeurUser = getAuthUserFromUserCredentials(user);
      const contributeurCaller = router.createCaller({
        user: contributeurUser,
      });

      // Le contributeur pilote la fiche parente (dans la collectivité principale),
      // mais tente de créer une sous-action dans une autre collectivité :
      // la création doit être refusée.
      await expect(
        contributeurCaller.plans.fiches.create({
          fiche: {
            titre: 'Sous-action avec mauvaise collectivité',
            collectiviteId: otherCollectivite.id,
            parentId: parentFicheId,
          },
        })
      ).rejects.toThrow(
        `La sous-action doit appartenir à la même collectivité que la fiche parente ${parentFicheId}`
      );
    });
  });
});
